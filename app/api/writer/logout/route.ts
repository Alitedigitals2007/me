import { NextResponse } from 'next/server';
import { destroyWriterSession } from '@/lib/writer-session';

export const runtime = 'nodejs';

export async function POST() {
  await destroyWriterSession();
  return NextResponse.json({ ok: true });
}