import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  HelpCircle,
  Calendar,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { SurvivalEstimate, UserSettings } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { SURVIVAL_WINDOW_OPTIONS } from '../../lib/constants';
import { api } from '../../lib/api';

interface SurvivalCalculatorCardProps {
  initialEstimate: SurvivalEstimate;
  settings: UserSettings | null;
  onWindowChange?: (days: number) => void;
}

export const SurvivalCalculatorCard: React.FC<SurvivalCalculatorCardProps> = ({
  initialEstimate,
  settings,
  onWindowChange,
}) => {
  const [estimate, setEstimate] = useState<SurvivalEstimate>(initialEstimate);
  const [activeWindow, setActiveWindow] = useState<number>(initialEstimate.windowDays || 30);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    setEstimate(initialEstimate);
  }, [initialEstimate]);

  const handleSelectWindow = async (days: number) => {
    setActiveWindow(days);
    if (onWindowChange) {
      onWindowChange(days);
    }
    setLoading(true);
    try {
      const res = await api.getSurvivalEstimate(days);
      setEstimate(res.data);
    } catch (err) {
      console.error('Failed to update survival estimate:', err);
    } finally {
      setLoading(false);
    }
  };

  const sym = settings?.currencySymbol || '৳';
  const cur = settings?.currency || 'BDT';

  // Determine visual styling based on runway health
  const getStatusStyles = () => {
    switch (estimate.status) {
      case 'depleted':
        return {
          badge: 'text-rose-700 bg-rose-50 border-rose-200',
          indicator: 'bg-rose-500',
          titleColor: 'text-rose-600',
          icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
          progressPercent: 0,
        };
      case 'critical':
        return {
          badge: 'text-rose-700 bg-rose-50 border-rose-200',
          indicator: 'bg-rose-500',
          titleColor: 'text-rose-600',
          icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
          progressPercent: Math.min(100, (estimate.estimatedSurvivalDays / 30) * 100),
        };
      case 'warning':
        return {
          badge: 'text-amber-700 bg-amber-50 border-amber-200',
          indicator: 'bg-amber-500',
          titleColor: 'text-amber-600',
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          progressPercent: Math.min(100, (estimate.estimatedSurvivalDays / 60) * 100),
        };
      case 'moderate':
        return {
          badge: 'text-blue-700 bg-blue-50 border-blue-200',
          indicator: 'bg-blue-500',
          titleColor: 'text-blue-600',
          icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
          progressPercent: Math.min(100, (estimate.estimatedSurvivalDays / 90) * 100),
        };
      case 'comfortable':
        return {
          badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          indicator: 'bg-emerald-500',
          titleColor: 'text-emerald-600',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
          progressPercent: 100,
        };
      default:
        return {
          badge: 'text-slate-700 bg-slate-100 border-slate-200',
          indicator: 'bg-slate-400',
          titleColor: 'text-slate-700',
          icon: <Info className="w-5 h-5 text-slate-500" />,
          progressPercent: 0,
        };
    }
  };

  const statusStyle = getStatusStyles();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
      {/* Top row: Title, Status Indicator, and Historical Window selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
            {statusStyle.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Financial Survival Days Calculator</h3>
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                title="How is this calculated?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Estimated days remaining based on historical daily spending
            </p>
          </div>
        </div>

        {/* Window Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {SURVIVAL_WINDOW_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => handleSelectWindow(opt.days)}
              disabled={loading}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeWindow === opt.days
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {opt.days}d
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Banner (Collapsible) */}
      {showExplanation && (
        <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 animate-in fade-in duration-150">
          <p className="font-semibold text-slate-800">Formula &amp; Methodology:</p>
          <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
            Avg Daily Spending = Total Window Expenses / {activeWindow} Days
            <br />
            Survival Days = Available Balance / Avg Daily Spending
          </div>
          <p className="text-[11px] text-slate-500">
            * Note: This is an analytical estimate based purely on actual recorded historical spending, not a financial guarantee. It does not speculate on unearned future income or unforeseen expenses.
          </p>
        </div>
      )}

      {/* Main Metric Visual Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 items-center">
        {/* Large Estimate Number */}
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-5 md:pb-0 pr-0 md:pr-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Projected Runway
          </span>

          {estimate.status === 'insufficient_data' ? (
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-700">No Recent Spending</span>
              <p className="text-xs text-slate-400 mt-1">
                Record expenses in the last {activeWindow} days to compute average burn rate.
              </p>
            </div>
          ) : estimate.status === 'depleted' ? (
            <div className="mt-2">
              <span className="text-3xl font-black text-rose-600">0 Days</span>
              <p className="text-xs font-medium text-rose-600 mt-1">
                {estimate.currentBalance < 0 ? 'Balance below zero' : 'Balance is depleted'}
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl sm:text-5xl font-black tracking-tight ${statusStyle.titleColor}`}>
                  {estimate.estimatedSurvivalDays}
                </span>
                <span className="text-lg font-bold text-slate-600">Days</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Exact: ~{estimate.exactSurvivalDays} calendar days
              </p>
            </div>
          )}
        </div>

        {/* Detailed Metrics */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Balance
              </span>
              <span className={`text-sm font-bold mt-0.5 block ${estimate.currentBalance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatCurrency(estimate.currentBalance, sym, cur)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Daily Burn Rate
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {formatCurrency(estimate.averageDailySpending, sym, cur)}/day
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Depletion Date
              </span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {estimate.estimatedDepletionDate ? formatDate(estimate.estimatedDepletionDate, 'MMM d, yyyy') : 'N/A'}
              </span>
            </div>
          </div>

          {/* Progress Bar & Status Text */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600">{estimate.statusMessage}</span>
              <span className="font-semibold text-slate-500">{activeWindow}-day window</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${statusStyle.indicator}`}
                style={{ width: `${Math.max(5, Math.min(100, statusStyle.progressPercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
