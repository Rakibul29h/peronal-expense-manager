import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';

export async function POST(_request: NextRequest) {
  try {
    await db.clearAllData();
    return NextResponse.json({
      success: true,
      message: 'All demo expenses and income have been cleared successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to clear data' }, { status: 500 });
  }
}
