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
    const { rows: existing } = await getPool().query('SELECT * FROM stories WHERE id=$1', [id]);
    if (!existing.length) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    const story = existing[0];

    if (story.status === 'draft') {
      return NextResponse.json({ ok: true, message: 'Already a draft' });
    }

    await getPool().query(
      `UPDATE stories SET status='draft', updated_at=now() WHERE id=$1`,
      [id]
    );

    await getPool().query(
      `INSERT INTO story_activity (story_id, writer_id, action, meta) VALUES ($1, $2, $3, $4)`,
      [id, story.writer_id, 'updated', JSON.stringify({ title: story.title, slug: story.slug })]
    );

    sendTelegram(`📝 <b>Story unpublished (admin)</b> — ${story.title} by writer #${story.writer_id} (now a draft)`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin story unpublish', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}