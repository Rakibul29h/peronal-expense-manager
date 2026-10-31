import React from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import {
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wallet,
  Menu,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleMobileNav: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileNav }) => {
  const {
    selectedMonth,
    setSelectedMonth,
    openExpenseModal,
    openIncomeModal,
    settings,
  } = useApp();
  const { user, logout } = useAuth();

  const handlePrevMonth = () => {
    const current = parseISO(`${selectedMonth}-01`);
    setSelectedMonth(format(subMonths(current, 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const current = parseISO(`${selectedMonth}-01`);
    setSelectedMonth(format(addMonths(current, 1), 'yyyy-MM'));
  };

  const displayMonthName = (() => {
    try {
      return format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy');
    } catch {
      return selectedMonth;
    }
  })();

  const isCurrentMonth = selectedMonth === format(new Date(), 'yyyy-MM');

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-0 sm:h-16 flex flex-wrap items-center gap-2 sm:gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus-visible:outline-2 focus-visible:outline-indigo-500"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">Flow</span>
              <span className="hidden sm:inline-block text-xs text-slate-400 font-medium ml-2">Personal</span>
            </div>
          </div>
        </div>

        {/* Center: Month Selector */}
        <div className="order-3 basis-full sm:order-none sm:basis-auto flex items-center justify-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1 font-semibold text-xs sm:text-sm text-slate-800 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 hidden xs:inline" />
            <span className="whitespace-nowrap">{displayMonthName}</span>
            {isCurrentMonth && (
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-md ml-1">
                Current
              </span>
            )}
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Add Income Button */}
          <button
            onClick={() => openIncomeModal()}
            className="flex items-center gap-1 px-2.5 py-2 sm:gap-1.5 sm:px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-emerald-200 transition-all hover:shadow-sm focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add</span> Income
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => openExpenseModal()}
            className="flex items-center gap-1 px-2.5 py-2 sm:gap-1.5 sm:px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-rose-200 transition-all hover:shadow-sm focus-visible:outline-2 focus-visible:outline-rose-600"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add</span> Expense
          </button>
          <button
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:px-3"
            title={user?.email}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
