import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { UserSettings, Category, ExpenseRecord, IncomeRecord } from '../types';
import { api } from '../lib/api';
import { useToast } from './ToastContext';

interface AppContextType {
  // Selected Month (YYYY-MM)
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // Settings & Categories
  settings: UserSettings | null;
  categories: Category[];
  refreshSettings: () => Promise<void>;
  refreshCategories: () => Promise<void>;

  // Global Mutation Trigger (increments on every create/edit/delete/reset)
  refreshKey: number;
  triggerRefresh: () => void;

  // Transaction Modals
  isExpenseModalOpen: boolean;
  openExpenseModal: (expense?: ExpenseRecord) => void;
  closeExpenseModal: () => void;
  editingExpense: ExpenseRecord | null;

  isIncomeModalOpen: boolean;
  openIncomeModal: (income?: IncomeRecord) => void;
  closeIncomeModal: () => void;
  editingIncome: IncomeRecord | null;

  // Category Details Drilldown Modal (from clicking pie slice or legend)
  drilldownCategory: {
    categoryName: string;
    type: 'expense' | 'income';
    month: string;
  } | null;
  openCategoryDrilldown: (categoryName: string, type: 'expense' | 'income', month: string) => void;
  closeCategoryDrilldown: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Expense modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  // Income modal
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);

  // Category drilldown modal
  const [drilldownCategory, setDrilldownCategory] = useState<{
    categoryName: string;
    type: 'expense' | 'income';
    month: string;
  } | null>(null);

  const { showToast } = useToast();

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.data);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshCategories();
  }, [refreshSettings, refreshCategories]);

  const openExpenseModal = (expense?: ExpenseRecord) => {
    setEditingExpense(expense || null);
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const openIncomeModal = (income?: IncomeRecord) => {
    setEditingIncome(income || null);
    setIsIncomeModalOpen(true);
  };

  const closeIncomeModal = () => {
    setIsIncomeModalOpen(false);
    setEditingIncome(null);
  };

  const openCategoryDrilldown = (categoryName: string, type: 'expense' | 'income', month: string) => {
    setDrilldownCategory({ categoryName, type, month });
  };

  const closeCategoryDrilldown = () => {
    setDrilldownCategory(null);
  };

  return (
    <AppContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        settings,
        categories,
        refreshSettings,
        refreshCategories,
        refreshKey,
        triggerRefresh,
        isExpenseModalOpen,
        openExpenseModal,
        closeExpenseModal,
        editingExpense,
        isIncomeModalOpen,
        openIncomeModal,
        closeIncomeModal,
        editingIncome,
        drilldownCategory,
        openCategoryDrilldown,
        closeCategoryDrilldown,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
