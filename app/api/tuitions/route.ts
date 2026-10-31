import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';
import { tuitionCreateSchema } from '@/server/validations';

export async function GET() {
  try {
    return NextResponse.json({ data: await db.getTuitions() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tuitions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = tuitionCreateSchema.parse(await request.json());
    return NextResponse.json({ success: true, data: await db.createTuition(body.name, body.targetDaysPerMonth) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.errors?.[0]?.message || error.message || 'Failed to create tuition' }, { status: 400 });
  }
}
