import { NextResponse } from 'next/server';
import { getWriter } from '@/lib/writer-session';

export const runtime = 'nodejs';

export async function GET() {
  const writer = await getWriter();
  return NextResponse.json({ writer: writer ? { id: writer.id, name: writer.name, email: writer.email } : null });
}