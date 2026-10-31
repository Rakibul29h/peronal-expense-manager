import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';
import { incomeCreateSchema } from '@/server/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let list = await db.getIncomes();

    if (month) {
      list = list.filter(i => i.date.startsWith(month));
    }
    if (category && category !== 'all') {
      list = list.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        i =>
          i.title.toLowerCase().includes(q) ||
          (i.source && i.source.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      data: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch income' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = incomeCreateSchema.parse(body);
    const created = await db.createIncome(validated);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create income' }, { status: 500 });
  }
}
