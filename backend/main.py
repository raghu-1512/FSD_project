from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import User, Medicine, Batch, Recall, Notification, InventoryTransaction
from .schemas import UserLogin, UserRegister, UserResponse, Token
from .auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from .routers import medicines, batches, recalls, inventory, reports, notifications

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Medicine Expiry & Recall Alert System API",
    description="RESTful backend API for tracking pharmaceutical inventory batches, automated 4-tier expiry alerts, and safety recall quarantine.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for local React dev server and preview environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Auth Endpoints -----------------
@app.post("/auth/login", response_model=Token, tags=["Authentication"])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email.lower().strip()).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    new_user = User(
        email=user_in.email.lower().strip(),
        full_name=user_in.full_name.strip(),
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role or "staff",
        role_title=user_in.role_title or ("Chief Pharmacy Administrator" if user_in.role == "admin" else "Pharmacy Staff"),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

# ----------------- Include Routers -----------------
app.include_router(medicines.router)
app.include_router(batches.router)
app.include_router(recalls.router)
app.include_router(inventory.router)
app.include_router(reports.router)
app.include_router(notifications.router)

@app.get("/", tags=["Health"])
def root():
    return {
        "system": "Medicine Expiry & Recall Alert System API",
        "status": "online",
        "docs": "/docs",
        "database": "SQLite",
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}

# ----------------- Seed Demonstration Data on Startup -----------------
@app.on_event("startup")
def seed_initial_demo_data():
    db = next(get_db())
    try:
        # 1. Seed demo accounts if empty
        if db.query(User).count() == 0:
            admin_user = User(
                email="admin@pharmashield.demo",
                full_name="Dr. Sarah Mitchell",
                hashed_password=get_password_hash("demo123"),
                role="admin",
                role_title="Chief Pharmacy Administrator",
            )
            staff_user = User(
                email="staff@pharmashield.demo",
                full_name="Alex Rivera, CPhT",
                hashed_password=get_password_hash("demo123"),
                role="staff",
                role_title="Pharmacy Inventory Specialist",
            )
            db.add_all([admin_user, staff_user])
            db.commit()

        # 2. Seed initial medicines if empty
        if db.query(Medicine).count() == 0:
            sample_meds = [
                Medicine(
                    id="MED-101",
                    medicine_name="Paracetamol 500 mg",
                    category="Analgesics",
                    manufacturer="Apex Pharma Ltd (Demo)",
                    description="First-line analgesic and antipyretic for mild to moderate pain and fever.",
                    unit="tablets",
                    min_stock_level=100,
                ),
                Medicine(
                    id="MED-102",
                    medicine_name="Amoxicillin 250 mg",
                    category="Antibiotics",
                    manufacturer="BioCure Therapeutics (Demo)",
                    description="Broad-spectrum penicillin antibiotic for bacterial respiratory infections.",
                    unit="capsules",
                    min_stock_level=80,
                ),
                Medicine(
                    id="MED-103",
                    medicine_name="Cetirizine 10 mg",
                    category="Antihistamines",
                    manufacturer="NovaCare Healthcare (Demo)",
                    description="Second-generation antihistamine used to relieve allergy symptoms.",
                    unit="tablets",
                    min_stock_level=60,
                ),
                Medicine(
                    id="MED-104",
                    medicine_name="Vitamin C 500 mg",
                    category="Vitamins & Supplements",
                    manufacturer="Vitality Health Labs (Demo)",
                    description="Ascorbic acid dietary supplement supporting immune defense.",
                    unit="tablets",
                    min_stock_level=50,
                ),
                Medicine(
                    id="MED-105",
                    medicine_name="Ibuprofen 200 mg",
                    category="Analgesics",
                    manufacturer="Zenith Life Sciences (Demo)",
                    description="NSAID used for arthritis, muscular aches, and acute inflammation.",
                    unit="tablets",
                    min_stock_level=75,
                ),
                Medicine(
                    id="MED-106",
                    medicine_name="Omeprazole 20 mg",
                    category="Gastrointestinal",
                    manufacturer="BioCure Therapeutics (Demo)",
                    description="Proton-pump inhibitor for reducing stomach acid and GERD.",
                    unit="capsules",
                    min_stock_level=40,
                ),
                Medicine(
                    id="MED-107",
                    medicine_name="Metformin 500 mg",
                    category="Antidiabetic",
                    manufacturer="Apex Pharma Ltd (Demo)",
                    description="Oral biguanide anti-hyperglycemic agent for type 2 diabetes.",
                    unit="tablets",
                    min_stock_level=90,
                ),
                Medicine(
                    id="MED-108",
                    medicine_name="Azithromycin 500 mg",
                    category="Antibiotics",
                    manufacturer="NovaCare Healthcare (Demo)",
                    description="Macrolide antibiotic used for a wide variety of bacterial infections.",
                    unit="tablets",
                    min_stock_level=30,
                ),
            ]
            db.add_all(sample_meds)
            db.commit()

        # 3. Seed initial batches if empty
        if db.query(Batch).count() == 0:
            today = date.today()
            sample_batches = [
                Batch(
                    id="BAT-201",
                    medicine_id="MED-101",
                    batch_number="PARA-2025-A1",
                    manufacturing_date=(today - timedelta(days=200)).isoformat(),
                    expiry_date=(today + timedelta(days=240)).isoformat(),  # Safe (>90d)
                    quantity=450,
                    purchase_price=2.20,
                    supplier_name="Global MedDistributors",
                    status="Safe",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-202",
                    medicine_id="MED-101",
                    batch_number="PARA-2024-C9",
                    manufacturing_date=(today - timedelta(days=400)).isoformat(),
                    expiry_date=(today + timedelta(days=14)).isoformat(),  # Expiring Soon (1-30d)
                    quantity=85,
                    purchase_price=2.10,
                    supplier_name="Global MedDistributors",
                    status="Expiring Soon",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-203",
                    medicine_id="MED-102",
                    batch_number="AMOX-2025-X4",
                    manufacturing_date=(today - timedelta(days=180)).isoformat(),
                    expiry_date=(today + timedelta(days=60)).isoformat(),  # Expiring Later (31-90d)
                    quantity=160,
                    purchase_price=4.80,
                    supplier_name="PharmaSupply Direct",
                    status="Expiring Later",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-204",
                    medicine_id="MED-102",
                    batch_number="AMOX-2024-B2",
                    manufacturing_date=(today - timedelta(days=450)).isoformat(),
                    expiry_date=(today - timedelta(days=12)).isoformat(),  # Expired (<=0d)
                    quantity=40,
                    purchase_price=4.50,
                    supplier_name="PharmaSupply Direct",
                    status="Expired",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-205",
                    medicine_id="MED-103",
                    batch_number="CETI-2025-K7",
                    manufacturing_date=(today - timedelta(days=150)).isoformat(),
                    expiry_date=(today + timedelta(days=180)).isoformat(),  # Safe
                    quantity=320,
                    purchase_price=1.75,
                    supplier_name="NovaCare Logistics",
                    status="Safe",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-206",
                    medicine_id="MED-104",
                    batch_number="VITC-2025-M3",
                    manufacturing_date=(today - timedelta(days=190)).isoformat(),
                    expiry_date=(today + timedelta(days=22)).isoformat(),  # Expiring Soon
                    quantity=110,
                    purchase_price=3.10,
                    supplier_name="Vitality Wholesale",
                    status="Expiring Soon",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-207",
                    medicine_id="MED-105",
                    batch_number="IBUP-2025-R8",
                    manufacturing_date=(today - timedelta(days=170)).isoformat(),
                    expiry_date=(today + timedelta(days=75)).isoformat(),  # Expiring Later
                    quantity=210,
                    purchase_price=2.90,
                    supplier_name="Zenith Logistics",
                    status="Expiring Later",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-208",
                    medicine_id="MED-106",
                    batch_number="OMEP-2024-Q1",
                    manufacturing_date=(today - timedelta(days=380)).isoformat(),
                    expiry_date=(today - timedelta(days=25)).isoformat(),  # Expired
                    quantity=65,
                    purchase_price=5.40,
                    supplier_name="BioCure Supply Co",
                    status="Expired",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-209",
                    medicine_id="MED-107",
                    batch_number="METF-2025-Z2",
                    manufacturing_date=(today - timedelta(days=130)).isoformat(),
                    expiry_date=(today + timedelta(days=300)).isoformat(),  # Safe
                    quantity=500,
                    purchase_price=1.85,
                    supplier_name="Global MedDistributors",
                    status="Safe",
                    is_recalled=False,
                ),
                Batch(
                    id="BAT-210",
                    medicine_id="MED-108",
                    batch_number="AZIT-2025-T5",
                    manufacturing_date=(today - timedelta(days=100)).isoformat(),
                    expiry_date=(today + timedelta(days=150)).isoformat(),
                    quantity=90,
                    purchase_price=8.50,
                    supplier_name="NovaCare Logistics",
                    status="Recalled",
                    is_recalled=True,
                    recall_id="REC-301",
                ),
            ]
            db.add_all(sample_batches)
            db.commit()

        # 4. Seed initial recall if empty
        if db.query(Recall).count() == 0:
            sample_recall = Recall(
                id="REC-301",
                batch_id="BAT-210",
                batch_number="AZIT-2025-T5",
                medicine_name="Azithromycin 500 mg",
                recall_reason="Packaging Issue",
                recall_date=date.today().isoformat(),
                recall_status="active",
                notes="Demonstration recall: seal integrity discrepancy flagged by regulatory compliance. Immediate quarantine required.",
                reported_by="Dr. Sarah Mitchell",
            )
            db.add(sample_recall)
            db.commit()

        # 5. Seed initial notifications if empty
        if db.query(Notification).count() == 0:
            sample_notifs = [
                Notification(
                    id="NOTIF-001",
                    type="recall_active",
                    title="Active Recall Issued: Azithromycin 500 mg",
                    message="Batch AZIT-2025-T5 was flagged for Packaging Issue. Stock marked unavailable for dispensing.",
                    severity="critical",
                    date=date.today().isoformat(),
                    reference_id="REC-301",
                    is_read=False,
                ),
                Notification(
                    id="NOTIF-002",
                    type="expiry_soon",
                    title="Expiring Soon: Paracetamol 500 mg",
                    message="Batch PARA-2024-C9 has 14 days remaining before expiry. Dispense first.",
                    severity="high",
                    date=date.today().isoformat(),
                    reference_id="BAT-202",
                    is_read=False,
                ),
                Notification(
                    id="NOTIF-003",
                    type="expired",
                    title="Expired Stock Flagged: Amoxicillin 250 mg",
                    message="Batch AMOX-2024-B2 has passed its expiration date. Moved out of available inventory.",
                    severity="medium",
                    date=date.today().isoformat(),
                    reference_id="BAT-204",
                    is_read=False,
                ),
            ]
            db.add_all(sample_notifs)
            db.commit()

        # 6. Seed sample inventory transactions if empty
        if db.query(InventoryTransaction).count() == 0:
            sample_tx = [
                InventoryTransaction(
                    id="LOG-001",
                    batch_id="BAT-201",
                    batch_number="PARA-2025-A1",
                    medicine_name="Paracetamol 500 mg",
                    previous_qty=500,
                    new_qty=450,
                    change=-50,
                    reason="Sale",
                    performed_by="Alex Rivera, CPhT",
                    date=date.today().isoformat(),
                ),
                InventoryTransaction(
                    id="LOG-002",
                    batch_id="BAT-205",
                    batch_number="CETI-2025-K7",
                    medicine_name="Cetirizine 10 mg",
                    previous_qty=270,
                    new_qty=320,
                    change=50,
                    reason="Restock",
                    performed_by="Dr. Sarah Mitchell",
                    date=date.today().isoformat(),
                ),
            ]
            db.add_all(sample_tx)
            db.commit()

    finally:
        db.close()
