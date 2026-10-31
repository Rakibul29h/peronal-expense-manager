import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { CURRENCIES, SURVIVAL_WINDOW_OPTIONS } from '../lib/constants';
import { Category, UserSettings, DatabaseStatus } from '../types';
import { CategoryIcon } from '../components/common/CategoryIcon';
import {
  Settings2,
  DollarSign,
  Wallet,
  Clock,
  Layers,
  Plus,
  Check,
  RotateCcw,
  AlertTriangle,
  Tag,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Database,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Pencil,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    refreshSettings,
    categories,
    refreshCategories,
    triggerRefresh,
  } = useApp();
  const { showToast } = useToast();

  // Database status state
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [testingMongo, setTestingMongo] = useState(false);

  // Settings form state
  const [currencyCode, setCurrencyCode] = useState(settings?.currency || 'BDT');
  const [openingBalance, setOpeningBalance] = useState(settings?.openingBalance?.toString() || '0');
  const [survivalWindow, setSurvivalWindow] = useState(settings?.survivalWindowDays || 30);
  const [warningThreshold, setWarningThreshold] = useState(settings?.warningThresholdDays || 15);
  const [savingSettings, setSavingSettings] = useState(false);

  // New Category Form state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [addingLoading, setAddingLoading] = useState(false);

  const fetchDbStatus = async () => {
    try {
      const res = await api.getDatabaseStatus();
      setDbStatus(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleTestMongo = async () => {
    setTestingMongo(true);
    try {
      const res = await api.retryMongoConnection();
      setDbStatus(res.status);
      if (res.success) {
        showToast('Successfully connected to MongoDB Atlas!', 'success');
        triggerRefresh();
      } else {
        showToast(
          res.error || 'Connection failed. Please check IP whitelist in MongoDB Atlas (0.0.0.0/0).',
          'error'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Connection test failed', 'error');
    } finally {
      setTestingMongo(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setCurrencyCode(settings.currency);
      setOpeningBalance(settings.openingBalance.toString());
      setSurvivalWindow(settings.survivalWindowDays);
      setWarningThreshold(settings.warningThresholdDays);
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const selectedCur = CURRENCIES.find(c => c.code === currencyCode);
      const parsedBalance = parseFloat(openingBalance) || 0;

      await api.updateSettings({
        currency: currencyCode,
        currencySymbol: selectedCur?.symbol || '৳',
        openingBalance: parsedBalance,
        survivalWindowDays: Number(survivalWindow),
        warningThresholdDays: Number(warningThreshold),
      });

      await refreshSettings();
      triggerRefresh();
      showToast('Settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      await api.updateCategory(cat.id, { isActive: !cat.isActive });
      await refreshCategories();
      triggerRefresh();
      showToast(
        `Category "${cat.name}" ${!cat.isActive ? 'enabled' : 'disabled'}`,
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update category', 'error');
    }
  };

  const handleEditCategory = async (cat: Category) => {
    const name = window.prompt('Category name', cat.name)?.trim();
    if (!name || name === cat.name) return;
    try {
      await api.updateCategory(cat.id, { name });
      await refreshCategories();
      triggerRefresh();
      showToast('Category updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"? Existing transactions will remain.`)) return;
    try {
      await api.deleteCategory(cat.id);
      await refreshCategories();
      triggerRefresh();
      showToast('Category deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    setAddingLoading(true);
    try {
      await api.createCategory({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatColor,
        icon: newCatIcon,
      });
      setNewCatName('');
      setIsAddingCategory(false);
      await refreshCategories();
      triggerRefresh();
      showToast('Custom category created!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add category', 'error');
    } finally {
      setAddingLoading(false);
    }
  };

  const handleClearData = async () => {
    if (
      !window.confirm(
        'Are you sure you want to clear all transactions? Your balance and records will be set to 0 for a completely fresh start.'
      )
    ) {
      return;
    }

    try {
      await api.clearAllData();
      await refreshSettings();
      triggerRefresh();
      showToast('All transaction records have been cleared!', 'success');
    } catch (err: any) {
      showToast('Failed to clear transactions', 'error');
    }
  };

  const handleResetData = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset categories to default? Existing transactions will remain untouched.'
      )
    ) {
      return;
    }

    try {
      await api.resetDatabase();
      await refreshSettings();
      await refreshCategories();
      triggerRefresh();
      showToast('Categories reset to defaults!', 'success');
    } catch (err: any) {
      showToast('Failed to reset categories', 'error');
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure preferred currency, opening balance, and category management
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Financial Preferences</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Currency selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Preferred Currency
            </label>
            <select
              value={currencyCode}
              onChange={e => setCurrencyCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.name} ({curr.symbol})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Default is Bangladeshi Taka (BDT, ৳)</p>
          </div>

          {/* Opening balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Opening Balance
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold text-sm">
                {CURRENCIES.find(c => c.code === currencyCode)?.symbol || '৳'}
              </span>
              <input
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Funds available prior to first recorded transaction
            </p>
          </div>

          {/* Default Survival Window */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Default Runway Window
            </label>
            <select
              value={survivalWindow}
              onChange={e => setSurvivalWindow(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              {SURVIVAL_WINDOW_OPTIONS.map(opt => (
                <option key={opt.days} value={opt.days}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Historical window for daily burn rate</p>
          </div>

          {/* Warning threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Runway Warning Threshold (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={warningThreshold}
              onChange={e => setWarningThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-1">Alerts show amber/red when days fall below this</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={savingSettings}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-60"
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Categories Management */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Categories Management</h2>
              <p className="text-xs text-slate-500">Enable, disable, or add custom categories</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Custom Category
          </button>
        </div>

        {/* Modal/Form for Adding Custom Category */}
        {isAddingCategory && (
          <form onSubmit={handleAddCategory} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in">
            <div className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
              Create New Category
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pet Care, Consultation"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Type</label>
                <select
                  value={newCatType}
                  onChange={e => setNewCatType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Color</label>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={e => setNewCatColor(e.target.value)}
                  className="w-full h-8 px-1 py-1 rounded-lg border border-slate-300 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingLoading}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                {addingLoading ? 'Adding...' : 'Save Category'}
              </button>
            </div>
          </form>
        )}

        {/* Expense Categories List */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Expense Categories ({expenseCategories.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {expenseCategories.map(cat => (
              <div
                key={cat.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  cat.isActive
                    ? 'bg-slate-50/80 border-slate-200 text-slate-800'
                    : 'bg-slate-100/50 border-slate-200/50 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-medium truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => handleEditCategory(cat)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Edit category"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => handleToggleCategoryActive(cat)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors" title={cat.isActive ? 'Disable Category' : 'Enable Category'}>
                    {cat.isActive ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => handleDeleteCategory(cat)} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" title="Delete category"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Income Categories List */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Income Categories ({incomeCategories.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {incomeCategories.map(cat => (
              <div
                key={cat.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  cat.isActive
                    ? 'bg-slate-50/80 border-slate-200 text-slate-800'
                    : 'bg-slate-100/50 border-slate-200/50 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-medium truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => handleEditCategory(cat)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Edit category"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => handleToggleCategoryActive(cat)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors" title={cat.isActive ? 'Disable Category' : 'Enable Category'}>
                    {cat.isActive ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => handleDeleteCategory(cat)} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" title="Delete category"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database & Storage Status */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Database &amp; Storage Engine</h2>
              <p className="text-xs text-slate-500">MongoDB Atlas &amp; fallback document persistence</p>
            </div>
          </div>

          {dbStatus?.isMongoConnected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Connected to Atlas
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold">
              <Database className="w-4 h-4 text-slate-500" />
              Persistent Local Storage (Active)
            </span>
          )}
        </div>

        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Current Storage Mode</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {dbStatus?.isMongoConnected
                  ? 'MongoDB Atlas (Production Cluster)'
                  : 'Local JSON Document Storage (Full Document Schema)'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Cluster / Host</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block truncate">
                {dbStatus?.clusterHost || 'Local document storage (data/db.json)'}
              </span>
            </div>
          </div>

          {!dbStatus?.isMongoConnected && dbStatus?.mongoUriConfigured && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 space-y-2 mt-2">
              <div className="font-semibold flex items-center gap-1.5 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                MongoDB Atlas Whitelist Required
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Atlas rejected connection because the current cloud container IP is not in your cluster's IP Access List.
                To allow connections from Cloud Run / AI Studio:
              </p>
              <ol className="list-decimal list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                <li>Log in to your <strong>MongoDB Atlas</strong> dashboard.</li>
                <li>Go to <strong>Security &rarr; Network Access</strong>.</li>
                <li>Click <strong>+ Add IP Address</strong>.</li>
                <li>Choose <strong>Allow Access from Anywhere (0.0.0.0/0)</strong> and click <strong>Confirm</strong>.</li>
              </ol>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/60">
            <span className="text-slate-500 text-[11px]">
              {dbStatus?.isMongoConnected
                ? 'All transactions and settings are actively synchronizing with your MongoDB cluster.'
                : 'All transactions are saved safely in persistent local document storage.'}
            </span>

            {dbStatus?.mongoUriConfigured && (
              <button
                type="button"
                onClick={handleTestMongo}
                disabled={testingMongo}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingMongo ? 'animate-spin' : ''}`} />
                {testingMongo ? 'Connecting...' : 'Test / Reconnect Atlas'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Management: Clear All Transactions & Reset */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Data Management &amp; Clean Slate</h2>
            <p className="text-xs text-slate-500">Wipe demo transactions to start fresh or restore default categories</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClearData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Transactions (Fresh Start)
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Categories to Default
          </button>
        </div>
      </div>
    </div>
  );
};
