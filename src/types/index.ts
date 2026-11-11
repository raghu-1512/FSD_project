export type Role = 'admin' | 'staff';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: Role;
  roleTitle: string;
}

export type MedicineCategory =
  | 'Analgesics'
  | 'Antibiotics'
  | 'Antihistamines'
  | 'Vitamins & Supplements'
  | 'Cardiovascular'
  | 'Gastrointestinal'
  | 'Respiratory'
  | 'Antidiabetic'
  | 'Other';

export interface Medicine {
  id: string; // e.g., "MED-001"
  name: string;
  category: MedicineCategory;
  manufacturer: string;
  description: string;
  unit: string; // e.g., "tablets", "capsules", "bottles", "strips"
  minStockLevel: number;
  createdAt: string;
}

export type ExpiryStatus = 'safe' | 'expiring_later' | 'expiring_soon' | 'expired';

export interface Batch {
  id: string; // e.g., "BAT-001"
  medicineId: string;
  medicineName: string;
  batchNumber: string; // unique, e.g., "B-2025-081"
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  purchasePrice: number; // e.g., 4.50
  supplierName: string;
  isRecalled?: boolean;
  recallId?: string;
  status?: string;
  daysRemaining?: number;
  isAvailableForSale?: boolean;
  createdAt?: string;
}

export type RecallReason =
  | 'Quality Issue'
  | 'Manufacturing Defect'
  | 'Contamination'
  | 'Packaging Issue'
  | 'Safety Concern'
  | 'Other';

export type RecallStatus = 'active' | 'closed';

export interface Recall {
  id: string; // e.g., "REC-001"
  batchId: string;
  batchNumber: string;
  medicineId?: string;
  medicineName: string;
  reason: RecallReason;
  recallDate: string;
  status: RecallStatus;
  notes: string;
  reportedBy: string;
  closedAt?: string;
  closedReason?: string;
}

export interface AppNotification {
  id: string;
  type: 'expiry_soon' | 'expired' | 'recall_active' | 'low_stock';
  title: string;
  message: string;
  date: string;
  read: boolean;
  referenceId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface InventoryLog {
  id: string;
  batchId: string;
  batchNumber: string;
  medicineName: string;
  previousQty: number;
  newQty: number;
  change: number;
  reason: 'Sale' | 'Restock' | 'Damage / Disposal' | 'Audit Adjustment' | string;
  date: string;
  performedBy: string;
}
