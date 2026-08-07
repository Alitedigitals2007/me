import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const ACTIONS: Record<string, { sql: string; telegram?: (row: { title: string; owner_name?: string }) => string }> = {
  approve: {
    sql: "UPDATE marketplace_listings SET status='active' WHERE id=$1 AND status IN ('pending','rejected') RETURNING title, owner_name",
    telegram: (r) => `✅ Listing approved: <b>${r.title}</b> by ${r.owner_name || 'you'}\n🔗 ${siteUrl()}/admin/marketplace`
  },
  reject: {
    sql: "UPDATE marketplace_listings SET status='rejected' WHERE id=$1 RETURNING title",
    telegram: (r) => `⛔ Listing rejected: <b>${r.title}</b>\n🔗 ${siteUrl()}/admin/marketplace`
  },
  sold: {
    sql: "UPDATE marketplace_listings SET status='sold' WHERE id=$1 RETURNING title",
    telegram: (r) => `🏷 Listing marked sold: <b>${r.title}</b>\n🔗 ${siteUrl()}/admin/marketplace`
  },
  delete: { sql: 'DELETE FROM marketplace_listings WHERE id=$1' }
};

export async function POST(_req: NextRequest, { params }: { params: Promise<{ action: string; id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { action, id } = await params;
  const fn = ACTIONS[action];
  if (!fn) return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  try {
    const { rows } = await pool.query(fn.sql, [id]);
    if (fn.telegram && rows.length) sendTelegram(fn.telegram(rows[0]));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin listings action', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
