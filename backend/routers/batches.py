from datetime import datetime, date
from typing import List, Optional
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Batch, Medicine, Notification, User
from ..schemas import BatchCreate, BatchUpdate, BatchResponse
from ..auth import get_current_user

router = APIRouter(prefix="/batches", tags=["Batches"])

def calculate_days_remaining(expiry_str: str) -> int:
    try:
        exp_date = datetime.strptime(expiry_str.strip(), "%Y-%m-%d").date()
        today = date.today()
        return (exp_date - today).days
    except Exception:
        return 0

def evaluate_status(days_remaining: int, is_recalled: bool) -> tuple[str, bool]:
    """Returns (status_label, is_available_for_sale)"""
    if is_recalled:
        return "Recalled", False
    if days_remaining <= 0:
        return "Expired", False
    if days_remaining <= 30:
        return "Expiring Soon", True
    if days_remaining <= 90:
        return "Expiring Later", True
    return "Safe", True

def format_batch_response(batch: Batch) -> dict:
    days = calculate_days_remaining(batch.expiry_date)
    status_label, is_available = evaluate_status(days, batch.is_recalled)
    med_name = batch.medicine.medicine_name if batch.medicine else "Unknown Medicine"
    return {
        "id": batch.id,
        "medicine_id": batch.medicine_id,
        "medicine_name": med_name,
        "batch_number": batch.batch_number,
        "manufacturing_date": batch.manufacturing_date,
        "expiry_date": batch.expiry_date,
        "quantity": batch.quantity,
        "purchase_price": batch.purchase_price,
        "supplier_name": batch.supplier_name,
        "status": status_label,
        "is_recalled": batch.is_recalled,
        "recall_id": batch.recall_id,
        "days_remaining": days,
        "is_available_for_sale": is_available,
    }

@router.get("", response_model=List[BatchResponse])
def get_batches(
    search: Optional[str] = Query(None),
    medicine_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Batch).join(Medicine)
    if medicine_id and medicine_id.lower() != "all":
        query = query.filter(Batch.medicine_id == medicine_id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Batch.batch_number.ilike(search_filter))
            | (Medicine.medicine_name.ilike(search_filter))
            | (Batch.supplier_name.ilike(search_filter))
            | (Batch.id.ilike(search_filter))
        )

    all_batches = query.order_by(Batch.created_at.desc()).all()
    results = [format_batch_response(b) for b in all_batches]

    if status_filter and status_filter.lower() != "all":
        s = status_filter.lower()
        if s == "safe":
            results = [b for b in results if b["status"] == "Safe"]
        elif s == "expiring_later":
            results = [b for b in results if b["status"] == "Expiring Later"]
        elif s == "expiring_soon":
            results = [b for b in results if b["status"] == "Expiring Soon"]
        elif s == "expired":
            results = [b for b in results if b["status"] == "Expired"]
        elif s == "recalled":
            results = [b for b in results if b["is_recalled"]]

    return results

@router.get("/{id}", response_model=BatchResponse)
def get_batch(id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return format_batch_response(batch)

@router.post("", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    batch_in: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Verify medicine exists
    med = db.query(Medicine).filter(Medicine.id == batch_in.medicine_id).first()
    if not med:
        raise HTTPException(status_code=400, detail="Referenced medicine does not exist")

    # 2. Verify unique batch_number
    existing = db.query(Batch).filter(Batch.batch_number == batch_in.batch_number.strip().upper()).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Batch lot number '{batch_in.batch_number}' is already registered in the system.",
        )

    # 3. Validate chronology
    try:
        mfg = datetime.strptime(batch_in.manufacturing_date, "%Y-%m-%d").date()
        exp = datetime.strptime(batch_in.expiry_date, "%Y-%m-%d").date()
        if exp <= mfg:
            raise HTTPException(
                status_code=400,
                detail="Expiry date must be strictly after the manufacturing date.",
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # 4. Generate batch ID
    batch_id = batch_in.id or f"BAT-{random.randint(1000, 9999)}"

    days_rem = (exp - date.today()).days
    status_label, is_avail = evaluate_status(days_rem, False)

    new_batch = Batch(
        id=batch_id,
        medicine_id=batch_in.medicine_id,
        batch_number=batch_in.batch_number.strip().upper(),
        manufacturing_date=batch_in.manufacturing_date,
        expiry_date=batch_in.expiry_date,
        quantity=batch_in.quantity,
        purchase_price=batch_in.purchase_price or 0.0,
        supplier_name=batch_in.supplier_name.strip(),
        status=status_label,
        is_recalled=False,
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    # Automated in-app notification trigger for expiring/expired lots
    if days_rem <= 0:
        notif = Notification(
            id=f"NOTIF-{random.randint(1000, 9999)}",
            type="expired",
            title=f"Expired Batch Registered: {med.medicine_name}",
            message=f"Batch {new_batch.batch_number} registered with expired date ({new_batch.expiry_date}). Automatically quarantined.",
            severity="high",
            date=date.today().isoformat(),
            reference_id=new_batch.id,
            is_read=False,
        )
        db.add(notif)
        db.commit()
    elif days_rem <= 30:
        notif = Notification(
            id=f"NOTIF-{random.randint(1000, 9999)}",
            type="expiry_soon",
            title=f"Expiring Soon Alert: {med.medicine_name}",
            message=f"Batch {new_batch.batch_number} expires in {days_rem} days ({new_batch.expiry_date}). Prioritize dispatch.",
            severity="medium",
            date=date.today().isoformat(),
            reference_id=new_batch.id,
            is_read=False,
        )
        db.add(notif)
        db.commit()

    return format_batch_response(new_batch)

@router.put("/{id}", response_model=BatchResponse)
def update_batch(
    id: str,
    batch_in: BatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch = db.query(Batch).filter(Batch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    update_data = batch_in.model_dump(exclude_unset=True)

    if "batch_number" in update_data:
        new_bn = update_data["batch_number"].strip().upper()
        existing = db.query(Batch).filter(Batch.id != id, Batch.batch_number == new_bn).first()
        if existing:
            raise HTTPException(status_code=400, detail="Batch number already in use by another batch.")
        update_data["batch_number"] = new_bn

    mfg_str = update_data.get("manufacturing_date", batch.manufacturing_date)
    exp_str = update_data.get("expiry_date", batch.expiry_date)
    try:
        mfg = datetime.strptime(mfg_str, "%Y-%m-%d").date()
        exp = datetime.strptime(exp_str, "%Y-%m-%d").date()
        if exp <= mfg:
            raise HTTPException(status_code=400, detail="Expiry date must be later than manufacturing date.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")

    for k, v in update_data.items():
        setattr(batch, k, v)

    days = calculate_days_remaining(batch.expiry_date)
    status_label, _ = evaluate_status(days, batch.is_recalled)
    batch.status = status_label

    db.commit()
    db.refresh(batch)
    return format_batch_response(batch)

@router.delete("/{id}")
def delete_batch(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch = db.query(Batch).filter(Batch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch.is_recalled:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete batch under active recall. Safety compliance records must be preserved.",
        )

    db.delete(batch)
    db.commit()
    return {"message": "Batch lot deleted successfully", "id": id}
