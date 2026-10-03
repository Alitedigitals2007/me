import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { sendTelegram, siteUrl } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const { rows } = await getPool().query(
      `UPDATE writer_users SET status='approved', approved_at=now(), approved_by=$1 WHERE id=$2 AND status='pending' RETURNING name, email`,
      [admin.id, id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Writer not found or already handled' }, { status: 404 });

    sendTelegram(`✅ <b>Writer approved</b> — ${rows[0].name} (${rows[0].email})\n🔗 ${siteUrl()}/admin/writers`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin writer approve', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}