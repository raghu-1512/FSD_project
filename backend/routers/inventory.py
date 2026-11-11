from datetime import datetime, date
from typing import List, Optional
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Batch, InventoryTransaction, Notification, Medicine, User
from ..schemas import StockUpdateRequest, InventoryTransactionResponse, BatchResponse
from ..auth import get_current_user
from .batches import calculate_days_remaining, evaluate_status, format_batch_response

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[BatchResponse])
def get_inventory(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Batch).join(Medicine)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Batch.batch_number.ilike(search_filter))
            | (Medicine.medicine_name.ilike(search_filter))
        )
    batches = query.order_by(Batch.created_at.desc()).all()
    results = [format_batch_response(b) for b in batches]

    if status_filter:
        s = status_filter.lower()
        if s == "available":
            results = [b for b in results if b["is_available_for_sale"] and b["quantity"] > 0]
        elif s == "low_stock":
            results = [b for b in results if b["is_available_for_sale"] and b["quantity"] < 25]
        elif s == "quarantined":
            results = [b for b in results if not b["is_available_for_sale"]]

    return results

@router.get("/available", response_model=List[BatchResponse])
def get_available_stock(db: Session = Depends(get_db)):
    batches = db.query(Batch).filter(Batch.is_recalled == False).all()
    results = [format_batch_response(b) for b in batches]
    return [b for b in results if b["is_available_for_sale"] and b["quantity"] > 0]

@router.get("/expired", response_model=List[BatchResponse])
def get_expired_stock(db: Session = Depends(get_db)):
    batches = db.query(Batch).all()
    results = [format_batch_response(b) for b in batches]
    return [b for b in results if b["status"] == "Expired"]

@router.get("/recalled", response_model=List[BatchResponse])
def get_recalled_stock(db: Session = Depends(get_db)):
    batches = db.query(Batch).filter(Batch.is_recalled == True).all()
    return [format_batch_response(b) for b in batches]

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def get_inventory_transactions(db: Session = Depends(get_db)):
    return db.query(InventoryTransaction).order_by(InventoryTransaction.created_at.desc()).all()

@router.post("/{batch_id}/stock", response_model=BatchResponse)
def update_stock(
    batch_id: str,
    stock_in: StockUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch lot not found")

    if stock_in.new_quantity < 0:
        raise HTTPException(status_code=400, detail="Stock quantity cannot be negative.")

    days = calculate_days_remaining(batch.expiry_date)
    status_label, is_avail = evaluate_status(days, batch.is_recalled)

    # Business rule: Disallow dispensing/sale if batch is expired or recalled!
    if stock_in.reason == "Sale" and not is_avail:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot dispense stock from a {status_label.upper()} batch. This stock is quarantined by regulatory safety rules.",
        )

    prev_qty = batch.quantity
    change = stock_in.new_quantity - prev_qty
    batch.quantity = stock_in.new_quantity

    med_name = batch.medicine.medicine_name if batch.medicine else "Unknown"
    user_name = current_user.full_name or current_user.email

    # Log transaction
    trans = InventoryTransaction(
        id=f"LOG-{random.randint(1000, 9999)}",
        batch_id=batch.id,
        batch_number=batch.batch_number,
        medicine_name=med_name,
        previous_qty=prev_qty,
        new_qty=stock_in.new_quantity,
        change=change,
        reason=stock_in.reason,
        performed_by=user_name,
        date=date.today().isoformat(),
    )
    db.add(trans)

    # Check for low stock notification
    if stock_in.new_quantity < 20 and prev_qty >= 20:
        notif = Notification(
            id=f"NOTIF-{random.randint(1000, 9999)}",
            type="low_stock",
            title=f"Low Stock Notice: {med_name}",
            message=f"Batch {batch.batch_number} has dropped to {stock_in.new_quantity} units remaining.",
            severity="low",
            date=date.today().isoformat(),
            reference_id=batch.id,
            is_read=False,
        )
        db.add(notif)

    db.commit()
    db.refresh(batch)
    return format_batch_response(batch)
