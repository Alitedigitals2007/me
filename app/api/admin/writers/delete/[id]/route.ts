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
      `DELETE FROM writer_users WHERE id=$1 RETURNING name, email`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Writer not found' }, { status: 404 });

    sendTelegram(`🗑️ <b>Writer deleted</b> — ${rows[0].name} (${rows[0].email})`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin writer delete', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}