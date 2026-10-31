import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth';
import { initDatabase } from '@/server/db/store';
import { TodoModel } from '@/server/models/Todo';
import { todoCreateSchema } from '@/server/validations';

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

export async function GET() {
  try {
    await initDatabase();
    if (!(await getCurrentUser())) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const todos = await TodoModel.find().sort({ status: 1, order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ data: todos.map(serialize) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    if (!(await getCurrentUser())) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const validated = todoCreateSchema.parse(await request.json());
    const last = await TodoModel.findOne({ status: validated.status }).sort({ order: -1 }).select('order').lean();
    const todo = await TodoModel.create({ ...validated, order: (last?.order ?? -1) + 1 });
    return NextResponse.json({ success: true, data: serialize(todo) }, { status: 201 });
  } catch (error: any) {
    const message = error?.issues?.[0]?.message || error.message || 'Failed to create task';
    return NextResponse.json({ error: message }, { status: error?.issues ? 400 : 500 });
  }
}
