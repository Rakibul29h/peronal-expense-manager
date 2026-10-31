import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Minus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { ExpenseRecord, IncomeRecord, UnifiedTransaction } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';

export const TransactionsView: React.FC = () => {
  const {
    openExpenseModal,
    openIncomeModal,
    refreshKey,
    triggerRefresh,
    settings,
    categories,
    selectedMonth,
  } = useApp();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'selected-month' | 'last-30' | 'specific-day' | 'date-range'>('all');
  const [specificDate, setSpecificDate] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const sym = settings?.currencySymbol || '৳';
  const cur = settings?.currency || 'BDT';

  const loadAllTransactions = async () => {
    setLoading(true);
    try {
      const [expRes, incRes] = await Promise.all([
        api.getExpenses({ limit: 500 }),
        api.getIncomes({ limit: 500 }),
      ]);
      setExpenses(expRes.data);
      setIncomes(incRes.data);
    } catch (err: any) {
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTransactions();
  }, [refreshKey]);

  // Combine into UnifiedTransaction list
  const unifiedList = useMemo<UnifiedTransaction[]>(() => {
    const list: UnifiedTransaction[] = [];

    expenses.forEach(e => {
      list.push({
        id: e.id,
        type: 'expense',
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date,
        paymentMethodOrSource: e.paymentMethod,
        notes: e.notes,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    incomes.forEach(i => {
      list.push({
        id: i.id,
        type: 'income',
        title: i.title,
        amount: i.amount,
        category: i.category,
        date: i.date,
        paymentMethodOrSource: i.source,
        notes: i.notes,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      });
    });

    return list;
  }, [expenses, incomes]);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return unifiedList.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
        const matchesSource = item.paymentMethodOrSource ? item.paymentMethodOrSource.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesNotes && !matchesSource) return false;
      }

      // Date filter
      if (dateFilter === 'selected-month') {
        if (!item.date.startsWith(selectedMonth)) return false;
      } else if (dateFilter === 'last-30') {
        const itemDate = new Date(item.date).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (itemDate < thirtyDaysAgo) return false;
      } else if (dateFilter === 'specific-day') {
        if (!specificDate || item.date !== specificDate) return false;
      } else if (dateFilter === 'date-range') {
        if (!rangeStart || !rangeEnd || item.date < rangeStart || item.date > rangeEnd) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [unifiedList, typeFilter, categoryFilter, searchQuery, dateFilter, specificDate, rangeStart, rangeEnd, sortBy, selectedMonth]);

  // Filter totals calculation
  const filterStats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netFlow,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, categoryFilter, searchQuery, dateFilter, specificDate, rangeStart, rangeEnd, sortBy]);

  const handleDelete = async (tx: UnifiedTransaction) => {
    if (!window.confirm(`Are you sure you want to delete this ${tx.type}: "${tx.title}"?`)) return;

    try {
      if (tx.type === 'expense') {
        await api.deleteExpense(tx.id);
      } else {
        await api.deleteIncome(tx.id);
      }
      showToast(`${tx.type === 'expense' ? 'Expense' : 'Income'} deleted`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  const handleEdit = (tx: UnifiedTransaction) => {
    if (tx.type === 'expense') {
      openExpenseModal({
        id: tx.id,
        title: tx.title,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        paymentMethod: tx.paymentMethodOrSource,
        notes: tx.notes,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      });
    } else {
      openIncomeModal({
        id: tx.id,
        title: tx.title,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        source: tx.paymentMethodOrSource,
        notes: tx.notes,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Transactions Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search, filter, edit, and organize all income and expenses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openIncomeModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add Income
          </button>
          <button
            onClick={() => openExpenseModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filter Summary Stats Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Filtered Income
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 block">
            +{formatCurrency(filterStats.totalIncome, sym, cur)}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Filtered Expenses
          </span>
          <span className="text-base sm:text-lg font-bold text-rose-600 mt-0.5 block">
            -{formatCurrency(filterStats.totalExpense, sym, cur)}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Filtered Net Flow
          </span>
          <span className={`text-base sm:text-lg font-bold mt-0.5 block ${filterStats.netFlow >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {filterStats.netFlow >= 0 ? '+' : ''}{formatCurrency(filterStats.netFlow, sym, cur)}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Transactions Count
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-800 mt-0.5 block">
            {filterStats.count} entries
          </span>
        </div>
      </div>

      {/* Controls Bar: Search, Type Tabs, Category, Date, Sort */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-4 relative min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, source, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>

          {/* Type Segmented Buttons */}
          <div className="sm:col-span-2 lg:col-span-3 flex items-center bg-slate-100 p-1 rounded-xl min-w-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                typeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expenses
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-2 min-w-0">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="w-full min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="selected-month">Selected Month ({selectedMonth})</option>
              <option value="last-30">Last 30 Days</option>
              <option value="specific-day">Specific Day</option>
              <option value="date-range">Date Range</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {dateFilter === 'specific-day' && (
          <label className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Transactions on
            <input
              type="date"
              value={specificDate}
              onChange={event => setSpecificDate(event.target.value)}
              className="w-full sm:w-auto min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        )}

        {dateFilter === 'date-range' && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 text-xs font-semibold text-slate-600">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <label className="flex items-center gap-2 min-w-0">
              From
              <input
                type="date"
                value={rangeStart}
                onChange={event => setRangeStart(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex items-center gap-2 min-w-0">
              To
              <input
                type="date"
                min={rangeStart || undefined}
                value={rangeEnd}
                onChange={event => setRangeEnd(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
        )}
      </div>

      {/* Main Transactions Container: Desktop Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-slate-700">No transactions match your filters</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms, changing the category or date range, or record a new transaction.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Type</th>
                    <th className="py-3 px-5">Title &amp; Notes</th>
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">Method / Source</th>
                    <th className="py-3 px-5 text-right">Amount</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {paginatedTransactions.map(tx => {
                    const isIncome = tx.type === 'income';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isIncome ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {tx.type}
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-900">{tx.title}</div>
                          {tx.notes && (
                            <div className="text-xs text-slate-400 truncate max-w-xs">{tx.notes}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-slate-600 font-medium">
                          {tx.category}
                        </td>

                        <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>

                        <td className="py-3.5 px-5 text-slate-500">
                          {tx.paymentMethodOrSource || '—'}
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <span
                            className={`font-bold ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount, sym, cur)}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(tx)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedTransactions.map(tx => {
                const isIncome = tx.type === 'income';

                return (
                  <div key={tx.id} className="p-4 space-y-2 hover:bg-slate-50/50 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {isIncome ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm break-words">{tx.title}</h4>
                      </div>

                      <span
                        className={`text-sm font-bold shrink-0 text-right ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, sym, cur)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="break-words">{tx.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDate(tx.date)}</span>
                      {tx.paymentMethodOrSource && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="break-words">{tx.paymentMethodOrSource}</span>
                        </>
                      )}
                    </div>

                    {tx.notes && (
                      <p className="text-xs text-slate-400 italic">{tx.notes}</p>
                    )}

                    <div className="pt-1 flex items-center justify-end gap-2 border-t border-slate-100">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tx)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="break-words">
                  Showing page {currentPage} of {totalPages} ({filteredTransactions.length} items)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
