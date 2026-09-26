import { NextResponse } from 'next/server';
import { destroyStudentSession } from '@/lib/student-session';

export const runtime = 'nodejs';

export async function POST() {
  await destroyStudentSession();
  return NextResponse.json({ ok: true });
}
