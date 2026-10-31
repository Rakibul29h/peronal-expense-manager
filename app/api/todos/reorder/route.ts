import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth';
import { initDatabase } from '@/server/db/store';
import { TodoModel } from '@/server/models/Todo';
import { todoReorderSchema } from '@/server/validations';

export async function PATCH(request: NextRequest) {
  try {
    await initDatabase();
    if (!(await getCurrentUser())) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { items } = todoReorderSchema.parse(await request.json());
    await Promise.all(items.map(item => TodoModel.findOneAndUpdate(
      { _id: item.id },
      { status: item.status, order: item.order, updatedAt: new Date() },
      { runValidators: true }
    )));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.issues?.[0]?.message || error.message || 'Failed to save task order';
    return NextResponse.json({ error: message }, { status: error?.issues ? 400 : 500 });
  }
}
