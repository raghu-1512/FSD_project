from datetime import date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Medicine, Batch, Recall, Notification
from ..schemas import DashboardStatsResponse, BatchResponse
from .batches import calculate_days_remaining, evaluate_status, format_batch_response

router = APIRouter(tags=["Reports & Dashboard"])

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    medicines_count = db.query(Medicine).count()
    batches = db.query(Batch).all()

    safe_count = 0
    expiring_later_count = 0
    expiring_soon_count = 0
    expired_count = 0
    recalled_count = 0
    available_stock = 0
    total_stock_units = 0
    inventory_total_value = 0.0

    for b in batches:
        days = calculate_days_remaining(b.expiry_date)
        status_label, is_avail = evaluate_status(days, b.is_recalled)

        total_stock_units += b.quantity
        inventory_total_value += b.quantity * (b.purchase_price or 0.0)

        if b.is_recalled:
            recalled_count += 1
        elif status_label == "Expired":
            expired_count += 1
        elif status_label == "Expiring Soon":
            expiring_soon_count += 1
        elif status_label == "Expiring Later":
            expiring_later_count += 1
        else:
            safe_count += 1

        if is_avail:
            available_stock += b.quantity

    unread_notifications = db.query(Notification).filter(Notification.is_read == False).count()

    return {
        "total_medicines": medicines_count,
        "total_batches": len(batches),
        "expiring_soon_count": expiring_soon_count,
        "expired_count": expired_count,
        "recalled_count": recalled_count,
        "safe_count": safe_count,
        "expiring_later_count": expiring_later_count,
        "available_stock": available_stock,
        "total_stock_units": total_stock_units,
        "inventory_total_value": round(inventory_total_value, 2),
        "unread_notifications": unread_notifications,
    }

# Expiry alert specific endpoints requested in Section 6
@router.get("/expiry-alerts", response_model=List[BatchResponse])
def get_expiry_alerts(db: Session = Depends(get_db)):
    batches = db.query(Batch).all()
    results = [format_batch_response(b) for b in batches]
    # Sort by days remaining ascending (most urgent first)
    return sorted(results, key=lambda x: x["days_remaining"])

@router.get("/expiry-alerts/expiring-soon", response_model=List[BatchResponse])
def get_expiring_soon_alerts(db: Session = Depends(get_db)):
    batches = db.query(Batch).all()
    results = [format_batch_response(b) for b in batches if not b.is_recalled and 0 < calculate_days_remaining(b.expiry_date) <= 30]
    return sorted(results, key=lambda x: x["days_remaining"])

@router.get("/expiry-alerts/expired", response_model=List[BatchResponse])
def get_expired_alerts(db: Session = Depends(get_db)):
    batches = db.query(Batch).all()
    results = [format_batch_response(b) for b in batches if not b.is_recalled and calculate_days_remaining(b.expiry_date) <= 0]
    return sorted(results, key=lambda x: x["days_remaining"])

# General report endpoints
@router.get("/reports/medicines")
def get_medicine_report(db: Session = Depends(get_db)):
    meds = db.query(Medicine).all()
    report = []
    for m in meds:
        batch_count = db.query(Batch).filter(Batch.medicine_id == m.id).count()
        total_units = sum(b.quantity for b in db.query(Batch).filter(Batch.medicine_id == m.id, Batch.is_recalled == False).all())
        report.append({
            "id": m.id,
            "medicine_name": m.medicine_name,
            "category": m.category,
            "manufacturer": m.manufacturer,
            "batches_count": batch_count,
            "available_stock": total_units,
            "unit": m.unit,
        })
    return report

@router.get("/reports/batches")
def get_batch_report(db: Session = Depends(get_db)):
    batches = db.query(Batch).all()
    return [format_batch_response(b) for b in batches]

@router.get("/reports/recalls")
def get_recall_report(db: Session = Depends(get_db)):
    recalls = db.query(Recall).order_by(Recall.created_at.desc()).all()
    return recalls
