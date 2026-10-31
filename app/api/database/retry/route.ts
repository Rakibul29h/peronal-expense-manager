import { NextRequest, NextResponse } from 'next/server';
import { tryConnectMongo, getMongoStatus } from '@/server/db/store';

export async function POST(_request: NextRequest) {
  const result = await tryConnectMongo();
  return NextResponse.json({
    ...result,
    status: getMongoStatus(),
  });
}
