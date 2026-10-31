import { NextRequest, NextResponse } from 'next/server';
import { db, initDatabase } from '@/server/db/store';
import { categoryCreateSchema } from '@/server/validations';

export async function GET(_request: NextRequest) {
  try {
    await initDatabase();
    const categories = await db.getCategories();
    return NextResponse.json({ data: categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    const body = await request.json();
    const validated = categoryCreateSchema.parse(body);
    const created = await db.createCategory(validated);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
