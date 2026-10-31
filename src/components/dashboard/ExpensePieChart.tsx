import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CategoryBreakdown, UserSettings } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { MousePointerClick } from 'lucide-react';

interface ExpensePieChartProps {
  categories: CategoryBreakdown[];
  totalMonthlyExpenses: number;
  settings: UserSettings | null;
  selectedMonth: string;
}

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({
  categories,
  totalMonthlyExpenses,
  settings,
  selectedMonth,
}) => {
  const { openCategoryDrilldown } = useApp();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sym = settings?.currencySymbol || '৳';
  const cur = settings?.currency || 'BDT';

  const chartData = categories.filter(c => c.amount > 0);

  const handleSliceClick = (entry: any) => {
    if (entry && entry.category) {
      openCategoryDrilldown(entry.category, 'expense', selectedMonth);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 min-w-[130px]">
          <p className="font-semibold">{data.category}</p>
          <p className="font-mono text-emerald-300 font-bold mt-1">
            {formatCurrency(data.amount, sym, cur)}
          </p>
          <p className="text-slate-300 text-[11px] mt-0.5">
            {data.percentage}% of expenses · {data.count} items
          </p>
          <p className="text-[10px] text-indigo-300 mt-1 italic">Click to view items</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Expenses by Category</h3>
            <p className="text-xs text-slate-500">Monthly spending distribution</p>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <MousePointerClick className="w-3.5 h-3.5" />
            Click slice for details
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <p className="text-sm font-medium">No expenses logged for this month</p>
            <p className="text-xs text-slate-400 mt-1">Add an expense to view breakdown</p>
          </div>
        ) : (
          <div className="relative h-64 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="category"
                  onClick={handleSliceClick}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={activeIndex === index ? '#ffffff' : 'none'}
                      strokeWidth={2}
                      className="transition-all duration-200 hover:opacity-85"
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Total Monthly Expenses in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Expenses
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(totalMonthlyExpenses, sym, cur)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Category Legend List */}
      {chartData.length > 0 && (
        <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
          {chartData.map(item => (
            <button
              key={item.category}
              type="button"
              onClick={() => openCategoryDrilldown(item.category, 'expense', selectedMonth)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                  {item.category}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-slate-900 block">
                  {formatCurrency(item.amount, sym, cur)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.percentage}%
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
