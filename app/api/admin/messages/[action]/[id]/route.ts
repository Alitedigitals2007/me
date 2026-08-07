import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const ACTIONS: Record<string, string> = {
  read: 'UPDATE contact_messages SET is_read=true WHERE id=$1',
  delete: 'DELETE FROM contact_messages WHERE id=$1'
};

export async function POST(_req: NextRequest, { params }: { params: Promise<{ action: string; id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { action, id } = await params;
  const sql = ACTIONS[action];
  if (!sql) return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  try {
    await pool.query(sql, [id]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
