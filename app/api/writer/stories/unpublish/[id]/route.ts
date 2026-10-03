import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';
import { sendTelegram, siteUrl } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const writer = await getWriter();
  if (!writer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const { rows: existing } = await getPool().query('SELECT * FROM stories WHERE id=$1 AND writer_id=$2', [id, writer.id]);
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
      [id, writer.id, 'updated', JSON.stringify({ title: story.title, slug: story.slug })]
    );

    sendTelegram(`📝 <b>Story unpublished</b> — ${story.title} by ${writer.name} (now a draft)`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('writer story unpublish', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}