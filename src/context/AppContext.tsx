import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { Medicine, Batch, Recall, User, AppNotification, InventoryLog, RecallReason } from '../types';
import { StorageService, DEMO_USERS, generateId } from '../utils/storage';
import { evaluateBatchStatus } from '../utils/expiry';
import { api, TokenStorage } from '../services/api';

interface AppContextType {
  user: User | null;
  login: (role: 'admin' | 'staff', customEmail?: string, customPassword?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isBackendConnected: boolean;
  apiError: string | null;
  systemDate: Date;
  dateOverride: string | null;
  setDateOverride: (dateStr: string | null) => void;
  refreshData: () => Promise<void>;

  medicines: Medicine[];
  batches: Batch[];
  recalls: Recall[];
  notifications: AppNotification[];
  inventoryLogs: InventoryLog[];

  // Medicine operations
  addMedicine: (data: Omit<Medicine, 'id' | 'createdAt'>) => Promise<Medicine | null>;
  updateMedicine: (id: string, data: Partial<Medicine>) => Promise<boolean>;
  deleteMedicine: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Batch operations
  addBatch: (data: Omit<Batch, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string; batch?: Batch }>;
  updateBatch: (id: string, data: Partial<Batch>) => Promise<{ success: boolean; error?: string }>;
  deleteBatch: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Inventory operations
  updateStock: (batchId: string, newQty: number, reason: 'Sale' | 'Restock' | 'Damage / Disposal' | 'Audit Adjustment' | string) => Promise<{ success: boolean; error?: string }>;

  // Recall operations
  createRecall: (data: { batchId: string; reason: RecallReason; recallDate: string; notes: string }) => Promise<{ success: boolean; error?: string; recall?: Recall }>;
  updateRecallStatus: (recallId: string, newStatus: 'active' | 'closed', notes?: string) => Promise<void>;

  // Notification operations
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // Reset & system
  resetDataToSample: () => Promise<void>;

  // Real-time computed dashboard stats
  stats: {
    totalMedicines: number;
    totalBatches: number;
    expiringSoonCount: number;
    expiredCount: number;
    recalledCount: number;
    safeCount: number;
    expiringLaterCount: number;
    availableStock: number;
    totalStockUnits: number;
    inventoryTotalValue: number;
    unreadNotifications: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to normalize backend medicine to frontend Medicine type
function normalizeMedicine(m: any): Medicine {
  return {
    id: m.id,
    name: m.medicine_name || m.name || '',
    category: m.category,
    manufacturer: m.manufacturer,
    description: m.description || '',
    unit: m.unit || 'tablets',
    minStockLevel: m.min_stock_level ?? m.minStockLevel ?? 50,
    createdAt: m.created_at ? String(m.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

// Helper to normalize backend batch to frontend Batch type
function normalizeBatch(b: any): Batch {
  return {
    id: b.id,
    medicineId: b.medicine_id || b.medicineId,
    medicineName: b.medicine_name || b.medicineName || '',
    batchNumber: b.batch_number || b.batchNumber,
    manufacturingDate: b.manufacturing_date || b.manufacturingDate,
    expiryDate: b.expiry_date || b.expiryDate,
    quantity: b.quantity,
    purchasePrice: b.purchase_price ?? b.purchasePrice ?? 0,
    supplierName: b.supplier_name || b.supplierName || '',
    isRecalled: Boolean(b.is_recalled ?? b.isRecalled),
    recallId: b.recall_id || b.recallId,
    status: b.status,
    daysRemaining: b.days_remaining ?? b.daysRemaining,
    isAvailableForSale: b.is_available_for_sale ?? b.isAvailableForSale,
    createdAt: b.created_at ? String(b.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

// Helper to normalize backend recall to frontend Recall type
function normalizeRecall(r: any): Recall {
  return {
    id: r.id,
    batchId: r.batch_id || r.batchId,
    batchNumber: r.batch_number || r.batchNumber,
    medicineId: r.medicine_id || r.medicineId,
    medicineName: r.medicine_name || r.medicineName || '',
    reason: r.recall_reason || r.reason,
    recallDate: r.recall_date || r.recallDate,
    status: r.recall_status || r.status || 'active',
    notes: r.notes || '',
    reportedBy: r.reported_by || r.reportedBy || 'Administrator',
    closedAt: r.closed_at || r.closedAt,
    closedReason: r.closed_reason || r.closedReason,
  };
}

// Helper to normalize backend notification
function normalizeNotification(n: any): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    severity: n.severity || 'medium',
    date: n.date,
    read: Boolean(n.is_read ?? n.read),
    referenceId: n.reference_id || n.referenceId,
  };
}

// Helper to normalize backend inventory log
function normalizeLog(l: any): InventoryLog {
  return {
    id: l.id,
    batchId: l.batch_id || l.batchId,
    batchNumber: l.batch_number || l.batchNumber,
    medicineName: l.medicine_name || l.medicineName,
    previousQty: l.previous_qty ?? l.previousQty ?? 0,
    newQty: l.new_qty ?? l.newQty ?? 0,
    change: l.change ?? 0,
    reason: l.reason,
    performedBy: l.performed_by || l.performedBy || 'Staff',
    date: l.date,
  };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(() => StorageService.getUser());
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [dateOverride, setDateOverrideState] = useState<string | null>(() => StorageService.getDateOverride());

  // Effective system date
  const systemDate = useMemo(() => {
    if (dateOverride) {
      const d = new Date(dateOverride + 'T12:00:00');
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [dateOverride]);

  const setDateOverride = (dateStr: string | null) => {
    setDateOverrideState(dateStr);
    StorageService.saveDateOverride(dateStr);
  };

  // Fetch all records from backend, falling back to LocalStorage if backend is unreachable
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [medsData, batchesData, recallsData, notifsData, logsData] = await Promise.all([
        api.medicines.list(),
        api.batches.list(),
        api.recalls.list(),
        api.notifications.list(),
        api.inventory.transactions(),
      ]);

      setMedicines(medsData.map(normalizeMedicine));
      setBatches(batchesData.map(normalizeBatch));
      setRecalls(recallsData.map(normalizeRecall));
      setNotifications(notifsData.map(normalizeNotification));
      setInventoryLogs(logsData.map(normalizeLog));
      setIsBackendConnected(true);
    } catch (err: any) {
      console.warn('Backend API connection note (using local cache):', err?.message || err);
      setIsBackendConnected(false);
      // Fallback to LocalStorage
      StorageService.initializeIfEmpty();
      setMedicines(StorageService.getMedicines());
      setBatches(StorageService.getBatches());
      setRecalls(StorageService.getRecalls());
      setNotifications(StorageService.getNotifications());
      setInventoryLogs(StorageService.getInventoryLogs());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Sync to LocalStorage as safety cache
  useEffect(() => {
    if (medicines.length > 0) StorageService.saveMedicines(medicines);
  }, [medicines]);

  useEffect(() => {
    if (batches.length > 0) StorageService.saveBatches(batches);
  }, [batches]);

  useEffect(() => {
    if (recalls.length > 0) StorageService.saveRecalls(recalls);
  }, [recalls]);

  useEffect(() => {
    if (notifications.length > 0) StorageService.saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (inventoryLogs.length > 0) StorageService.saveInventoryLogs(inventoryLogs);
  }, [inventoryLogs]);

  // Auth: Login via FastAPI backend with JWT token
  const login = async (role: 'admin' | 'staff', customEmail?: string, customPassword?: string): Promise<boolean> => {
    const email = customEmail || (role === 'admin' ? 'admin@pharmashield.demo' : 'staff@pharmashield.demo');
    const password = customPassword || 'demo123';

    try {
      const res = await api.auth.login(email, password);
      const u: User = {
        id: res.user.id,
        name: res.user.full_name,
        email: res.user.email,
        role: res.user.role as 'admin' | 'staff',
        roleTitle: res.user.role_title || (res.user.role === 'admin' ? 'Chief Pharmacy Administrator' : 'Pharmacy Staff'),
      };
      setUser(u);
      StorageService.saveUser(u);
      await refreshData();
      return true;
    } catch (err: any) {
      console.warn('FastAPI login failed, using local demo fallback:', err?.message);
      // Fallback local auth
      const selectedUser = DEMO_USERS[role];
      setUser(selectedUser);
      StorageService.saveUser(selectedUser);
      return true;
    }
  };

  const logout = () => {
    api.auth.logout();
    TokenStorage.clear();
    setUser(null);
    StorageService.saveUser(null);
  };

  // Compute live stats against current system date
  const stats = useMemo(() => {
    let safeCount = 0;
    let expiringLaterCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let recalledCount = 0;
    let availableStock = 0;
    let totalStockUnits = 0;
    let inventoryTotalValue = 0;

    batches.forEach((b) => {
      const evaluated = evaluateBatchStatus(b, systemDate);
      totalStockUnits += b.quantity;
      inventoryTotalValue += b.quantity * (b.purchasePrice || 0);

      if (evaluated.isRecalled) {
        recalledCount += 1;
      } else if (evaluated.isExpired) {
        expiredCount += 1;
      } else if (evaluated.expiryStatus === 'expiring_soon') {
        expiringSoonCount += 1;
      } else if (evaluated.expiryStatus === 'expiring_later') {
        expiringLaterCount += 1;
      } else {
        safeCount += 1;
      }

      if (evaluated.isAvailableForSale) {
        availableStock += b.quantity;
      }
    });

    const unreadNotifications = notifications.filter((n) => !n.read).length;

    return {
      totalMedicines: medicines.length,
      totalBatches: batches.length,
      expiringSoonCount,
      expiredCount,
      recalledCount,
      safeCount,
      expiringLaterCount,
      availableStock,
      totalStockUnits,
      inventoryTotalValue,
      unreadNotifications,
    };
  }, [medicines, batches, notifications, systemDate]);

  // Medicine handlers
  const addMedicine = async (data: Omit<Medicine, 'id' | 'createdAt'>): Promise<Medicine | null> => {
    try {
      if (isBackendConnected) {
        const res = await api.medicines.create({
          medicine_name: data.name,
          category: data.category,
          manufacturer: data.manufacturer,
          description: data.description,
          unit: data.unit,
          min_stock_level: data.minStockLevel,
        });
        const newMed = normalizeMedicine(res);
        setMedicines((prev) => [newMed, ...prev]);
        return newMed;
      }
    } catch (e: any) {
      console.warn('Backend call failed, using fallback:', e);
    }

    const newMed: Medicine = {
      ...data,
      id: generateId('MED'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setMedicines((prev) => [newMed, ...prev]);
    return newMed;
  };

  const updateMedicine = async (id: string, data: Partial<Medicine>): Promise<boolean> => {
    try {
      if (isBackendConnected) {
        await api.medicines.update(id, {
          ...(data.name ? { medicine_name: data.name } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.manufacturer ? { manufacturer: data.manufacturer } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.unit ? { unit: data.unit } : {}),
          ...(data.minStockLevel !== undefined ? { min_stock_level: data.minStockLevel } : {}),
        });
      }
    } catch (e) {
      console.warn('Backend medicine update failed, updating locally:', e);
    }

    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
    if (data.name) {
      setBatches((prev) =>
        prev.map((b) => (b.medicineId === id ? { ...b, medicineName: data.name! } : b))
      );
    }
    return true;
  };

  const deleteMedicine = async (id: string): Promise<{ success: boolean; error?: string }> => {
    // Check associated batches
    const hasBatches = batches.some((b) => b.medicineId === id);
    if (hasBatches) {
      return {
        success: false,
        error: 'Cannot delete medicine: there are active batch records registered under this medicine. Delete or reassign those batches first.',
      };
    }

    try {
      if (isBackendConnected) {
        await api.medicines.delete(id);
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to delete medicine from database.' };
    }

    setMedicines((prev) => prev.filter((m) => m.id !== id));
    return { success: true };
  };

  // Batch handlers
  const addBatch = async (
    data: Omit<Batch, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; error?: string; batch?: Batch }> => {
    // Check batch number uniqueness
    const exists = batches.some((b) => b.batchNumber.toLowerCase() === data.batchNumber.toLowerCase().trim());
    if (exists) {
      return { success: false, error: `Batch number "${data.batchNumber}" already exists in the system.` };
    }

    if (new Date(data.expiryDate) <= new Date(data.manufacturingDate)) {
      return { success: false, error: 'Expiry date must be later than manufacturing date.' };
    }

    if (data.quantity < 0) {
      return { success: false, error: 'Quantity cannot be negative.' };
    }

    try {
      if (isBackendConnected) {
        const res = await api.batches.create({
          medicine_id: data.medicineId,
          batch_number: data.batchNumber.trim().toUpperCase(),
          manufacturing_date: data.manufacturingDate,
          expiry_date: data.expiryDate,
          quantity: data.quantity,
          purchase_price: data.purchasePrice,
          supplier_name: data.supplierName,
        });
        const newBatch = normalizeBatch(res);
        setBatches((prev) => [newBatch, ...prev]);
        // Refresh notifications because backend may have generated expiry alert
        const notifs = await api.notifications.list();
        setNotifications(notifs.map(normalizeNotification));
        return { success: true, batch: newBatch };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to register batch in backend.' };
    }

    // Local fallback
    const newBatch: Batch = {
      ...data,
      batchNumber: data.batchNumber.trim().toUpperCase(),
      id: generateId('BAT'),
      createdAt: new Date().toISOString().split('T')[0],
      isRecalled: false,
    };
    setBatches((prev) => [newBatch, ...prev]);
    return { success: true, batch: newBatch };
  };

  const updateBatch = async (id: string, data: Partial<Batch>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isBackendConnected) {
        await api.batches.update(id, {
          ...(data.batchNumber ? { batch_number: data.batchNumber } : {}),
          ...(data.manufacturingDate ? { manufacturing_date: data.manufacturingDate } : {}),
          ...(data.expiryDate ? { expiry_date: data.expiryDate } : {}),
          ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
          ...(data.purchasePrice !== undefined ? { purchase_price: data.purchasePrice } : {}),
          ...(data.supplierName ? { supplier_name: data.supplierName } : {}),
        });
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to update batch in backend.' };
    }

    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data, ...(data.batchNumber ? { batchNumber: data.batchNumber.trim().toUpperCase() } : {}) } : b))
    );
    return { success: true };
  };

  const deleteBatch = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = batches.find((b) => b.id === id);
    if (target?.isRecalled) {
      return {
        success: false,
        error: 'Cannot delete batch under active recall. Safety compliance records must be preserved.',
      };
    }

    try {
      if (isBackendConnected) {
        await api.batches.delete(id);
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to delete batch.' };
    }

    setBatches((prev) => prev.filter((b) => b.id !== id));
    return { success: true };
  };

  // Stock update
  const updateStock = async (
    batchId: string,
    newQty: number,
    reason: 'Sale' | 'Restock' | 'Damage / Disposal' | 'Audit Adjustment' | string
  ): Promise<{ success: boolean; error?: string }> => {
    if (newQty < 0) {
      return { success: false, error: 'Stock quantity cannot be negative.' };
    }

    const batch = batches.find((b) => b.id === batchId);
    if (!batch) {
      return { success: false, error: 'Batch not found.' };
    }

    try {
      if (isBackendConnected) {
        const res = await api.inventory.updateStock(batchId, newQty, reason);
        const updatedBatch = normalizeBatch(res);
        setBatches((prev) => prev.map((b) => (b.id === batchId ? updatedBatch : b)));
        const txs = await api.inventory.transactions();
        setInventoryLogs(txs.map(normalizeLog));
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Stock adjustment rejected by server.' };
    }

    // Local fallback
    const prevQty = batch.quantity;
    const change = newQty - prevQty;
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, quantity: newQty } : b)));
    const log: InventoryLog = {
      id: generateId('LOG'),
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      medicineName: batch.medicineName,
      previousQty: prevQty,
      newQty,
      change,
      reason,
      date: new Date().toISOString().split('T')[0],
      performedBy: user?.name || 'Staff User',
    };
    setInventoryLogs((prev) => [log, ...prev]);
    return { success: true };
  };

  // Recall operations
  const createRecall = async (data: {
    batchId: string;
    reason: RecallReason;
    recallDate: string;
    notes: string;
  }): Promise<{ success: boolean; error?: string; recall?: Recall }> => {
    try {
      if (isBackendConnected) {
        const res = await api.recalls.create({
          batch_id: data.batchId,
          recall_reason: data.reason,
          recall_date: data.recallDate,
          notes: data.notes,
        });
        const newRecall = normalizeRecall(res);
        setRecalls((prev) => [newRecall, ...prev]);
        setBatches((prev) =>
          prev.map((b) =>
            b.id === data.batchId ? { ...b, isRecalled: true, recallId: newRecall.id, status: 'Recalled' } : b
          )
        );
        const notifs = await api.notifications.list();
        setNotifications(notifs.map(normalizeNotification));
        return { success: true, recall: newRecall };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to issue safety recall in backend.' };
    }

    // Local fallback
    const targetBatch = batches.find((b) => b.id === data.batchId);
    if (!targetBatch) return { success: false, error: 'Batch not found' };

    const newRecall: Recall = {
      id: generateId('REC'),
      batchId: targetBatch.id,
      batchNumber: targetBatch.batchNumber,
      medicineId: targetBatch.medicineId,
      medicineName: targetBatch.medicineName,
      reason: data.reason,
      recallDate: data.recallDate || new Date().toISOString().split('T')[0],
      status: 'active',
      notes: data.notes,
      reportedBy: user?.name || 'Authorized Staff',
    };
    setBatches((prev) =>
      prev.map((b) =>
        b.id === data.batchId ? { ...b, isRecalled: true, recallId: newRecall.id, status: 'Recalled' } : b
      )
    );
    setRecalls((prev) => [newRecall, ...prev]);
    return { success: true, recall: newRecall };
  };

  const updateRecallStatus = async (recallId: string, newStatus: 'active' | 'closed', notes?: string) => {
    try {
      if (isBackendConnected) {
        await api.recalls.update(recallId, {
          recall_status: newStatus,
          closed_reason: notes,
        });
        await refreshData();
        return;
      }
    } catch (e) {
      console.warn('Backend update failed:', e);
    }

    setRecalls((prev) =>
      prev.map((r) =>
        r.id === recallId
          ? {
              ...r,
              status: newStatus,
              closedAt: newStatus === 'closed' ? new Date().toISOString().split('T')[0] : undefined,
              closedReason: notes || r.closedReason,
            }
          : r
      )
    );
    const recall = recalls.find((r) => r.id === recallId);
    if (recall) {
      setBatches((prev) =>
        prev.map((b) => (b.id === recall.batchId ? { ...b, isRecalled: newStatus === 'active' } : b))
      );
    }
  };

  // Notification handlers
  const markNotificationAsRead = async (id: string) => {
    try {
      if (isBackendConnected) {
        await api.notifications.markRead(id);
      }
    } catch (e) {
      // ignore
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    try {
      if (isBackendConnected) {
        await api.notifications.markAllRead();
      }
    } catch (e) {
      // ignore
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    try {
      if (isBackendConnected) {
        await api.notifications.delete(id);
      }
    } catch (e) {
      // ignore
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const resetDataToSample = async () => {
    StorageService.resetToSampleData();
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isBackendConnected,
        apiError,
        systemDate,
        dateOverride,
        setDateOverride,
        refreshData,
        medicines,
        batches,
        recalls,
        notifications,
        inventoryLogs,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        addBatch,
        updateBatch,
        deleteBatch,
        updateStock,
        createRecall,
        updateRecallStatus,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        resetDataToSample,
        stats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
