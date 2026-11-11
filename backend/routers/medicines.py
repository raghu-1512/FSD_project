from typing import List, Optional
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Medicine, Batch, User
from ..schemas import MedicineCreate, MedicineUpdate, MedicineResponse
from ..auth import get_current_user

router = APIRouter(prefix="/medicines", tags=["Medicines"])

def generate_med_id(db: Session) -> str:
    count = db.query(Medicine).count() + 101
    return f"MED-{count}"

@router.get("", response_model=List[MedicineResponse])
def get_medicines(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Medicine)
    if category and category.lower() != "all":
        query = query.filter(Medicine.category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Medicine.medicine_name.ilike(search_filter))
            | (Medicine.manufacturer.ilike(search_filter))
            | (Medicine.id.ilike(search_filter))
            | (Medicine.category.ilike(search_filter))
        )
    return query.order_by(Medicine.id.desc()).all()

@router.get("/{id}", response_model=MedicineResponse)
def get_medicine(id: str, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return med

@router.post("", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    med_in: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Generate unique ID if not passed
    med_id = med_in.id or generate_med_id(db)

    # Check collision
    existing = db.query(Medicine).filter(Medicine.id == med_id).first()
    if existing:
        med_id = f"MED-{random.randint(1000, 9999)}"

    medicine = Medicine(
        id=med_id,
        medicine_name=med_in.medicine_name.strip(),
        category=med_in.category,
        manufacturer=med_in.manufacturer.strip(),
        description=med_in.description or "",
        unit=med_in.unit or "tablets",
        min_stock_level=med_in.min_stock_level or 50,
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return medicine

@router.put("/{id}", response_model=MedicineResponse)
def update_medicine(
    id: str,
    med_in: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    med = db.query(Medicine).filter(Medicine.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    update_data = med_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(med, key, value)

    db.commit()
    db.refresh(med)
    return med

@router.delete("/{id}")
def delete_medicine(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    med = db.query(Medicine).filter(Medicine.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    # Prevent deletion if associated batches exist
    batch_count = db.query(Batch).filter(Batch.medicine_id == id).count()
    if batch_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete medicine: {batch_count} active batch lot(s) are registered under this medicine. Delete or reassign those batches first.",
        )

    db.delete(med)
    db.commit()
    return {"message": "Medicine deleted successfully", "id": id}
