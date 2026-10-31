import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { UnifiedTransaction, UserSettings } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { CategoryIcon } from '../common/CategoryIcon';

interface RecentTransactionsProps {
  transactions: UnifiedTransaction[];
  settings: UserSettings | null;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  settings,
}) => {
  const { openExpenseModal, openIncomeModal, triggerRefresh, categories } = useApp();
  const { showToast } = useToast();

  const sym = settings?.currencySymbol || '৳';
  const cur = settings?.currency || 'BDT';

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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
          <p className="text-xs text-slate-500">Latest income and expense records</p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors py-1 px-2 rounded-lg hover:bg-indigo-50"
        >
          View All Transactions
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
          <Receipt className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
          <p className="text-sm font-medium">No recent transactions</p>
          <p className="text-xs text-slate-400 mt-0.5">Use + Add Expense or + Add Income to start</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {transactions.map(tx => {
            const isIncome = tx.type === 'income';
            const catMeta = categories.find(c => c.name.toLowerCase() === tx.category.toLowerCase());

            return (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 -mx-2 rounded-xl transition-colors group"
              >
                {/* Left: Icon & Title info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {isIncome ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {tx.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{tx.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDate(tx.date)}</span>
                      {tx.paymentMethodOrSource && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[120px]">{tx.paymentMethodOrSource}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-sm font-bold tracking-tight ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount, sym, cur)}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(tx)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
