import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { initDatabase } from '@/server/db/store';
import { loginUser } from '@/server/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    const body = schema.parse(await request.json());
    const user = await loginUser(body.email, body.password);
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 401 });
  }
}
