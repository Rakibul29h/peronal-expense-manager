export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'exp_food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f97316', isActive: true, isDefault: true },
  { id: 'exp_groceries', name: 'Groceries', type: 'expense', icon: 'ShoppingCart', color: '#84cc16', isActive: true, isDefault: true },
  { id: 'exp_transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#06b6d4', isActive: true, isDefault: true },
  { id: 'exp_housing', name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#6366f1', isActive: true, isDefault: true },
  { id: 'exp_utilities', name: 'Utilities & Bills', type: 'expense', icon: 'Zap', color: '#eab308', isActive: true, isDefault: true },
  { id: 'exp_shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899', isActive: true, isDefault: true },
  { id: 'exp_health', name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#ef4444', isActive: true, isDefault: true },
  { id: 'exp_entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8b5cf6', isActive: true, isDefault: true },
  { id: 'exp_education', name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#3b82f6', isActive: true, isDefault: true },
  { id: 'exp_travel', name: 'Travel', type: 'expense', icon: 'Plane', color: '#14b8a6', isActive: true, isDefault: true },
  { id: 'exp_personal', name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#f43f5e', isActive: true, isDefault: true },
  { id: 'exp_subscriptions', name: 'Subscriptions', type: 'expense', icon: 'Repeat', color: '#a855f7', isActive: true, isDefault: true },
  { id: 'exp_other', name: 'Other', type: 'expense', icon: 'MoreHorizontal', color: '#64748b', isActive: true, isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'inc_salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981', isActive: true, isDefault: true },
  { id: 'inc_freelance', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#06b6d4', isActive: true, isDefault: true },
  { id: 'inc_business', name: 'Business or Side Income', type: 'income', icon: 'TrendingUp', color: '#3b82f6', isActive: true, isDefault: true },
  { id: 'inc_investment', name: 'Investment Returns', type: 'income', icon: 'Coins', color: '#8b5cf6', isActive: true, isDefault: true },
  { id: 'inc_rental', name: 'Rental Income', type: 'income', icon: 'Building', color: '#14b8a6', isActive: true, isDefault: true },
  { id: 'inc_gifts', name: 'Gifts', type: 'income', icon: 'Gift', color: '#ec4899', isActive: true, isDefault: true },
  { id: 'inc_allowance', name: 'Allowance', type: 'income', icon: 'Wallet', color: '#f59e0b', isActive: true, isDefault: true },
  { id: 'inc_refunds', name: 'Refunds', type: 'income', icon: 'RotateCcw', color: '#84cc16', isActive: true, isDefault: true },
  { id: 'inc_other', name: 'Other', type: 'income', icon: 'PlusCircle', color: '#64748b', isActive: true, isDefault: true },
];

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'bKash',
  'Nagad',
  'Rocket',
  'Credit Card',
  'Debit Card',
  'Cheque',
  'Other',
];

export const CURRENCIES = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka (BDT)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED)' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal (SAR)' },
];

export const SURVIVAL_WINDOW_OPTIONS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days (Default)' },
  { days: 60, label: 'Last 60 days' },
  { days: 90, label: 'Last 90 days' },
];
