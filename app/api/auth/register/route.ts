import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { initDatabase } from '@/server/db/store';
import { registerUser } from '@/server/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    const body = schema.parse(await request.json());
    const user = await registerUser(body.email, body.password);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
  }
}
