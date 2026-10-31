import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth';
import { initDatabase } from '@/server/db/store';

export async function GET() {
  await initDatabase();
  return NextResponse.json({ user: await getCurrentUser() });
}
