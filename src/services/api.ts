/**
 * Central REST API service connecting the React frontend to the FastAPI Python backend.
 */

// Use configurable API base URL. Defaults to '/api' which proxies to FastAPI on port 8000,
// or fallback to 'http://127.0.0.1:8000' for external/local development.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : '/api');

const TOKEN_KEY = 'pharmashield_auth_token_jwt';

export const TokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = TokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const data = await request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      TokenStorage.set(data.access_token);
      return data;
    },
    register: async (payload: { email: string; full_name: string; password: string; role?: string; role_title?: string }) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    me: async () => {
      return request('/auth/me');
    },
    logout: () => {
      TokenStorage.clear();
    },
  },

  // Medicines
  medicines: {
    list: async (search?: string, category?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/medicines${query}`);
    },
    get: async (id: string) => {
      return request<any>(`/medicines/${id}`);
    },
    create: async (payload: any) => {
      return request<any>('/medicines', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: async (id: string, payload: any) => {
      return request<any>(`/medicines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    delete: async (id: string) => {
      return request<any>(`/medicines/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Batches
  batches: {
    list: async (search?: string, medicineId?: string, statusFilter?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (medicineId && medicineId !== 'all') params.append('medicine_id', medicineId);
      if (statusFilter && statusFilter !== 'all') params.append('status_filter', statusFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/batches${query}`);
    },
    get: async (id: string) => {
      return request<any>(`/batches/${id}`);
    },
    create: async (payload: any) => {
      return request<any>('/batches', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: async (id: string, payload: any) => {
      return request<any>(`/batches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    delete: async (id: string) => {
      return request<any>(`/batches/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Expiry Alerts
  expiryAlerts: {
    list: async () => {
      return request<any[]>('/expiry-alerts');
    },
    expiringSoon: async () => {
      return request<any[]>('/expiry-alerts/expiring-soon');
    },
    expired: async () => {
      return request<any[]>('/expiry-alerts/expired');
    },
  },

  // Recalls
  recalls: {
    list: async (search?: string, statusFilter?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status_filter', statusFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/recalls${query}`);
    },
    get: async (id: string) => {
      return request<any>(`/recalls/${id}`);
    },
    create: async (payload: { batch_id: string; recall_reason: string; recall_date?: string; notes: string }) => {
      return request<any>('/recalls', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    update: async (id: string, payload: { recall_status: string; closed_reason?: string }) => {
      return request<any>(`/recalls/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    getByBatch: async (batchNumber: string) => {
      return request<any>(`/recalls/batch/${batchNumber}`);
    },
  },

  // Inventory
  inventory: {
    list: async (search?: string, statusFilter?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status_filter', statusFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/inventory${query}`);
    },
    updateStock: async (batchId: string, newQuantity: number, reason: string) => {
      return request<any>(`/inventory/${batchId}/stock`, {
        method: 'POST',
        body: JSON.stringify({ new_quantity: newQuantity, reason }),
      });
    },
    transactions: async () => {
      return request<any[]>('/inventory/transactions');
    },
    available: async () => {
      return request<any[]>('/inventory/available');
    },
    expired: async () => {
      return request<any[]>('/inventory/expired');
    },
    recalled: async () => {
      return request<any[]>('/inventory/recalled');
    },
  },

  // Notifications
  notifications: {
    list: async () => {
      return request<any[]>('/notifications');
    },
    markRead: async (id: string) => {
      return request<any>(`/notifications/${id}/read`, {
        method: 'PUT',
      });
    },
    markAllRead: async () => {
      return request<any>('/notifications/read-all', {
        method: 'PUT',
      });
    },
    delete: async (id: string) => {
      return request<any>(`/notifications/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Dashboard & Reports
  reports: {
    dashboardStats: async () => {
      return request<any>('/dashboard/stats');
    },
    medicinesReport: async () => {
      return request<any[]>('/reports/medicines');
    },
    batchesReport: async () => {
      return request<any[]>('/reports/batches');
    },
    recallsReport: async () => {
      return request<any[]>('/reports/recalls');
    },
  },

  // System Health
  health: async () => {
    return request<any>('/health');
  },
};
