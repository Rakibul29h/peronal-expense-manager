import { NextRequest, NextResponse } from 'next/server';
import { getMongoStatus, initDatabase } from '@/server/db/store';

export async function GET(_request: NextRequest) {
  await initDatabase();
  return NextResponse.json({
    data: getMongoStatus(),
  });
}
