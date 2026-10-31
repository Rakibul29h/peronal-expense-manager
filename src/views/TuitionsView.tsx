import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Eye, Plus, RotateCcw, Pencil, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { api } from '../lib/api';
import { TuitionRecord } from '../types';
import { useToast } from '../context/ToastContext';

export const TuitionsView: React.FC = () => {
  const { showToast } = useToast();
  const [tuitions, setTuitions] = useState<TuitionRecord[]>([]);
  const [name, setName] = useState('');
  const [targetDays, setTargetDays] = useState('26');
  const [extraDates, setExtraDates] = useState<string[]>(['']);
  const [addingDates, setAddingDates] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<TuitionRecord | null>(null);
  const [editingSession, setEditingSession] = useState<{ tuitionId: string; date: string; newDate: string } | null>(null);

  const isComplete = (tution: TuitionRecord) => {
    const month = format(new Date(), 'yyyy-MM');
    return tution.sessions.filter(session => session.completed && session.date.startsWith(month)).length >= tution.targetDaysPerMonth;
  };

  const load = async () => {
    try {
      const response = await api.getTuitions();
      setTuitions(response.data);
      setSelectedId(current => {
        const selected = response.data.find(item => item.id === current);
        if (selected && !isComplete(selected)) return selected.id;
        return response.data.find(item => !isComplete(item))?.id || '';
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to load tutions', 'error');
    }
  };

  const deleteSession = async (tuition: TuitionRecord, date: string) => {
    if (!window.confirm(`Delete the session on ${date}?`)) return;
    try {
      await api.updateTuition(tuition.id, { action: 'deleteSession', date });
      await load();
      showToast('Session deleted.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete session', 'error');
    }
  };

  const saveSessionEdit = async () => {
    if (!editingSession?.newDate) return;
    try {
      await api.updateTuition(editingSession.tuitionId, {
        action: 'editSession',
        date: editingSession.date,
        newDate: editingSession.newDate,
      });
      setEditingSession(null);
      await load();
      showToast('Session date updated.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update session', 'error');
    }
  };

  const toggleTuitionPaid = async (tuition: TuitionRecord) => {
    try {
      await api.updateTuition(tuition.id, { action: 'setPaid', paid: !tuition.paid });
      await load();
      showToast(!tuition.paid ? 'Tution marked as paid.' : 'Tution marked as unpaid.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update payment status', 'error');
    }
  };

  useEffect(() => { load(); }, []);

  const addDate = () => {
    setAddingDates(true);
    setExtraDates(current => current.length ? [...current, ''] : ['']);
  };

  const createTuition = async () => {
    const days = Number(targetDays);
    if (!name.trim() || !Number.isInteger(days) || days < 1 || days > 31) {
      showToast('Enter a tution name and a monthly day target from 1 to 31.', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await api.createTuition({ name: name.trim(), targetDaysPerMonth: days });
      setName('');
      setTargetDays('26');
      setCreateOpen(false);
      setSelectedId(response.data.id);
      await load();
      showToast('Tution created successfully.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create tution', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addMultipleDays = async () => {
    if (!selectedId) {
      showToast('Select a tution first.', 'error');
      return;
    }
    const cleanDates = extraDates.filter(Boolean);
    if (!cleanDates.length) {
      showToast('Add at least one date.', 'error');
      return;
    }
    try {
      await api.updateTuition(selectedId, { action: 'addDates', dates: cleanDates });
      setExtraDates(['']);
      setAddingDates(false);
      await load();
      showToast(`${cleanDates.length} completed day(s) added.`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to add dates', 'error');
    }
  };

  const addToday = async () => {
    if (!selectedId) {
      showToast('Create or select a tution first.', 'error');
      return;
    }
    try {
      await api.updateTuition(selectedId, { action: 'addToday', date: format(new Date(), 'yyyy-MM-dd') });
      await load();
      showToast('Today was added as a completed tution day.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to add today', 'error');
    }
  };

  const selected = tuitions.find(item => item.id === selectedId);

  const saveEdit = async () => {
    if (!editing || !editing.name.trim() || editing.targetDaysPerMonth < 1 || editing.targetDaysPerMonth > 31) return;
    try {
      await api.updateTuition(editing.id, { action: 'edit', name: editing.name.trim(), targetDaysPerMonth: editing.targetDaysPerMonth });
      setEditing(null);
      await load();
      showToast('Tution updated successfully.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update tution', 'error');
    }
  };

  const removeTuition = async (tuition: TuitionRecord) => {
    if (!window.confirm(`Delete tution "${tuition.name}" and all its session history?`)) return;
    try {
      await api.deleteTuition(tuition.id);
      if (selectedId === tuition.id) setSelectedId('');
      await load();
      showToast('Tution deleted.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete tution', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Session tracker</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Tution</h1>
        <p className="mt-1 text-sm text-slate-500">Set a monthly target, then record one or multiple completed days.</p>
      </header>

      <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
        <Plus className="h-4 w-4" />Create New Tution
      </button>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Create tution</h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close create tution dialog">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Tution name
                <input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Rahim Mathematics" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-normal normal-case outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Days per month
                <input type="number" min="1" max="31" value={targetDays} onChange={event => setTargetDays(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-normal normal-case outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={createTuition} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  <Plus className="h-4 w-4" />{loading ? 'Creating...' : 'Add Tution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select value={selectedId} onChange={event => setSelectedId(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
          <option value="">Select a tution</option>
          {tuitions.filter(item => !isComplete(item)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button type="button" onClick={addToday} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />Add Today</button>
        <button type="button" onClick={addDate} className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><Plus className="h-4 w-4" />Add Multiple Days</button>
        <button type="button" onClick={() => setViewOpen(value => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" />{viewOpen ? 'Hide View' : 'View'}</button>
      </div>

      {selected && addingDates && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
          <p className="text-sm font-bold text-slate-900">Add missed days</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {extraDates.map((date, index) => (
              <input key={index} type="date" value={date} onChange={event => setExtraDates(current => current.map((item, i) => i === index ? event.target.value : item))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            ))}
            <button type="button" onClick={addDate} className="rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700">+ Another date</button>
            <button type="button" onClick={addMultipleDays} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Save dates</button>
          </div>
        </section>
      )}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Edit session date</h2><button type="button" onClick={() => setEditingSession(null)}><X className="h-5 w-5 text-slate-400" /></button></div>
            <input type="date" value={editingSession.newDate} onChange={event => setEditingSession({ ...editingSession, newDate: event.target.value })} className="mt-5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <button type="button" onClick={saveSessionEdit} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Save date</button>
          </div>
        </div>
      )}

      {viewOpen && selected && <TuitionDetails tuition={selected} onEditSession={date => setEditingSession({ tuitionId: selected.id, date, newDate: date })} onDeleteSession={date => deleteSession(selected, date)} />}
      {viewOpen && !selected && <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">Create or select a tution to view its details.</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {tuitions.map(tuition => <TuitionCard key={tuition.id} tuition={tuition} onSelect={() => { setSelectedId(tuition.id); setViewOpen(true); }} onEdit={() => setEditing(tuition)} onDelete={() => removeTuition(tuition)} onTogglePaid={() => toggleTuitionPaid(tuition)} />)}
        {tuitions.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 md:col-span-2"><ClipboardList className="mx-auto mb-2 h-7 w-7" />No tution created yet.</div>}
      </section>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Edit tution</h2><button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5 text-slate-400" /></button></div>
            <div className="mt-5 space-y-4">
              <input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <input type="number" min="1" max="31" value={editing.targetDaysPerMonth} onChange={event => setEditing({ ...editing, targetDaysPerMonth: Number(event.target.value) })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <button type="button" onClick={saveEdit} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TuitionCard: React.FC<{ tuition: TuitionRecord; onSelect: () => void; onEdit: () => void; onDelete: () => void; onTogglePaid: () => void }> = ({ tuition, onSelect, onEdit, onDelete, onTogglePaid }) => {
  const month = format(new Date(), 'yyyy-MM');
  const completed = tuition.sessions.filter(session => session.completed && session.date.startsWith(month)).length;
  const complete = completed >= tuition.targetDaysPerMonth;
  const months = [...new Set(tuition.sessions.map(session => format(parseISO(session.date), 'MMM yyyy')))].join(' → ');
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onSelect} className="min-w-0 text-left"><h2 className="font-bold text-slate-900">{tuition.name}</h2><p className="mt-1 text-xs text-slate-500">{months}</p></button>
        <div className="flex items-center gap-1"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${complete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{complete ? 'Complete' : `${Math.max(0, tuition.targetDaysPerMonth - completed)} remaining`}</span><button type="button" onClick={event => { event.stopPropagation(); onTogglePaid(); }} className={`rounded-full px-2.5 py-1 text-xs font-bold ${tuition.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{tuition.paid ? 'Paid' : 'Unpaid'}</button><button type="button" onClick={event => { event.stopPropagation(); onEdit(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={event => { event.stopPropagation(); onDelete(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button></div>
      </div>
      <button type="button" onClick={onSelect} className="mt-5 w-full text-left"><div className="flex items-center justify-between text-sm"><span className="text-slate-500">Days counted this month</span><strong className="text-slate-900">{completed} / {tuition.targetDaysPerMonth}</strong></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, (completed / tuition.targetDaysPerMonth) * 100)}%` }} /></div>
      </button>
    </article>
  );
};

const TuitionDetails: React.FC<{ tuition: TuitionRecord; onEditSession: (date: string) => void; onDeleteSession: (date: string) => void }> = ({ tuition, onEditSession, onDeleteSession }) => {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const completed = tuition.sessions.filter(session => session.completed && session.date.startsWith(currentMonth)).length;
  const days = tuition.sessions.map(session => parseISO(session.date)).sort((a, b) => a.getTime() - b.getTime());
  const range = days.length ? `${format(days[0], 'EEE, dd MMM yyyy')} → ${format(days[days.length - 1], 'EEE, dd MMM yyyy')}` : 'No dates';
  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
      <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-indigo-600" /><h2 className="font-bold text-slate-900">{tuition.name} details</h2></div>
      <p className="mt-2 text-sm text-slate-600">Date range: {range}</p>
      <p className="mt-1 text-sm text-slate-600">This month: <strong>{completed} / {tuition.targetDaysPerMonth} days</strong> · Days remaining: <strong>{Math.max(0, tuition.targetDaysPerMonth - completed)}</strong> · Months covered: <strong>{new Set(tuition.sessions.map(session => format(parseISO(session.date), 'MMM yyyy'))).size}</strong></p>
      <div className="mt-4 space-y-2">{tuition.sessions.map(session => <div key={session.date} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2"><span className={`text-xs font-semibold ${session.completed ? 'text-emerald-700' : 'text-slate-600'}`}>{format(parseISO(session.date), 'EEE, dd MMM yyyy')} {session.completed ? '✓' : ''}</span><span className="flex items-center gap-1"><button type="button" onClick={() => onEditSession(session.date)} className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit session"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => onDeleteSession(session.date)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete session"><Trash2 className="h-3.5 w-3.5" /></button></span></div>)}</div>
    </section>
  );
};
