import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { MonthComparison } from '../types';
import { formatCurrency, formatPercentage } from '../lib/formatters';
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Scale,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Percent,
} from 'lucide-react';

export const ComparisonView: React.FC = () => {
  const { selectedMonth, refreshKey, settings } = useApp();

  const now = new Date();
  const defaultToMonth = selectedMonth || format(now, 'yyyy-MM');
  const defaultFromMonth = format(subMonths(parseISO(`${defaultToMonth}-01`), 1), 'yyyy-MM');

  const [fromMonth, setFromMonth] = useState(defaultFromMonth);
  const [toMonth, setToMonth] = useState(defaultToMonth);
  const [comparison, setComparison] = useState<MonthComparison | null>(null);
  const [loading, setLoading] = useState(true);

  const sym = settings?.currencySymbol || '৳';
  const cur = settings?.currency || 'BDT';

  const loadComparison = async () => {
    setLoading(true);
    try {
      const res = await api.getComparison(fromMonth, toMonth);
      setComparison(res.data);
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [fromMonth, toMonth, refreshKey]);

  // Format month names for display
  const fromName = (() => {
    try {
      return format(parseISO(`${fromMonth}-01`), 'MMM yyyy');
    } catch {
      return fromMonth;
    }
  })();

  const toName = (() => {
    try {
      return format(parseISO(`${toMonth}-01`), 'MMM yyyy');
    } catch {
      return toMonth;
    }
  })();

  const barComparisonData = comparison
    ? [
        {
          metric: 'Total Income',
          [fromName]: comparison.previousMonth.income,
          [toName]: comparison.currentMonth.income,
        },
        {
          metric: 'Total Expenses',
          [fromName]: comparison.previousMonth.expenses,
          [toName]: comparison.currentMonth.expenses,
        },
        {
          metric: 'Net Cash Flow',
          [fromName]: comparison.previousMonth.netCashFlow,
          [toName]: comparison.currentMonth.netCashFlow,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header & Month Range Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Month-to-Month Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compare earnings, burn rate, and category shifts between two periods
          </p>
        </div>

        {/* Month selector pickers */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold uppercase">Base:</span>
            <input
              type="month"
              value={fromMonth}
              onChange={e => setFromMonth(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
            />
          </div>

          <span className="text-slate-300 font-bold text-xs">vs</span>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold uppercase">Target:</span>
            <input
              type="month"
              value={toMonth}
              onChange={e => setToMonth(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
            />
          </div>
        </div>
      </div>

      {loading || !comparison ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-white rounded-2xl border border-slate-200" />
            <div className="h-32 bg-white rounded-2xl border border-slate-200" />
            <div className="h-32 bg-white rounded-2xl border border-slate-200" />
          </div>
          <div className="h-80 bg-white rounded-2xl border border-slate-200" />
        </div>
      ) : (
        <>
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Income Comparison */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Income Shift
                </span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-lg ${
                    comparison.differences.incomeDiff >= 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {comparison.differences.incomeDiff >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {formatPercentage(comparison.differences.incomePercentChange)}
                </span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {comparison.differences.incomeDiff >= 0 ? '+' : ''}
                  {formatCurrency(comparison.differences.incomeDiff, sym, cur)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{fromName}: {formatCurrency(comparison.previousMonth.income, sym, cur)}</span>
                  <span aria-hidden="true">→</span>
                  <span className="font-semibold text-slate-800">{toName}: {formatCurrency(comparison.currentMonth.income, sym, cur)}</span>
                </div>
              </div>
            </div>

            {/* Expenses Comparison */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Expense Shift
                </span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-lg ${
                    comparison.differences.expenseDiff <= 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {comparison.differences.expenseDiff <= 0 ? (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  {formatPercentage(comparison.differences.expensePercentChange)}
                </span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {comparison.differences.expenseDiff >= 0 ? '+' : ''}
                  {formatCurrency(comparison.differences.expenseDiff, sym, cur)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{fromName}: {formatCurrency(comparison.previousMonth.expenses, sym, cur)}</span>
                  <span aria-hidden="true">→</span>
                  <span className="font-semibold text-slate-800">{toName}: {formatCurrency(comparison.currentMonth.expenses, sym, cur)}</span>
                </div>
              </div>
            </div>

            {/* Net Cash Flow Comparison */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Net Flow Shift
                </span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-lg ${
                    comparison.differences.netCashFlowDiff >= 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {comparison.differences.netCashFlowDiff >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {formatPercentage(comparison.differences.netCashFlowPercentChange)}
                </span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {comparison.differences.netCashFlowDiff >= 0 ? '+' : ''}
                  {formatCurrency(comparison.differences.netCashFlowDiff, sym, cur)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{fromName}: {formatCurrency(comparison.previousMonth.netCashFlow, sym, cur)}</span>
                  <span aria-hidden="true">→</span>
                  <span className="font-semibold text-slate-800">{toName}: {formatCurrency(comparison.currentMonth.netCashFlow, sym, cur)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grouped Bar Chart & 6-Month Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Direct Comparison Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Period Direct Comparison</h3>
                <p className="text-xs text-slate-500">{fromName} vs {toName}</p>
              </div>

              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), sym, cur), '']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                    <Bar dataKey={fromName} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={toName} fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 6-Month Cash Flow Trend */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">6-Month Cash Flow Trend</h3>
                <p className="text-xs text-slate-500">Historical trajectory</p>
              </div>

              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparison.trendSixMonths} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), sym, cur), '']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                    <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="netCashFlow" name="Net Flow" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category-by-Category Expense Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Category Expense Comparison</h3>
                <p className="text-xs text-slate-500">Breakdown of shifts by expense category</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5 text-right">{fromName}</th>
                    <th className="py-3 px-5 text-right">{toName}</th>
                    <th className="py-3 px-5 text-right">Difference</th>
                    <th className="py-3 px-5 text-right">% Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {comparison.expenseCategoryComparison.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No expenses recorded in either month.
                      </td>
                    </tr>
                  ) : (
                    comparison.expenseCategoryComparison.map(cat => {
                      const isDecrease = cat.diff < 0;
                      const isIncrease = cat.diff > 0;

                      return (
                        <tr key={cat.category} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-5 font-semibold text-slate-800 flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.category}
                          </td>

                          <td className="py-3 px-5 text-right text-slate-600 font-mono">
                            {formatCurrency(cat.prevAmount, sym, cur)}
                          </td>

                          <td className="py-3 px-5 text-right text-slate-900 font-bold font-mono">
                            {formatCurrency(cat.currAmount, sym, cur)}
                          </td>

                          <td
                            className={`py-3 px-5 text-right font-semibold font-mono ${
                              isDecrease ? 'text-emerald-600' : isIncrease ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {cat.diff > 0 ? '+' : ''}{formatCurrency(cat.diff, sym, cur)}
                          </td>

                          <td className="py-3 px-5 text-right font-semibold">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs ${
                                isDecrease
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : isIncrease
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatPercentage(cat.percentChange)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
