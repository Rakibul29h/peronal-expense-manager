import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';

export async function POST(_request: NextRequest) {
  try {
    await db.resetDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database reset and seeded with default clean schema.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset database' }, { status: 500 });
  }
}
