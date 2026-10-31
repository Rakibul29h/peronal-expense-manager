import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, HandCoins, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { BorrowingRecord } from '../types';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export const BorrowingsView: React.FC = () => {
  const { settings, refreshKey, triggerRefresh } = useApp();
  const { showToast } = useToast();
  const [records, setRecords] = useState<BorrowingRecord[]>([]);
  const [creditPerson, setCreditPerson] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [saving, setSaving] = useState<'credit' | 'debt' | null>(null);
  const [editing, setEditing] = useState<BorrowingRecord | null>(null);

  useEffect(() => {
    api.getBorrowings().then(res => setRecords(res.data)).catch(err => showToast(err.message, 'error'));
  }, [refreshKey, showToast]);

  const save = async (type: 'credit' | 'debt') => {
    const person = type === 'credit' ? creditPerson.trim() : debtPerson.trim();
    const amountText = type === 'credit' ? creditAmount : debtAmount;
    const amount = Number(amountText);
    if (!person || !Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a person and a positive amount.', 'error');
      return;
    }
    setSaving(type);
    try {
      await api.createBorrowing({ type, person, amount: Number(amount.toFixed(2)) });
      if (type === 'credit') {
        setCreditPerson('');
        setCreditAmount('');
      } else {
        setDebtPerson('');
        setDebtAmount('');
      }
      triggerRefresh();
      showToast(`${type === 'credit' ? 'Credit' : 'Debt'} saved successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save record.', 'error');
    } finally {
      setSaving(null);
    }
  };

  const saveEdit = async () => {
    if (!editing || !editing.person.trim() || editing.amount <= 0) return;
    try {
      await api.updateBorrowing(editing.id, { person: editing.person.trim(), amount: Number(editing.amount.toFixed(2)) });
      setEditing(null);
      triggerRefresh();
      showToast('Record updated successfully.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update record.', 'error');
    }
  };

  const remove = async (record: BorrowingRecord) => {
    if (!window.confirm(`Delete ${record.type} from ${record.person}?`)) return;
    try {
      await api.deleteBorrowing(record.id);
      triggerRefresh();
      showToast('Record deleted.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete record.', 'error');
    }
  };

  const symbol = settings?.currencySymbol || '৳';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Balance adjustments</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Debt &amp; Credit</h1>
        <p className="mt-1 text-sm text-slate-500">Track money received from others and money borrowed.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecordForm
          title="Credit"
          description="Money received from someone"
          personLabel="Credit from whom?"
          person={creditPerson}
          amount={creditAmount}
          onPersonChange={setCreditPerson}
          onAmountChange={setCreditAmount}
          onSave={() => save('credit')}
          saving={saving === 'credit'}
          symbol={symbol}
          tone="emerald"
          icon={<ArrowDownLeft className="h-5 w-5" />}
        />
        <RecordForm
          title="Debt"
          description="Money borrowed from someone"
          personLabel="Debt from whom?"
          person={debtPerson}
          amount={debtAmount}
          onPersonChange={setDebtPerson}
          onAmountChange={setDebtAmount}
          onSave={() => save('debt')}
          saving={saving === 'debt'}
          symbol={symbol}
          tone="amber"
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <HandCoins className="h-5 w-5 text-indigo-600" />
          <h2 className="font-bold text-slate-900">Recent records</h2>
        </div>
        {records.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No debt or credit records yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map(record => (
              <div key={record.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold text-slate-800">{record.person}</p>
                  <p className="text-xs capitalize text-slate-400">{record.type} · {record.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-bold ${record.type === 'credit' ? 'text-emerald-600' : 'text-amber-600'}`}>+{symbol}{record.amount.toFixed(2)}</p>
                  <button type="button" onClick={() => setEditing(record)} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(record)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Edit {editing.type}</h2><button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5 text-slate-400" /></button></div>
            <div className="mt-5 space-y-4">
              <input value={editing.person} onChange={event => setEditing({ ...editing, person: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <input type="number" min="0.01" step="0.01" value={editing.amount} onChange={event => setEditing({ ...editing, amount: Number(event.target.value) })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <button type="button" onClick={saveEdit} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RecordFormProps {
  title: string;
  description: string;
  personLabel: string;
  person: string;
  amount: string;
  onPersonChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  symbol: string;
  tone: 'emerald' | 'amber';
  icon: React.ReactNode;
}

const RecordForm: React.FC<RecordFormProps> = ({
  title,
  description,
  personLabel,
  person,
  amount,
  onPersonChange,
  onAmountChange,
  onSave,
  saving,
  symbol,
  tone,
  icon,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`mb-5 flex items-center gap-3 ${tone === 'emerald' ? 'text-emerald-600' : 'text-amber-600'}`}>
      <div className={`rounded-xl p-2 ${tone === 'emerald' ? 'bg-emerald-50' : 'bg-amber-50'}`}>{icon}</div>
      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <div className="space-y-4">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        {personLabel}
        <input value={person} onChange={event => onPersonChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-normal normal-case text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        Amount ({symbol})
        <input type="number" min="0.01" step="0.01" value={amount} onChange={event => onAmountChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-normal normal-case text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </label>
      <button type="button" onClick={onSave} disabled={saving} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${tone === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save {title}
      </button>
    </div>
  </section>
);
