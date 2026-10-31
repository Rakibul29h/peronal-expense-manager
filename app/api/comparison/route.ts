import { NextRequest, NextResponse } from 'next/server';
import { format, subMonths } from 'date-fns';
import { db } from '@/server/db/store';
import { calculateMonthComparison } from '@/server/calculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultTo = format(now, 'yyyy-MM');
    const defaultFrom = format(subMonths(now, 1), 'yyyy-MM');

    const fromMonth = searchParams.get('from') || defaultFrom;
    const toMonth = searchParams.get('to') || defaultTo;

    const [expenses, incomes, categories] = await Promise.all([
      db.getExpenses(),
      db.getIncomes(),
      db.getCategories(),
    ]);

    const comparison = calculateMonthComparison(fromMonth, toMonth, expenses, incomes, categories);

    return NextResponse.json({ data: comparison });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch comparison data' }, { status: 500 });
  }
}
