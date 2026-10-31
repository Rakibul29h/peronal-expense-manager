import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { DashboardSummary } from '../types';
import { FinancialSummaryCards } from '../components/dashboard/FinancialSummaryCards';
import { SurvivalCalculatorCard } from '../components/dashboard/SurvivalCalculatorCard';
import { ExpensePieChart } from '../components/dashboard/ExpensePieChart';
import { IncomeCategoryChart } from '../components/dashboard/IncomeCategoryChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { selectedMonth, refreshKey, settings } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard(selectedMonth);
      setSummary(res.data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth, refreshKey]);

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-4" />
          ))}
        </div>
        {/* Skeleton Survival Card */}
        <div className="h-44 bg-white rounded-2xl border border-slate-200" />
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-2xl border border-slate-200" />
          <div className="h-80 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Error loading dashboard</h3>
        <p className="text-sm text-slate-500">{error || 'Unknown error occurred'}</p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <FinancialSummaryCards summary={summary} settings={settings} />

      {/* 2. Financial Survival Days Calculator */}
      <SurvivalCalculatorCard
        initialEstimate={summary.survivalEstimate}
        settings={settings}
      />

      {/* 3. Category Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensePieChart
          categories={summary.expenseCategories}
          totalMonthlyExpenses={summary.monthlyExpense}
          settings={settings}
          selectedMonth={selectedMonth}
        />
        <IncomeCategoryChart
          categories={summary.incomeCategories}
          totalMonthlyIncome={summary.monthlyIncome}
          settings={settings}
          selectedMonth={selectedMonth}
        />
      </div>

      {/* 4. Recent Transactions */}
      <RecentTransactions
        transactions={summary.recentTransactions}
        settings={settings}
      />
    </div>
  );
};
