import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { db, initDatabase, ensureMonthCarryForward } from '@/server/db/store';
import {
  calculateCurrentBalance,
  calculateSurvivalEstimate,
  calculateCategoryBreakdown,
} from '@/server/calculations';
import { UnifiedTransaction } from '@/src/types';

export async function GET(request: NextRequest) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month') || format(new Date(), 'yyyy-MM');
    const days = parseInt(searchParams.get('days') || '30', 10);
    await ensureMonthCarryForward(selectedMonth);

    const [settings, expenses, incomes, categories, borrowings] = await Promise.all([
      db.getSettings(),
      db.getExpenses(),
      db.getIncomes(),
      db.getCategories(),
      db.getBorrowings(),
    ]);

    const { currentBalance, totalIncomeThroughToday, totalExpenseThroughToday } =
      calculateCurrentBalance(settings.openingBalance, incomes, expenses, borrowings);

    const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
    const monthIncomes = incomes.filter(i => i.date.startsWith(selectedMonth));

    const monthlyExpense = Number(
      monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toFixed(2)
    );
    const monthlyIncome = Number(
      monthIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0).toFixed(2)
    );
    const monthlySavings = Number((monthlyIncome - monthlyExpense).toFixed(2));
    const monthlyTransactionsCount = monthExpenses.length + monthIncomes.length;

    console.log(
      `[dashboard] ${selectedMonth}: ${monthlyExpense.toFixed(2)} expenses, ` +
      `${monthlyIncome.toFixed(2)} income, ${monthlyTransactionsCount} transactions`
    );

    const today = new Date();
    const currentMonthStr = format(today, 'yyyy-MM');
    let daysInMonthForCalc = 30;
    if (selectedMonth === currentMonthStr) {
      daysInMonthForCalc = Math.max(1, today.getDate());
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      daysInMonthForCalc = new Date(y, m, 0).getDate();
    }
    const averageDailySpending = Number((monthlyExpense / daysInMonthForCalc).toFixed(2));

    const expenseCategories = calculateCategoryBreakdown(
      monthExpenses.map(e => ({ category: e.category, amount: e.amount, date: e.date })),
      categories.filter(c => c.type === 'expense')
    );

    const incomeCategories = calculateCategoryBreakdown(
      monthIncomes.map(i => ({ category: i.category, amount: i.amount, date: i.date })),
      categories.filter(c => c.type === 'income')
    );

    const unified: UnifiedTransaction[] = [
      ...expenses.map(e => ({
        id: e.id,
        type: 'expense' as const,
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date,
        paymentMethodOrSource: e.paymentMethod,
        notes: e.notes,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      ...incomes.map(i => ({
        id: i.id,
        type: 'income' as const,
        title: i.title,
        amount: i.amount,
        category: i.category,
        date: i.date,
        paymentMethodOrSource: i.source,
        notes: i.notes,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
    ].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    });

    const recentTransactions = unified.slice(0, 8);
    const windowDays = days || settings.survivalWindowDays || 30;
    const survivalEstimate = calculateSurvivalEstimate(
      currentBalance,
      expenses,
      windowDays,
      settings.warningThresholdDays
    );

    return NextResponse.json({
      data: {
        selectedMonth,
        currentBalance,
        openingBalance: settings.openingBalance,
        allTimeIncome: totalIncomeThroughToday,
        allTimeExpense: totalExpenseThroughToday,
        monthlyIncome,
        monthlyExpense,
        monthlySavings,
        monthlyTransactionsCount,
        averageDailySpending,
        expenseCategories,
        incomeCategories,
        recentTransactions,
        survivalEstimate,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
