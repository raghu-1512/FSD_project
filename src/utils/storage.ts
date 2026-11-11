import { Medicine, Batch, Recall, User, AppNotification, InventoryLog } from '../types';

const STORAGE_KEYS = {
  MEDICINES: 'pharma_medicines_v1',
  BATCHES: 'pharma_batches_v1',
  RECALLS: 'pharma_recalls_v1',
  NOTIFICATIONS: 'pharma_notifications_v1',
  INVENTORY_LOGS: 'pharma_inventory_logs_v1',
  AUTH_USER: 'pharma_auth_user_v1',
  SYSTEM_DATE_OVERRIDE: 'pharma_date_override_v1',
};

// Demo user accounts
export const DEMO_USERS: Record<string, User> = {
  admin: {
    id: 'USR-001',
    name: 'Raghu',
    email: 'raghumullu044@gmail.com',
    role: 'admin',
    roleTitle: 'Chief Pharmacy Administrator',
  },
  staff: {
    id: 'USR-002',
    name: 'Raghu (Staff)',
    email: 'raghumullu044@gmail.com',
    role: 'staff',
    roleTitle: 'Pharmacy Inventory Specialist',
  },
};

/**
 * Reusable ID generator with prefixes
 */
export function generateId(prefix: string): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const timeSuffix = Date.now().toString().slice(-4);
  return `${prefix}-${timeSuffix}${randomSuffix.toString().slice(0, 2)}`;
}

// Helpers for relative date strings (YYYY-MM-DD)
function getDateOffset(days: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Build initial realistic sample demonstration dataset
 */
export function createInitialSampleData(baseDate: Date = new Date()) {
  const medicines: Medicine[] = [
    {
      id: 'MED-101',
      name: 'Paracetamol 500 mg',
      category: 'Analgesics',
      manufacturer: 'Apex Pharma Ltd (Demo)',
      description: 'First-line analgesic and antipyretic for mild to moderate pain and fever.',
      unit: 'tablets',
      minStockLevel: 100,
      createdAt: getDateOffset(-120, baseDate),
    },
    {
      id: 'MED-102',
      name: 'Amoxicillin 250 mg',
      category: 'Antibiotics',
      manufacturer: 'BioCure Therapeutics (Demo)',
      description: 'Broad-spectrum penicillin antibiotic for bacterial respiratory and ear infections.',
      unit: 'capsules',
      minStockLevel: 80,
      createdAt: getDateOffset(-100, baseDate),
    },
    {
      id: 'MED-103',
      name: 'Cetirizine 10 mg',
      category: 'Antihistamines',
      manufacturer: 'NovaCare Healthcare (Demo)',
      description: 'Second-generation antihistamine used to relieve allergy symptoms such as runny nose and hives.',
      unit: 'tablets',
      minStockLevel: 60,
      createdAt: getDateOffset(-90, baseDate),
    },
    {
      id: 'MED-104',
      name: 'Vitamin C 500 mg',
      category: 'Vitamins & Supplements',
      manufacturer: 'Vitality Health Labs (Demo)',
      description: 'Ascorbic acid dietary supplement supporting immune defense and antioxidant protection.',
      unit: 'tablets',
      minStockLevel: 50,
      createdAt: getDateOffset(-80, baseDate),
    },
    {
      id: 'MED-105',
      name: 'Ibuprofen 200 mg',
      category: 'Analgesics',
      manufacturer: 'Zenith Life Sciences (Demo)',
      description: 'Non-steroidal anti-inflammatory drug (NSAID) used for arthritis, muscular aches, and inflammation.',
      unit: 'tablets',
      minStockLevel: 75,
      createdAt: getDateOffset(-70, baseDate),
    },
    {
      id: 'MED-106',
      name: 'Omeprazole 20 mg',
      category: 'Gastrointestinal',
      manufacturer: 'BioCure Therapeutics (Demo)',
      description: 'Proton-pump inhibitor for reducing stomach acid, treating GERD and peptic ulcers.',
      unit: 'capsules',
      minStockLevel: 40,
      createdAt: getDateOffset(-60, baseDate),
    },
    {
      id: 'MED-107',
      name: 'Metformin 500 mg',
      category: 'Antidiabetic',
      manufacturer: 'Apex Pharma Ltd (Demo)',
      description: 'Oral biguanide anti-hyperglycemic agent for management of type 2 diabetes.',
      unit: 'tablets',
      minStockLevel: 90,
      createdAt: getDateOffset(-50, baseDate),
    },
    {
      id: 'MED-108',
      name: 'Azithromycin 500 mg',
      category: 'Antibiotics',
      manufacturer: 'NovaCare Healthcare (Demo)',
      description: 'Macrolide antibiotic used for a wide variety of bacterial infections.',
      unit: 'tablets',
      minStockLevel: 30,
      createdAt: getDateOffset(-40, baseDate),
    },
  ];

  // Batches representing all 4 expiry categories + 1 recalled batch
  const batches: Batch[] = [
    {
      id: 'BAT-201',
      medicineId: 'MED-101',
      medicineName: 'Paracetamol 500 mg',
      batchNumber: 'PARA-2025-A1',
      manufacturingDate: getDateOffset(-200, baseDate),
      expiryDate: getDateOffset(240, baseDate), // >90 days: Safe
      quantity: 450,
      purchasePrice: 2.20,
      supplierName: 'Global MedDistributors',
      createdAt: getDateOffset(-120, baseDate),
    },
    {
      id: 'BAT-202',
      medicineId: 'MED-101',
      medicineName: 'Paracetamol 500 mg',
      batchNumber: 'PARA-2024-C9',
      manufacturingDate: getDateOffset(-400, baseDate),
      expiryDate: getDateOffset(14, baseDate), // 1-30 days: Expiring Soon!
      quantity: 85,
      purchasePrice: 2.10,
      supplierName: 'Global MedDistributors',
      createdAt: getDateOffset(-100, baseDate),
    },
    {
      id: 'BAT-203',
      medicineId: 'MED-102',
      medicineName: 'Amoxicillin 250 mg',
      batchNumber: 'AMOX-2025-X4',
      manufacturingDate: getDateOffset(-180, baseDate),
      expiryDate: getDateOffset(60, baseDate), // 31-90 days: Expiring Later
      quantity: 160,
      purchasePrice: 4.80,
      supplierName: 'PharmaSupply Direct',
      createdAt: getDateOffset(-85, baseDate),
    },
    {
      id: 'BAT-204',
      medicineId: 'MED-102',
      medicineName: 'Amoxicillin 250 mg',
      batchNumber: 'AMOX-2024-B2',
      manufacturingDate: getDateOffset(-450, baseDate),
      expiryDate: getDateOffset(-12, baseDate), // <=0 days: Expired!
      quantity: 40,
      purchasePrice: 4.50,
      supplierName: 'PharmaSupply Direct',
      createdAt: getDateOffset(-80, baseDate),
    },
    {
      id: 'BAT-205',
      medicineId: 'MED-103',
      medicineName: 'Cetirizine 10 mg',
      batchNumber: 'CETI-2025-K7',
      manufacturingDate: getDateOffset(-150, baseDate),
      expiryDate: getDateOffset(180, baseDate), // Safe
      quantity: 320,
      purchasePrice: 1.75,
      supplierName: 'NovaCare Logistics',
      createdAt: getDateOffset(-70, baseDate),
    },
    {
      id: 'BAT-206',
      medicineId: 'MED-104',
      medicineName: 'Vitamin C 500 mg',
      batchNumber: 'VITC-2025-M3',
      manufacturingDate: getDateOffset(-190, baseDate),
      expiryDate: getDateOffset(22, baseDate), // Expiring Soon!
      quantity: 110,
      purchasePrice: 3.10,
      supplierName: 'Vitality Wholesale',
      createdAt: getDateOffset(-65, baseDate),
    },
    {
      id: 'BAT-207',
      medicineId: 'MED-105',
      medicineName: 'Ibuprofen 200 mg',
      batchNumber: 'IBUP-2025-R8',
      manufacturingDate: getDateOffset(-170, baseDate),
      expiryDate: getDateOffset(75, baseDate), // Expiring Later
      quantity: 210,
      purchasePrice: 2.90,
      supplierName: 'Zenith Logistics',
      createdAt: getDateOffset(-55, baseDate),
    },
    {
      id: 'BAT-208',
      medicineId: 'MED-106',
      medicineName: 'Omeprazole 20 mg',
      batchNumber: 'OMEP-2024-Q1',
      manufacturingDate: getDateOffset(-380, baseDate),
      expiryDate: getDateOffset(-25, baseDate), // Expired!
      quantity: 65,
      purchasePrice: 5.40,
      supplierName: 'BioCure Supply Co',
      createdAt: getDateOffset(-50, baseDate),
    },
    {
      id: 'BAT-209',
      medicineId: 'MED-107',
      medicineName: 'Metformin 500 mg',
      batchNumber: 'METF-2025-Z2',
      manufacturingDate: getDateOffset(-130, baseDate),
      expiryDate: getDateOffset(300, baseDate), // Safe
      quantity: 500,
      purchasePrice: 1.85,
      supplierName: 'Global MedDistributors',
      createdAt: getDateOffset(-40, baseDate),
    },
    {
      id: 'BAT-210',
      medicineId: 'MED-108',
      medicineName: 'Azithromycin 500 mg',
      batchNumber: 'AZIT-2025-T5',
      manufacturingDate: getDateOffset(-100, baseDate),
      expiryDate: getDateOffset(150, baseDate),
      quantity: 90,
      purchasePrice: 8.50,
      supplierName: 'NovaCare Logistics',
      isRecalled: true,
      recallId: 'REC-301',
      createdAt: getDateOffset(-30, baseDate),
    },
  ];

  // 1 initial active recall on Azithromycin batch
  const recalls: Recall[] = [
    {
      id: 'REC-301',
      batchId: 'BAT-210',
      batchNumber: 'AZIT-2025-T5',
      medicineId: 'MED-108',
      medicineName: 'Azithromycin 500 mg',
      reason: 'Packaging Issue',
      recallDate: getDateOffset(-5, baseDate),
      status: 'active',
      notes: 'Demonstration recall: seal integrity discrepancy flagged by central regulatory authority. Immediate quarantine required.',
      reportedBy: 'Raghu',
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'NOTIF-001',
      type: 'recall_active',
      title: 'Active Recall Issued: Azithromycin 500 mg',
      message: 'Batch AZIT-2025-T5 was flagged for Packaging Issue. Stock marked unavailable for dispensing.',
      date: getDateOffset(-5, baseDate),
      read: false,
      referenceId: 'REC-301',
      severity: 'critical',
    },
    {
      id: 'NOTIF-002',
      type: 'expiry_soon',
      title: 'Expiring Soon: Paracetamol 500 mg',
      message: 'Batch PARA-2024-C9 has 14 days remaining before expiry. Consider dispensing first.',
      date: getDateOffset(-2, baseDate),
      read: false,
      referenceId: 'BAT-202',
      severity: 'high',
    },
    {
      id: 'NOTIF-003',
      type: 'expired',
      title: 'Expired Stock Flagged: Amoxicillin 250 mg',
      message: 'Batch AMOX-2024-B2 has passed its expiration date. Moved out of available inventory.',
      date: getDateOffset(-1, baseDate),
      read: false,
      referenceId: 'BAT-204',
      severity: 'medium',
    },
  ];

  const inventoryLogs: InventoryLog[] = [
    {
      id: 'LOG-001',
      batchId: 'BAT-201',
      batchNumber: 'PARA-2025-A1',
      medicineName: 'Paracetamol 500 mg',
      previousQty: 500,
      newQty: 450,
      change: -50,
      reason: 'Sale',
      date: getDateOffset(-10, baseDate),
      performedBy: 'Alex Rivera, CPhT',
    },
    {
      id: 'LOG-002',
      batchId: 'BAT-205',
      batchNumber: 'CETI-2025-K7',
      medicineName: 'Cetirizine 10 mg',
      previousQty: 270,
      newQty: 320,
      change: 50,
      reason: 'Restock',
      date: getDateOffset(-6, baseDate),
      performedBy: 'Raghu',
    },
  ];

  return { medicines, batches, recalls, notifications, inventoryLogs };
}

/**
 * Storage CRUD handlers
 */
export const StorageService = {
  // Medicines
  getMedicines(): Medicine[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDICINES);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveMedicines(medicines: Medicine[]): void {
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
  },

  // Batches
  getBatches(): Batch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveBatches(batches: Batch[]): void {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  },

  // Recalls
  getRecalls(): Recall[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECALLS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveRecalls(recalls: Recall[]): void {
    localStorage.setItem(STORAGE_KEYS.RECALLS, JSON.stringify(recalls));
  },

  // Notifications
  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveNotifications(notifications: AppNotification[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  // Inventory logs
  getInventoryLogs(): InventoryLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY_LOGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveInventoryLogs(logs: InventoryLog[]): void {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(logs));
  },

  // Auth User
  getUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (!data) return DEMO_USERS.admin; // default to admin demo user
      const parsed = JSON.parse(data);
      if (
        parsed.email === 'admin@pharmashield.demo' ||
        parsed.name === 'Dr. Sarah Mitchell' ||
        parsed.name === 'Alex Rivera, CPhT'
      ) {
        const updated = DEMO_USERS.admin;
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
        return updated;
      }
      return parsed;
    } catch {
      return DEMO_USERS.admin;
    }
  },
  saveUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    }
  },

  // Date override (presentation simulation feature)
  getDateOverride(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SYSTEM_DATE_OVERRIDE);
  },
  saveDateOverride(dateStr: string | null): void {
    if (!dateStr) {
      localStorage.removeItem(STORAGE_KEYS.SYSTEM_DATE_OVERRIDE);
    } else {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_DATE_OVERRIDE, dateStr);
    }
  },

  /**
   * Initializes storage with sample data if empty
   */
  initializeIfEmpty(): void {
    const existingMeds = localStorage.getItem(STORAGE_KEYS.MEDICINES);
    if (!existingMeds) {
      this.resetToSampleData();
    }
  },

  /**
   * Hard reset to fresh demo sample data
   */
  resetToSampleData(): void {
    const sample = createInitialSampleData();
    this.saveMedicines(sample.medicines);
    this.saveBatches(sample.batches);
    this.saveRecalls(sample.recalls);
    this.saveNotifications(sample.notifications);
    this.saveInventoryLogs(sample.inventoryLogs);
  },

  /**
   * Export all data as JSON string for backup
   */
  exportAllAsJson(): string {
    const data = {
      medicines: this.getMedicines(),
      batches: this.getBatches(),
      recalls: this.getRecalls(),
      notifications: this.getNotifications(),
      inventoryLogs: this.getInventoryLogs(),
      exportedAt: new Date().toISOString(),
      app: 'Medicine Expiry & Recall Alert System',
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import data from JSON
   */
  importFromJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.medicines)) this.saveMedicines(parsed.medicines);
      if (Array.isArray(parsed.batches)) this.saveBatches(parsed.batches);
      if (Array.isArray(parsed.recalls)) this.saveRecalls(parsed.recalls);
      if (Array.isArray(parsed.notifications)) this.saveNotifications(parsed.notifications);
      if (Array.isArray(parsed.inventoryLogs)) this.saveInventoryLogs(parsed.inventoryLogs);
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  },
};
