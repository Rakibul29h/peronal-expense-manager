import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';
import { tuitionUpdateSchema } from '@/server/validations';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const update = tuitionUpdateSchema.parse(await request.json());
    const data = await db.updateTuition(id, update);
    if (!data) return NextResponse.json({ error: 'Tuition not found' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.errors?.[0]?.message || error.message || 'Failed to update tuition' }, { status: 400 });
  }

}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deleted = await db.deleteTuition((await params).id);
  if (!deleted) return NextResponse.json({ error: 'Tuition not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
