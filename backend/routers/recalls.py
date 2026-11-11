from datetime import datetime, date
from typing import List, Optional
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Recall, Batch, Notification, User
from ..schemas import RecallCreate, RecallUpdate, RecallResponse
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/recalls", tags=["Recalls"])

@router.get("", response_model=List[RecallResponse])
def get_recalls(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Recall)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Recall.recall_status == status_filter.lower())

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Recall.batch_number.ilike(search_filter))
            | (Recall.medicine_name.ilike(search_filter))
            | (Recall.recall_reason.ilike(search_filter))
            | (Recall.id.ilike(search_filter))
        )
    return query.order_by(Recall.created_at.desc()).all()

@router.get("/{id}", response_model=RecallResponse)
def get_recall(id: str, db: Session = Depends(get_db)):
    rec = db.query(Recall).filter(Recall.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recall record not found")
    return rec

@router.get("/batch/{batch_number}", response_model=RecallResponse)
def get_recall_by_batch(batch_number: str, db: Session = Depends(get_db)):
    rec = db.query(Recall).filter(Recall.batch_number == batch_number.strip().upper()).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"No recall found for batch number '{batch_number}'")
    return rec

@router.post("", response_model=RecallResponse, status_code=status.HTTP_201_CREATED)
def create_recall(
    recall_in: RecallCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),  # Only Admin can issue recalls
):
    # 1. Fetch batch
    batch = db.query(Batch).filter(Batch.id == recall_in.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Target batch for recall does not exist")

    recall_id = f"REC-{random.randint(1000, 9999)}"
    med_name = batch.medicine.medicine_name if batch.medicine else "Unknown Medicine"
    order_date = recall_in.recall_date or date.today().isoformat()

    # 2. Create recall record
    new_recall = Recall(
        id=recall_id,
        batch_id=batch.id,
        batch_number=batch.batch_number,
        medicine_name=med_name,
        recall_reason=recall_in.recall_reason,
        recall_date=order_date,
        recall_status="active",
        notes=recall_in.notes,
        reported_by=admin_user.full_name or admin_user.email,
    )
    db.add(new_recall)

    # 3. Automatically quarantine batch and mark is_recalled = True
    batch.is_recalled = True
    batch.status = "Recalled"
    batch.recall_id = recall_id

    # 4. Generate critical in-app notification
    notif = Notification(
        id=f"NOTIF-{random.randint(1000, 9999)}",
        type="recall_active",
        title=f"CRITICAL RECALL: {med_name}",
        message=f"Batch lot {batch.batch_number} has been officially RECALLED ({recall_in.recall_reason}). Quarantined immediately.",
        severity="critical",
        date=order_date,
        reference_id=recall_id,
        is_read=False,
    )
    db.add(notif)

    db.commit()
    db.refresh(new_recall)
    return new_recall

@router.put("/{id}", response_model=RecallResponse)
def update_recall_status(
    id: str,
    update_in: RecallUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = db.query(Recall).filter(Recall.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recall record not found")

    rec.recall_status = update_in.recall_status
    if update_in.recall_status == "closed":
        rec.closed_at = date.today().isoformat()
        rec.closed_reason = update_in.closed_reason or "Regulatory case resolved and inventory neutralized."
        # Update associated batch
        batch = db.query(Batch).filter(Batch.id == rec.batch_id).first()
        if batch:
            batch.is_recalled = False
            batch.status = "Safe" if (datetime.strptime(batch.expiry_date, "%Y-%m-%d").date() - date.today()).days > 30 else "Expiring Soon"

    db.commit()
    db.refresh(rec)
    return rec
