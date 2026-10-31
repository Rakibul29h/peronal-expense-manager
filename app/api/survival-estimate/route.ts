import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';
import { calculateCurrentBalance, calculateSurvivalEstimate } from '@/server/calculations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const [settings, expenses, incomes] = await Promise.all([
      db.getSettings(),
      db.getExpenses(),
      db.getIncomes(),
    ]);

    const days = parseInt(searchParams.get('days') || '30', 10) || settings.survivalWindowDays || 30;
    const { currentBalance } = calculateCurrentBalance(settings.openingBalance, incomes, expenses);
    const estimate = calculateSurvivalEstimate(
      currentBalance,
      expenses,
      days,
      settings.warningThresholdDays
    );

    return NextResponse.json({ data: estimate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to calculate survival estimate' }, { status: 500 });
  }
}
