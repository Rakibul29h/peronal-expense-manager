import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRightLeft,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import { DashboardSummary, UserSettings } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface FinancialSummaryCardsProps {
  summary: DashboardSummary;
  settings: UserSettings | null;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({ summary, settings }) => {
  const sym = settings?.currencySymbol || '৳';
  const cur = settings?.currency || 'BDT';

  const isBalanceNegative = summary.currentBalance < 0;
  const isSavingsPositive = summary.monthlySavings >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Remaining Available Balance (Prominent Highlight Card) */}
      <div
        className={`sm:col-span-2 lg:col-span-1 xl:col-span-2 p-5 rounded-2xl border transition-all ${
          isBalanceNegative
            ? 'bg-rose-50/70 border-rose-300 text-rose-950 shadow-xs'
            : 'bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold tracking-wider uppercase ${isBalanceNegative ? 'text-rose-700' : 'text-indigo-200'}`}>
            Available Balance
          </span>
          <div className={`p-2 rounded-xl ${isBalanceNegative ? 'bg-rose-100 text-rose-700' : 'bg-white/10 text-white'}`}>
            {isBalanceNegative ? <AlertTriangle className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {formatCurrency(summary.currentBalance, sym, cur)}
          </div>
          <div className={`flex items-center gap-1.5 text-xs mt-2 ${isBalanceNegative ? 'text-rose-700' : 'text-indigo-100'}`}>
            <span>All records through today</span>
            <span aria-hidden="true">·</span>
            <span>Opening: {formatCurrency(summary.openingBalance, sym, cur)}</span>
          </div>
        </div>
      </div>

      {/* 2. Monthly Income */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Monthly Income
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(summary.monthlyIncome, sym, cur)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total earned this month
          </p>
        </div>
      </div>

      {/* 3. Monthly Expenses */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Monthly Expenses
          </span>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(summary.monthlyExpense, sym, cur)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total spent this month
          </p>
        </div>
      </div>

      {/* 4. Monthly Savings / Net Cash Flow */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Monthly Net Flow
          </span>
          <div className={`p-2 rounded-xl ${isSavingsPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-xl sm:text-2xl font-bold tracking-tight ${isSavingsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {summary.monthlySavings > 0 ? '+' : ''}{formatCurrency(summary.monthlySavings, sym, cur)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Income minus expenses
          </p>
        </div>
      </div>

      {/* 5. Daily Average Spending */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Avg Daily Spending
          </span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(summary.averageDailySpending, sym, cur)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {summary.monthlyTransactionsCount} transactions logged
          </p>
        </div>
      </div>
    </div>
  );
};
