'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CalendarDays,
  CheckSquare,
  CirclePlus,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { TodoPriority, TodoRecord, TodoStatus } from '../types';

const columns: Array<{ id: TodoStatus; label: string; color: string }> = [
  { id: 'backlog', label: 'Backlog', color: 'bg-slate-400' },
  { id: 'todo', label: 'Todo', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500' },
  { id: 'canceled', label: 'Canceled', color: 'bg-rose-500' },
];

const priorities: TodoPriority[] = ['low', 'medium', 'high', 'urgent'];
const priorityClasses: Record<TodoPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-amber-50 text-amber-700',
  urgent: 'bg-rose-50 text-rose-700',
};

type Draft = Omit<TodoRecord, 'id' | 'createdAt' | 'updatedAt' | 'order'>;
const emptyDraft: Draft = { title: '', description: '', status: 'backlog', priority: 'medium', dueDate: '', tags: [] };

async function request(path: string, options?: RequestInit) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Todo request failed');
  return body;
}

function SortableTask({ task, onEdit, onDelete }: { task: TodoRecord; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${isDragging ? 'z-10 opacity-60 shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 cursor-grab touch-none text-slate-300 hover:text-slate-500" aria-label="Drag task">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold text-slate-800">{task.title}</h3>
          {task.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${priorityClasses[task.priority]}`}>{task.priority}</span>
            {task.dueDate && <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays className="h-3 w-3" />{task.dueDate}</span>}
            {task.tags.slice(0, 3).map(tag => <span key={tag} className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">{tag}</span>)}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(value => !value)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Task actions">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <button onClick={onEdit} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" />Edit</button>
              <button onClick={onDelete} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Delete</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Column({ column, tasks, onEdit, onDelete }: { column: typeof columns[number]; tasks: TodoRecord[]; onEdit: (task: TodoRecord) => void; onDelete: (task: TodoRecord) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section ref={setNodeRef} className={`flex min-h-[420px] min-w-0 flex-col rounded-2xl border p-3 transition-colors ${isOver ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 bg-slate-100/70'}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700"><span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />{column.label}<span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{tasks.length}</span></h2>
      </div>
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {tasks.map(task => <SortableTask key={task.id} task={task} onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} />)}
          {tasks.length === 0 && <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">Drop tasks here</div>}
        </div>
      </SortableContext>
    </section>
  );
}

export const TodoView: React.FC = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TodoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<'all' | TodoPriority>('all');
  const [dueOnly, setDueOnly] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modal, setModal] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editing, setEditing] = useState<TodoRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadTasks = async () => {
    setLoading(true);
    try { setTasks((await request('/api/todos')).data); } catch (error: any) { showToast(error.message, 'error'); } finally { setLoading(false); }
  };
  useEffect(() => { void loadTasks(); }, []);

  const visibleTasks = useMemo(() => tasks.filter(task =>
    (!query || task.title.toLowerCase().includes(query.toLowerCase())) &&
    (priority === 'all' || task.priority === priority) &&
    (!dueOnly || !!task.dueDate)
  ), [tasks, query, priority, dueOnly]);
  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  const saveOrder = async (nextTasks: TodoRecord[]) => {
    await request('/api/todos/reorder', { method: 'PATCH', body: JSON.stringify({ items: nextTasks.map((task, index) => ({ id: task.id, status: task.status, order: index })) }) });
  };

  const handleDragStart = ({ active }: { active: { id: string | number } }) => setActiveId(String(active.id));
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const source = tasks.find(task => task.id === active.id);
    if (!source) return;
    const destinationStatus = columns.some(column => column.id === over.id) ? over.id as TodoStatus : tasks.find(task => task.id === over.id)?.status;
    if (!destinationStatus) return;
    const destination = tasks.find(task => task.id === over.id);
    const without = tasks.filter(task => task.id !== source.id);
    const destinationItems = without.filter(task => task.status === destinationStatus);
    const insertAt = destination ? Math.max(0, destinationItems.findIndex(task => task.id === destination.id)) : destinationItems.length;
    const moved = { ...source, status: destinationStatus };
    destinationItems.splice(insertAt, 0, moved);
    const next = columns.flatMap(column => (column.id === destinationStatus ? destinationItems : without.filter(task => task.status === column.id))).map((task, index) => ({ ...task, order: index }));
    setTasks(next);
    try { await saveOrder(next); } catch (error: any) { showToast(error.message, 'error'); await loadTasks(); }
  };

  const openCreate = () => { setEditing(null); setDraft(emptyDraft); setModal('create'); };
  const openEdit = (task: TodoRecord) => { setEditing(task); setDraft({ title: task.title, description: task.description, status: task.status, priority: task.priority, dueDate: task.dueDate || '', tags: task.tags }); setModal('edit'); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const body = { ...draft, tags: draft.tags.filter(Boolean) };
      const result = await request(editing ? `/api/todos/${editing.id}` : '/api/todos', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      setTasks(previous => editing ? previous.map(task => task.id === editing.id ? result.data : task) : [...previous, result.data]);
      setModal('closed'); showToast(editing ? 'Task updated' : 'Task created');
    } catch (error: any) { showToast(error.message, 'error'); }
  };
  const deleteTask = async (task: TodoRecord) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try { await request(`/api/todos/${task.id}`, { method: 'DELETE' }); setTasks(previous => previous.filter(item => item.id !== task.id)); showToast('Task deleted'); } catch (error: any) { showToast(error.message, 'error'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-indigo-600">Workspace</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900"><CheckSquare className="h-6 w-6 text-indigo-600" />Todo board</h1><p className="mt-1 text-sm text-slate-500">Organize work and keep momentum.</p></div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><CirclePlus className="h-4 w-4" />Add task</button>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm text-slate-500"><Search className="h-4 w-4" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tasks by title..." className="min-w-0 flex-1 bg-transparent py-2 outline-none" /></label>
        <select value={priority} onChange={event => setPriority(event.target.value as typeof priority)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><option value="all">All priorities</option>{priorities.map(item => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"><input type="checkbox" checked={dueOnly} onChange={event => setDueOnly(event.target.checked)} />Due dates</label>
      </div>
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading tasks...</div> : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 pb-3 md:grid-cols-2 xl:grid-cols-3">{columns.map(column => <Column key={column.id} column={column} tasks={visibleTasks.filter(task => task.status === column.id).sort((a, b) => a.order - b.order)} onEdit={openEdit} onDelete={deleteTask} />)}</div>
          <DragOverlay>{activeTask ? <div className="w-[280px] rounded-xl border border-indigo-200 bg-white p-3 text-sm font-semibold shadow-xl">{activeTask.title}</div> : null}</DragOverlay>
        </DndContext>
      )}
      {modal !== 'closed' && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setModal('closed'); }}>
        <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit task' : 'Add task'}</h2><button type="button" onClick={() => setModal('closed')} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
          <input required maxLength={150} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Task title" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
          <textarea maxLength={1000} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Description (optional)" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
          <div className="grid gap-3 sm:grid-cols-3"><select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as TodoStatus })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="backlog">Backlog</option><option value="todo">Todo</option><option value="in_progress">In Progress</option><option value="done">Done</option><option value="canceled">Canceled</option></select><select value={draft.priority} onChange={event => setDraft({ ...draft, priority: event.target.value as TodoPriority })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{priorities.map(item => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select><input type="date" value={draft.dueDate || ''} onChange={event => setDraft({ ...draft, dueDate: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div>
          <input value={draft.tags.join(', ')} onChange={event => setDraft({ ...draft, tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} placeholder="Tags, separated by commas" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModal('closed')} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{editing ? 'Save changes' : 'Create task'}</button></div>
        </form>
      </div>}
    </div>
  );
};
