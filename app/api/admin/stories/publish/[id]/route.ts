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

    if (story.status === 'published') {
      return NextResponse.json({ ok: true, message: 'Already published' });
    }

    await getPool().query(
      `UPDATE stories SET status='published', published_at=COALESCE(published_at, now()), updated_at=now() WHERE id=$1`,
      [id]
    );

    await getPool().query(
      `INSERT INTO story_activity (story_id, writer_id, action, meta) VALUES ($1, $2, $3, $4)`,
      [id, story.writer_id, 'approved', JSON.stringify({ title: story.title, slug: story.slug })]
    );

    sendTelegram(`📖 <b>Story published (admin)</b> — ${story.title} by writer #${story.writer_id}\n🔗 ${siteUrl()}/stories/${story.slug}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin story publish', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}