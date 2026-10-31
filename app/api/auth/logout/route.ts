import { NextResponse } from 'next/server';
import { logoutUser } from '@/server/auth';
import { initDatabase } from '@/server/db/store';

export async function POST() {
  await initDatabase();
  await logoutUser();
  return NextResponse.json({ success: true });
}
