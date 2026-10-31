import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  Settings2,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  HandCoins,
  ClipboardList,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { openExpenseModal, openIncomeModal } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: ReceiptText,
      description: 'History & filters',
    },
    {
      id: 'comparison',
      label: 'Comparison',
      icon: BarChart3,
      description: 'Month-to-month trends',
    },
    {
      id: 'borrowings',
      label: 'Debt & Credit',
      icon: HandCoins,
      description: 'Borrowed and received money',
    },
    {
      id: 'tuitions',
      label: 'Tution',
      icon: ClipboardList,
      description: 'Track tution days',
    },
    {
      id: 'todo',
      label: 'Todo',
      icon: CheckSquare,
      description: 'Plan and track tasks',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings2,
      description: 'Preferences & categories',
    },
  ] as const;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 justify-between min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = item.id === 'dashboard' ? pathname === '/' : pathname === `/${item.id}`;
            return (
              <Link
                key={item.id}
                href={item.id === 'dashboard' ? '/' : `/${item.id}`}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Transaction Launcher Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick Log
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openIncomeModal()}
              className="flex flex-col items-center justify-center p-2.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl transition-all group text-left"
            >
              <TrendingUp className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-800">Income</span>
            </button>
            <button
              onClick={() => openExpenseModal()}
              className="flex flex-col items-center justify-center p-2.5 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 rounded-xl transition-all group text-left"
            >
              <TrendingDown className="w-4 h-4 text-rose-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-800">Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex items-center justify-between font-medium">
          <span>Personal Finance</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">v1.0</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Accurate cash flow &amp; runway calculator</p>
      </div>
    </aside>
  );
};
