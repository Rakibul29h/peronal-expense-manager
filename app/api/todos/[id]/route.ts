import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth';
import { initDatabase } from '@/server/db/store';
import { TodoModel } from '@/server/models/Todo';
import { todoUpdateSchema } from '@/server/validations';

const serialize = (todo: any) => ({
  id: todo._id.toString(),
  title: todo.title,
  description: todo.description || '',
  status: todo.status,
  priority: todo.priority,
  dueDate: todo.dueDate || '',
  tags: todo.tags || [],
  order: todo.order || 0,
  createdAt: todo.createdAt.toISOString(),
  updatedAt: todo.updatedAt.toISOString(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    if (!(await getCurrentUser())) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id } = await params;
    const validated = todoUpdateSchema.parse(await request.json());
    const todo = await TodoModel.findOneAndUpdate({ _id: id }, { ...validated, updatedAt: new Date() }, { new: true, runValidators: true }).lean();
    if (!todo) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: serialize(todo) });
  } catch (error: any) {
    const message = error?.issues?.[0]?.message || error.message || 'Failed to update task';
    return NextResponse.json({ error: message }, { status: error?.issues ? 400 : 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    if (!(await getCurrentUser())) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id } = await params;
    const deleted = await TodoModel.findOneAndDelete({ _id: id });
    if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}
