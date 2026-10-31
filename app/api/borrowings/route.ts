import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { db } from '@/server/db/store';
import { borrowingCreateSchema } from '@/server/validations';

export async function GET(request: NextRequest) {
  try {
    const month = new URL(request.url).searchParams.get('month');
    let data = await db.getBorrowings();
    if (month) data = data.filter(record => record.date.startsWith(month));
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch debt and credit records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = borrowingCreateSchema.parse(body);
    const created = await db.createBorrowing({
      ...validated,
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to save debt or credit record' }, { status: 500 });
  }
}
