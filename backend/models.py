from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="staff", nullable=False)  # "admin" or "staff"
    role_title = Column(String(100), default="Pharmacy Staff")
    created_at = Column(DateTime, default=datetime.utcnow)

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "MED-101"
    medicine_name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    manufacturer = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(50), default="tablets")
    min_stock_level = Column(Integer, default=50)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    batches = relationship("Batch", back_populates="medicine", cascade="all, delete-orphan")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "BAT-201"
    medicine_id = Column(String(50), ForeignKey("medicines.id"), nullable=False, index=True)
    batch_number = Column(String(100), unique=True, index=True, nullable=False)
    manufacturing_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    expiry_date = Column(String(50), nullable=False, index=True)  # YYYY-MM-DD
    quantity = Column(Integer, default=0, nullable=False)
    purchase_price = Column(Float, default=0.0)
    supplier_name = Column(String(255), nullable=False)
    status = Column(String(50), default="Safe")  # Safe, Expiring Soon, Expiring Later, Expired, Recalled
    is_recalled = Column(Boolean, default=False, index=True)
    recall_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    medicine = relationship("Medicine", back_populates="batches")

class Recall(Base):
    __tablename__ = "recalls"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "REC-301"
    batch_id = Column(String(50), ForeignKey("batches.id"), nullable=False, index=True)
    batch_number = Column(String(100), nullable=False, index=True)
    medicine_name = Column(String(255), nullable=False)
    recall_reason = Column(String(100), nullable=False)  # Quality Issue, Contamination, etc.
    recall_date = Column(String(50), nullable=False)
    recall_status = Column(String(50), default="active", index=True)  # active, closed
    notes = Column(Text, nullable=False)
    reported_by = Column(String(255), nullable=False)
    closed_at = Column(String(50), nullable=True)
    closed_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "LOG-001"
    batch_id = Column(String(50), nullable=False, index=True)
    batch_number = Column(String(100), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    previous_qty = Column(Integer, nullable=False)
    new_qty = Column(Integer, nullable=False)
    change = Column(Integer, nullable=False)
    reason = Column(String(100), nullable=False)  # Sale, Restock, Damage / Disposal, Audit Adjustment
    performed_by = Column(String(255), nullable=False)
    date = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "NOTIF-001"
    type = Column(String(50), nullable=False)  # expiry_soon, expired, recall_active, low_stock
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="medium")  # low, medium, high, critical
    date = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    reference_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
