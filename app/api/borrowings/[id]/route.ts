import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';
import { borrowingUpdateSchema } from '@/server/validations';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await db.updateBorrowing(id, borrowingUpdateSchema.parse(await request.json()));
    if (!data) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.errors?.[0]?.message || error.message || 'Failed to update record' }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deleted = await db.deleteBorrowing((await params).id);
  if (!deleted) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
