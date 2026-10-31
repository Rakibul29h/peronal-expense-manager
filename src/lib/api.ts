import {
  DashboardSummary,
  ExpenseRecord,
  IncomeRecord,
  Category,
  UserSettings,
  MonthComparison,
  SurvivalEstimate,
  DatabaseStatus,
  BorrowingRecord,
  TuitionRecord,
} from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: async (month?: string, days?: number): Promise<{ data: DashboardSummary }> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (days) params.append('days', days.toString());
    const res = await fetch(`/api/dashboard?${params.toString()}`);
    return handleResponse(res);
  },

  // Expenses
  getExpenses: async (params?: {
    month?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ExpenseRecord[]; total: number; page: number; totalPages: number }> => {
    const query = new URLSearchParams();
    if (params?.month) query.append('month', params.month);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const res = await fetch(`/api/expenses?${query.toString()}`);
    return handleResponse(res);
  },

  createExpense: async (payload: {
    title: string;
    amount: number;
    category: string;
    date: string;
    paymentMethod?: string;
    notes?: string;
  }): Promise<{ success: boolean; data: ExpenseRecord }> => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  updateExpense: async (
    id: string,
    payload: Partial<{
      title: string;
      amount: number;
      category: string;
      date: string;
      paymentMethod?: string;
      notes?: string;
    }>
  ): Promise<{ success: boolean; data: ExpenseRecord }> => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  deleteExpense: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Income
  getIncomes: async (params?: {
    month?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IncomeRecord[]; total: number; page: number; totalPages: number }> => {
    const query = new URLSearchParams();
    if (params?.month) query.append('month', params.month);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const res = await fetch(`/api/income?${query.toString()}`);
    return handleResponse(res);
  },

  createIncome: async (payload: {
    title: string;
    amount: number;
    category: string;
    date: string;
    source?: string;
    notes?: string;
  }): Promise<{ success: boolean; data: IncomeRecord }> => {
    const res = await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  updateIncome: async (
    id: string,
    payload: Partial<{
      title: string;
      amount: number;
      category: string;
      date: string;
      source?: string;
      notes?: string;
    }>
  ): Promise<{ success: boolean; data: IncomeRecord }> => {
    const res = await fetch(`/api/income/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  deleteIncome: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/income/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Comparison
  getComparison: async (from?: string, to?: string): Promise<{ data: MonthComparison }> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await fetch(`/api/comparison?${params.toString()}`);
    return handleResponse(res);
  },

  // Survival Estimate
  getSurvivalEstimate: async (days?: number): Promise<{ data: SurvivalEstimate }> => {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    const res = await fetch(`/api/survival-estimate?${params.toString()}`);
    return handleResponse(res);
  },

  // Categories
  getCategories: async (): Promise<{ data: Category[] }> => {
    const res = await fetch('/api/categories');
    return handleResponse(res);
  },

  createCategory: async (payload: {
    name: string;
    type: 'expense' | 'income';
    icon: string;
    color: string;
  }): Promise<{ success: boolean; data: Category }> => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  updateCategory: async (
    id: string,
    payload: Partial<Category>
  ): Promise<{ success: boolean; data: Category }> => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  deleteCategory: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Settings
  getSettings: async (): Promise<{ data: UserSettings }> => {
    const res = await fetch('/api/settings');
    return handleResponse(res);
  },

  updateSettings: async (payload: Partial<UserSettings>): Promise<{ success: boolean; data: UserSettings }> => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Reset / Clear
  clearAllData: async (): Promise<{ success: boolean; message: string }> => {
    const res = await fetch('/api/clear', { method: 'POST' });
    return handleResponse(res);
  },

  resetDatabase: async (): Promise<{ success: boolean; message: string }> => {
    const res = await fetch('/api/seed', { method: 'POST' });
    return handleResponse(res);
  },

  // Database Connection Status
  getDatabaseStatus: async (): Promise<{ data: DatabaseStatus }> => {
    const res = await fetch('/api/database-status');
    return handleResponse(res);
  },

  retryMongoConnection: async (): Promise<{ success: boolean; error?: string; status: DatabaseStatus }> => {
    const res = await fetch('/api/database/retry', { method: 'POST' });
    return handleResponse(res);
  },

  getBorrowings: async (): Promise<{ data: BorrowingRecord[] }> => {
    const res = await fetch('/api/borrowings');
    return handleResponse(res);
  },

  createBorrowing: async (payload: {
    type: 'credit' | 'debt';
    person: string;
    amount: number;
  }): Promise<{ success: boolean; data: BorrowingRecord }> => {
    const res = await fetch('/api/borrowings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
  updateBorrowing: async (id: string, payload: { person?: string; amount?: number }) => {
    const res = await fetch(`/api/borrowings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return handleResponse<{ success: boolean; data: BorrowingRecord }>(res);
  },
  deleteBorrowing: async (id: string) => {
    const res = await fetch(`/api/borrowings/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  getTuitions: async (): Promise<{ data: TuitionRecord[] }> => {
    const res = await fetch('/api/tuitions', { cache: 'no-store' });
    return handleResponse(res);
  },

  createTuition: async (payload: { name: string; targetDaysPerMonth: number }): Promise<{ success: boolean; data: TuitionRecord }> => {
    const res = await fetch('/api/tuitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  updateTuition: async (
    id: string,
    payload: { action: 'edit'; name: string; targetDaysPerMonth: number } | { action: 'addDates'; dates: string[] } | { action: 'addToday'; date: string } | { action: 'editSession'; date: string; newDate: string } | { action: 'deleteSession'; date: string } | { action: 'setPaid'; paid: boolean }
  ): Promise<{ success: boolean; data: TuitionRecord }> => {
    const res = await fetch(`/api/tuitions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
  deleteTuition: async (id: string) => {
    const res = await fetch(`/api/tuitions/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },
};
