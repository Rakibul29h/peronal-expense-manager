import { parseISO, isAfter, isBefore, startOfMonth, endOfMonth, subDays, addDays, format, differenceInDays } from 'date-fns';
import { ExpenseRecord, IncomeRecord, SurvivalEstimate, CategoryBreakdown, MonthComparison, Category, BorrowingRecord } from '../src/types';

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Check if a date string is in the future compared to today
 */
export function isFutureDate(dateStr: string): boolean {
  const today = getTodayDateString();
  return dateStr > today;
}

/**
 * Calculates current available remaining balance:
 * Remaining Balance = Opening Balance + Total Income (through today) - Total Expenses (through today)
 * Future-dated transactions are strictly excluded from current available balance.
 */
export function calculateCurrentBalance(
  openingBalance: number,
  incomes: IncomeRecord[],
  expenses: ExpenseRecord[],
  borrowings: BorrowingRecord[] = []
): {
  currentBalance: number;
  totalIncomeThroughToday: number;
  totalExpenseThroughToday: number;
} {
  return calculateBalanceThroughDate(openingBalance, incomes, expenses, borrowings, getTodayDateString());
}

export function calculateBalanceThroughDate(
  openingBalance: number,
  incomes: IncomeRecord[],
  expenses: ExpenseRecord[],
  borrowings: BorrowingRecord[],
  throughDate: string
): {
  currentBalance: number;
  totalIncomeThroughToday: number;
  totalExpenseThroughToday: number;
} {
  const carryForwards = incomes
    .filter(income => income.title.startsWith('Balance carried forward from ') && income.date <= throughDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestCarryForward = carryForwards[0];
  const startDate = latestCarryForward?.date || '';

  const validIncomes = incomes.filter(inc =>
    inc.date <= throughDate && (!latestCarryForward || (inc.date > startDate && inc.id !== latestCarryForward.id))
  );
  const validExpenses = expenses.filter(exp => exp.date <= throughDate && (!latestCarryForward || exp.date >= startDate));
  const validBorrowings = borrowings.filter(record => record.date <= throughDate && (!latestCarryForward || record.date >= startDate));

  const totalIncomeThroughToday = validIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) +
    (latestCarryForward?.amount || 0);
  const totalExpenseThroughToday = validExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalBorrowedThroughToday = validBorrowings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const currentBalance = Number((
    (latestCarryForward ? 0 : openingBalance) +
    totalIncomeThroughToday +
    totalBorrowedThroughToday -
    totalExpenseThroughToday
  ).toFixed(2));

  return {
    currentBalance,
    totalIncomeThroughToday: Number(totalIncomeThroughToday.toFixed(2)),
    totalExpenseThroughToday: Number(totalExpenseThroughToday.toFixed(2)),
  };
}

/**
 * Calculates Financial Survival Days / Runway:
 * Average Daily Spending = Total Eligible Expenses in window / Number of Calendar Days in window
 * Estimated Survival Days = Current Remaining Balance / Average Daily Spending
 */
export function calculateSurvivalEstimate(
  currentBalance: number,
  expenses: ExpenseRecord[],
  windowDays: number = 30,
  warningThreshold: number = 15
): SurvivalEstimate {
  const today = new Date();
  const todayStr = getTodayDateString();
  const startDate = subDays(today, windowDays);
  const startDateStr = format(startDate, 'yyyy-MM-dd');

  // Filter expenses strictly in [startDateStr, todayStr]
  const eligibleExpenses = expenses.filter(exp => {
    return exp.date >= startDateStr && exp.date <= todayStr;
  });

  const totalEligibleExpenses = eligibleExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const averageDailySpending = Number((totalEligibleExpenses / windowDays).toFixed(2));

  // Edge cases
  if (currentBalance <= 0) {
    return {
      currentBalance,
      averageDailySpending,
      windowDays,
      estimatedSurvivalDays: 0,
      exactSurvivalDays: 0,
      estimatedDepletionDate: todayStr,
      status: 'depleted',
      statusMessage: currentBalance < 0 
        ? 'Balance is currently negative. Immediate attention required.' 
        : 'Balance is zero. No remaining funds available.',
      totalEligibleExpenses: Number(totalEligibleExpenses.toFixed(2)),
      daysEvaluated: windowDays,
    };
  }

  if (totalEligibleExpenses <= 0 || averageDailySpending <= 0) {
    return {
      currentBalance,
      averageDailySpending: 0,
      windowDays,
      estimatedSurvivalDays: 0,
      exactSurvivalDays: 0,
      estimatedDepletionDate: null,
      status: 'insufficient_data',
      statusMessage: `No expenses recorded in the last ${windowDays} days to calculate average burn rate.`,
      totalEligibleExpenses: 0,
      daysEvaluated: windowDays,
    };
  }

  const exactDays = currentBalance / averageDailySpending;
  const estimatedDays = Math.floor(exactDays);
  const depletionDate = format(addDays(today, estimatedDays), 'yyyy-MM-dd');

  let status: SurvivalEstimate['status'] = 'comfortable';
  let statusMessage = `At your current spending rate, your funds are projected to last ${estimatedDays} days.`;

  if (estimatedDays < 10) {
    status = 'critical';
    statusMessage = `Critical runway: Funds will cover less than 10 days of average expenses.`;
  } else if (estimatedDays <= warningThreshold) {
    status = 'warning';
    statusMessage = `Low runway warning: Estimated to run out in ${estimatedDays} days.`;
  } else if (estimatedDays <= 60) {
    status = 'moderate';
    statusMessage = `Moderate runway: Covering ~${Math.round(estimatedDays / 30 * 10) / 10} months of expenses.`;
  } else {
    status = 'comfortable';
    statusMessage = `Healthy runway: You have over 2 months of expenses covered.`;
  }

  return {
    currentBalance,
    averageDailySpending,
    windowDays,
    estimatedSurvivalDays: estimatedDays,
    exactSurvivalDays: Number(exactDays.toFixed(1)),
    estimatedDepletionDate: depletionDate,
    status,
    statusMessage,
    totalEligibleExpenses: Number(totalEligibleExpenses.toFixed(2)),
    daysEvaluated: windowDays,
  };
}

/**
 * Calculate Category Breakdown for a given month and transaction set
 */
export function calculateCategoryBreakdown(
  items: Array<{ category: string; amount: number; date: string }>,
  allCategories: Category[]
): CategoryBreakdown[] {
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const categoryMap = new Map<string, { amount: number; count: number }>();

  items.forEach(item => {
    const current = categoryMap.get(item.category) || { amount: 0, count: 0 };
    current.amount += Number(item.amount) || 0;
    current.count += 1;
    categoryMap.set(item.category, current);
  });

  const breakdowns: CategoryBreakdown[] = [];

  categoryMap.forEach((val, catName) => {
    const meta = allCategories.find(c => c.name.toLowerCase() === catName.toLowerCase()) || {
      color: '#64748b',
      icon: 'Tag',
    };

    const percentage = totalAmount > 0 ? Number(((val.amount / totalAmount) * 100).toFixed(1)) : 0;

    breakdowns.push({
      category: catName,
      amount: Number(val.amount.toFixed(2)),
      percentage,
      count: val.count,
      color: meta.color,
      icon: meta.icon,
    });
  });

  return breakdowns.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculates Month-to-Month comparison between two months
 */
export function calculateMonthComparison(
  fromMonth: string, // YYYY-MM
  toMonth: string,   // YYYY-MM
  expenses: ExpenseRecord[],
  incomes: IncomeRecord[],
  categories: Category[]
): MonthComparison {
  const prevExpenses = expenses.filter(e => e.date.startsWith(fromMonth));
  const currExpenses = expenses.filter(e => e.date.startsWith(toMonth));

  const prevIncomes = incomes.filter(i => i.date.startsWith(fromMonth));
  const currIncomes = incomes.filter(i => i.date.startsWith(toMonth));

  const prevExpTotal = prevExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const currExpTotal = currExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const prevIncTotal = prevIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const currIncTotal = currIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const prevNet = prevIncTotal - prevExpTotal;
  const currNet = currIncTotal - currExpTotal;

  const incomeDiff = Number((currIncTotal - prevIncTotal).toFixed(2));
  const incomePercentChange = prevIncTotal === 0 
    ? (currIncTotal > 0 ? 100 : 0)
    : Number((((currIncTotal - prevIncTotal) / prevIncTotal) * 100).toFixed(1));

  const expenseDiff = Number((currExpTotal - prevExpTotal).toFixed(2));
  const expensePercentChange = prevExpTotal === 0 
    ? (currExpTotal > 0 ? 100 : 0)
    : Number((((currExpTotal - prevExpTotal) / prevExpTotal) * 100).toFixed(1));

  const netCashFlowDiff = Number((currNet - prevNet).toFixed(2));
  const netCashFlowPercentChange = prevNet === 0 
    ? (currNet !== 0 ? 100 : 0)
    : Number((((currNet - prevNet) / Math.abs(prevNet)) * 100).toFixed(1));

  // Expense categories comparison
  const expenseCats = new Set<string>();
  prevExpenses.forEach(e => expenseCats.add(e.category));
  currExpenses.forEach(e => expenseCats.add(e.category));

  const expenseCategoryComparison = Array.from(expenseCats).map(catName => {
    const prevAmt = prevExpenses.filter(e => e.category === catName).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const currAmt = currExpenses.filter(e => e.category === catName).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const diff = Number((currAmt - prevAmt).toFixed(2));
    const percentChange = prevAmt === 0
      ? (currAmt > 0 ? 100 : 0)
      : Number((((currAmt - prevAmt) / prevAmt) * 100).toFixed(1));

    const meta = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    return {
      category: catName,
      color: meta ? meta.color : '#64748b',
      prevAmount: Number(prevAmt.toFixed(2)),
      currAmount: Number(currAmt.toFixed(2)),
      diff,
      percentChange,
    };
  }).sort((a, b) => (b.currAmount + b.prevAmount) - (a.currAmount + a.prevAmount));

  // Income categories comparison
  const incomeCats = new Set<string>();
  prevIncomes.forEach(i => incomeCats.add(i.category));
  currIncomes.forEach(i => incomeCats.add(i.category));

  const incomeCategoryComparison = Array.from(incomeCats).map(catName => {
    const prevAmt = prevIncomes.filter(i => i.category === catName).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const currAmt = currIncomes.filter(i => i.category === catName).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const diff = Number((currAmt - prevAmt).toFixed(2));
    const percentChange = prevAmt === 0
      ? (currAmt > 0 ? 100 : 0)
      : Number((((currAmt - prevAmt) / prevAmt) * 100).toFixed(1));

    const meta = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    return {
      category: catName,
      color: meta ? meta.color : '#10b981',
      prevAmount: Number(prevAmt.toFixed(2)),
      currAmount: Number(currAmt.toFixed(2)),
      diff,
      percentChange,
    };
  }).sort((a, b) => (b.currAmount + b.prevAmount) - (a.currAmount + a.prevAmount));

  // 6-month historical trend (generating 6 months leading up to toMonth)
  const trendSixMonths = [];
  const [yearStr, monthStr] = toMonth.split('-');
  const baseDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);

  for (let i = 5; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const mStr = format(d, 'yyyy-MM');
    const mName = format(d, 'MMM yyyy');

    const mIncomes = incomes.filter(inc => inc.date.startsWith(mStr)).reduce((s, inc) => s + (Number(inc.amount) || 0), 0);
    const mExpenses = expenses.filter(exp => exp.date.startsWith(mStr)).reduce((s, exp) => s + (Number(exp.amount) || 0), 0);

    trendSixMonths.push({
      month: mStr,
      monthName: mName,
      income: Number(mIncomes.toFixed(2)),
      expenses: Number(mExpenses.toFixed(2)),
      netCashFlow: Number((mIncomes - mExpenses).toFixed(2)),
    });
  }

  return {
    fromMonth,
    toMonth,
    previousMonth: {
      income: Number(prevIncTotal.toFixed(2)),
      expenses: Number(prevExpTotal.toFixed(2)),
      netCashFlow: Number(prevNet.toFixed(2)),
      transactionsCount: prevExpenses.length + prevIncomes.length,
    },
    currentMonth: {
      income: Number(currIncTotal.toFixed(2)),
      expenses: Number(currExpTotal.toFixed(2)),
      netCashFlow: Number(currNet.toFixed(2)),
      transactionsCount: currExpenses.length + currIncomes.length,
    },
    differences: {
      incomeDiff,
      incomePercentChange,
      expenseDiff,
      expensePercentChange,
      netCashFlowDiff,
      netCashFlowPercentChange,
    },
    expenseCategoryComparison,
    incomeCategoryComparison,
    trendSixMonths,
  };
}
