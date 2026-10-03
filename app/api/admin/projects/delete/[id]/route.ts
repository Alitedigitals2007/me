import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await getPool().query('DELETE FROM projects WHERE id=$1', [(await params).id]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
