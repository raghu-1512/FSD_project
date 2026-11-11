from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: Optional[str] = "staff"
    role_title: Optional[str] = "Pharmacy Staff"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    role_title: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# ----------------- Medicine Schemas -----------------
class MedicineBase(BaseModel):
    medicine_name: str
    category: str
    manufacturer: str
    description: Optional[str] = ""
    unit: Optional[str] = "tablets"
    min_stock_level: Optional[int] = 50

class MedicineCreate(MedicineBase):
    id: Optional[str] = None

class MedicineUpdate(BaseModel):
    medicine_name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    min_stock_level: Optional[int] = None

class MedicineResponse(MedicineBase):
    id: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- Batch Schemas -----------------
class BatchBase(BaseModel):
    medicine_id: str
    batch_number: str
    manufacturing_date: str
    expiry_date: str
    quantity: int = Field(..., ge=0)
    purchase_price: Optional[float] = 0.0
    supplier_name: str

class BatchCreate(BatchBase):
    id: Optional[str] = None

class BatchUpdate(BaseModel):
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    purchase_price: Optional[float] = None
    supplier_name: Optional[str] = None

class BatchResponse(BatchBase):
    id: str
    medicine_name: Optional[str] = None
    status: str
    is_recalled: bool = False
    recall_id: Optional[str] = None
    days_remaining: Optional[int] = None
    is_available_for_sale: Optional[bool] = True

    class Config:
        from_attributes = True

# ----------------- Recall Schemas -----------------
class RecallCreate(BaseModel):
    batch_id: str
    recall_reason: str
    recall_date: Optional[str] = None
    notes: str

class RecallUpdate(BaseModel):
    recall_status: str  # active, closed
    closed_reason: Optional[str] = None

class RecallResponse(BaseModel):
    id: str
    batch_id: str
    batch_number: str
    medicine_name: str
    recall_reason: str
    recall_date: str
    recall_status: str
    notes: str
    reported_by: str
    closed_at: Optional[str] = None
    closed_reason: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- Inventory Schemas -----------------
class StockUpdateRequest(BaseModel):
    new_quantity: int = Field(..., ge=0)
    reason: str  # Sale, Restock, Damage / Disposal, Audit Adjustment

class InventoryTransactionResponse(BaseModel):
    id: str
    batch_id: str
    batch_number: str
    medicine_name: str
    previous_qty: int
    new_qty: int
    change: int
    reason: str
    performed_by: str
    date: str

    class Config:
        from_attributes = True

# ----------------- Notification Schemas -----------------
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    severity: str
    date: str
    is_read: bool
    reference_id: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- Dashboard & Reports Schemas -----------------
class DashboardStatsResponse(BaseModel):
    total_medicines: int
    total_batches: int
    expiring_soon_count: int
    expired_count: int
    recalled_count: int
    safe_count: int
    expiring_later_count: int
    available_stock: int
    total_stock_units: int
    inventory_total_value: float
    unread_notifications: int
