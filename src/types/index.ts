export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 
  | 'Cash'
  | 'Bank Transfer'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Credit Card'
  | 'Debit Card'
  | 'Cheque'
  | 'Other';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: string; // Category name or ID
  date: string; // ISO string 'YYYY-MM-DD'
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeRecord {
  id: string;
  title: string;
  amount: number;
  category: string; // Category name or ID
  date: string; // ISO string 'YYYY-MM-DD'
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BorrowingType = 'credit' | 'debt';

export interface BorrowingRecord {
  id: string;
  type: BorrowingType;
  person: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TuitionSession {
  date: string;
  completed: boolean;
}

export interface TuitionRecord {
  id: string;
  name: string;
  targetDaysPerMonth: number;
  sessions: TuitionSession[];
  paid: boolean;
  monthKey: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethodOrSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  currency: string; // e.g. 'BDT', 'USD', 'EUR', 'GBP'
  currencySymbol: string; // '৳', '$', '€', '£'
  openingBalance: number;
  survivalWindowDays: number; // default 30
  warningThresholdDays: number; // default 15
  theme: 'light' | 'dark' | 'system';
  dateFormat: string;
  updatedAt: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  icon: string;
}

export interface DashboardSummary {
  selectedMonth: string; // 'YYYY-MM'
  currentBalance: number;
  openingBalance: number;
  allTimeIncome: number;
  allTimeExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number; // monthlyIncome - monthlyExpense
  monthlyTransactionsCount: number;
  averageDailySpending: number;
  expenseCategories: CategoryBreakdown[];
  incomeCategories: CategoryBreakdown[];
  recentTransactions: UnifiedTransaction[];
  survivalEstimate: SurvivalEstimate;
}

export interface SurvivalEstimate {
  currentBalance: number;
  averageDailySpending: number;
  windowDays: number;
  estimatedSurvivalDays: number; // Math.floor
  exactSurvivalDays: number;
  estimatedDepletionDate: string | null;
  status: 'comfortable' | 'moderate' | 'warning' | 'critical' | 'depleted' | 'insufficient_data';
  statusMessage: string;
  totalEligibleExpenses: number;
  daysEvaluated: number;
}

export interface MonthComparison {
  fromMonth: string; // 'YYYY-MM' (Previous)
  toMonth: string;   // 'YYYY-MM' (Current)
  previousMonth: {
    income: number;
    expenses: number;
    netCashFlow: number;
    transactionsCount: number;
  };
  currentMonth: {
    income: number;
    expenses: number;
    netCashFlow: number;
    transactionsCount: number;
  };
  differences: {
    incomeDiff: number;
    incomePercentChange: number | null;
    expenseDiff: number;
    expensePercentChange: number | null;
    netCashFlowDiff: number;
    netCashFlowPercentChange: number | null;
  };
  expenseCategoryComparison: Array<{
    category: string;
    color: string;
    prevAmount: number;
    currAmount: number;
    diff: number;
    percentChange: number | null;
  }>;
  incomeCategoryComparison: Array<{
    category: string;
    color: string;
    prevAmount: number;
    currAmount: number;
    diff: number;
    percentChange: number | null;
  }>;
  trendSixMonths: Array<{
    month: string;
    monthName: string;
    income: number;
    expenses: number;
    netCashFlow: number;
  }>;
}

export interface DatabaseStatus {
  isMongoConnected: boolean;
  usingFallback: boolean;
  mongoUriConfigured: boolean;
  mongoError: string | null;
  clusterHost: string | null;
  isIpWhitelistError: boolean;
}

export type TodoStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TodoRecord {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}
