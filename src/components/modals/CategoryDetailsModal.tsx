import React, { useState, useEffect } from 'react';
import { X, Calendar, Edit2, Trash2, Tag, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ExpenseRecord, IncomeRecord } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';

export const CategoryDetailsModal: React.FC = () => {
  const {
    drilldownCategory,
    closeCategoryDrilldown,
    settings,
    categories,
    openExpenseModal,
    openIncomeModal,
    triggerRefresh,
    refreshKey,
  } = useApp();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!drilldownCategory) return;

    const fetchCategoryTransactions = async () => {
      setLoading(true);
      try {
        if (drilldownCategory.type === 'expense') {
          const res = await api.getExpenses({
            month: drilldownCategory.month,
            category: drilldownCategory.categoryName,
          });
          setExpenses(res.data);
        } else {
          const res = await api.getIncomes({
            month: drilldownCategory.month,
            category: drilldownCategory.categoryName,
          });
          setIncomes(res.data);
        }
      } catch (err: any) {
        showToast('Failed to load category details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryTransactions();
  }, [drilldownCategory, refreshKey]);

  if (!drilldownCategory) return null;

  const currentCategoryMeta = categories.find(
    c => c.name.toLowerCase() === drilldownCategory.categoryName.toLowerCase()
  );

  const totalAmount =
    drilldownCategory.type === 'expense'
      ? expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
      : incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      showToast('Expense deleted', 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this income?')) return;
    try {
      await api.deleteIncome(id);
      showToast('Income deleted', 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete income', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={closeCategoryDrilldown}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: currentCategoryMeta?.color || '#64748b' }}
            >
              <CategoryIcon name={currentCategoryMeta?.icon || 'Tag'} className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{drilldownCategory.categoryName}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize text-slate-600 bg-slate-200/60">
                  {drilldownCategory.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Month: {drilldownCategory.month} · Total: {formatCurrency(totalAmount, settings?.currencySymbol, settings?.currency)}
              </p>
            </div>
          </div>
          <button
            onClick={closeCategoryDrilldown}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="space-y-3 py-4">
              <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
              <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
              <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
            </div>
          ) : drilldownCategory.type === 'expense' ? (
            expenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">No expenses found in this category for {drilldownCategory.month}.</p>
              </div>
            ) : (
              expenses.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{formatDate(item.date)}</span>
                      {item.paymentMethod && (
                        <>
                          <span>·</span>
                          <span>{item.paymentMethod}</span>
                        </>
                      )}
                      {item.notes && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[150px] italic">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600 text-sm">
                      -{formatCurrency(item.amount, settings?.currencySymbol, settings?.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          closeCategoryDrilldown();
                          openExpenseModal(item);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : incomes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No income records found in this category for {drilldownCategory.month}.</p>
            </div>
          ) : (
            incomes.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-semibold text-slate-800 text-sm truncate">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{formatDate(item.date)}</span>
                    {item.source && (
                      <>
                        <span>·</span>
                        <span>{item.source}</span>
                      </>
                    )}
                    {item.notes && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[150px] italic">{item.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 text-sm">
                    +{formatCurrency(item.amount, settings?.currencySymbol, settings?.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        closeCategoryDrilldown();
                        openIncomeModal(item);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteIncome(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Click any transaction to edit or delete</span>
          <button
            onClick={closeCategoryDrilldown}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
