import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendTelegram } from '@/lib/telegram';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const ACTIONS: Record<string, { sql: string; telegram?: (row: { advertiser_name: string; paystack_ref?: string }) => string }> = {
  approve: {
    sql: `UPDATE ad_submissions SET status='approved', start_date=CURRENT_DATE,
      end_date=CURRENT_DATE + (duration_days || ' days')::interval
      WHERE id=$1 AND status IN ('paid','pending_payment') RETURNING advertiser_name`,
    telegram: (row: { advertiser_name: string }) => `✅ Ad approved and live: <b>${row.advertiser_name}</b>`
  },
  reject: {
    sql: `UPDATE ad_submissions SET status='rejected' WHERE id=$1 AND status IN ('paid','pending_payment') RETURNING advertiser_name, paystack_ref`,
    telegram: (row: { advertiser_name: string; paystack_ref?: string }) =>
      `⛔ Ad rejected: <b>${row.advertiser_name}</b>${row.paystack_ref ? ` (ref ${row.paystack_ref}) — arrange refund` : ''}`
  },
  delete: {
    sql: `WITH del AS (DELETE FROM ad_clicks WHERE ad_id=$1 RETURNING 1) DELETE FROM ad_submissions WHERE id=$1`
  }
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
    console.error('admin ads action', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
