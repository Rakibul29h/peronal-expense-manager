import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';
import { calculateCurrentBalance } from '@/server/calculations';

export async function GET(_request: NextRequest) {
  try {
    const [settings, expenses, incomes, borrowings] = await Promise.all([
      db.getSettings(),
      db.getExpenses(),
      db.getIncomes(),
      db.getBorrowings(),
    ]);

    const balanceData = calculateCurrentBalance(settings.openingBalance, incomes, expenses, borrowings);

    return NextResponse.json({
      openingBalance: settings.openingBalance,
      ...balanceData,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to calculate balance' }, { status: 500 });
  }
}
