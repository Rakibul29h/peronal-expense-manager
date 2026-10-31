import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/store';
import { settingsUpdateSchema } from '@/server/validations';

export async function GET(_request: NextRequest) {
  try {
    const settings = await db.getSettings();
    return NextResponse.json({ data: settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = settingsUpdateSchema.parse(body);
    const updated = await db.updateSettings(validated as any);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
