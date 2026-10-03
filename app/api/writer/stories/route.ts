import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const writer = await getWriter();
  if (!writer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const fd = await req.formData();
    const id = String(fd.get('id') || '');
    const title = String(fd.get('title') || '').trim();
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    const slugBase = slugify(String(fd.get('slug') || '') || title);
    const excerpt = String(fd.get('excerpt') || '').trim();
    const content = String(fd.get('content') || '').trim();
    const coverImage = String(fd.get('cover_image') || '').trim();
    const status = ['draft', 'published'].includes(String(fd.get('status'))) ? String(fd.get('status')) : 'draft';

    let slug = slugBase;
    let isNewPublish = false;

    if (id) {
      const { rows: existing } = await getPool().query('SELECT * FROM stories WHERE id=$1 AND writer_id=$2', [id, writer.id]);
      if (!existing.length) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      const oldStory = existing[0];
      isNewPublish = status === 'published' && oldStory.status !== 'published';

      const { rows: dupe } = await getPool().query('SELECT id FROM stories WHERE slug=$1 AND id<>$2 AND writer_id=$3 LIMIT 1', [slug, id, writer.id]);
      if (dupe.length) slug = `${slugBase}-${id}`;

      await getPool().query(
        `UPDATE stories SET title=$1, slug=$2, excerpt=$3, content=$4,
         cover_image=COALESCE(NULLIF($5,''), cover_image), status=$6, updated_at=now()
         WHERE id=$7 AND writer_id=$8`,
        [title, slug, excerpt, content, coverImage, status, id, writer.id]
      );

      await getPool().query(
        `INSERT INTO story_activity (story_id, writer_id, action, meta) VALUES ($1, $2, $3, $4)`,
        [id, writer.id, isNewPublish ? 'published' : 'updated', JSON.stringify({ title, slug })]
      );

      if (isNewPublish) {
        sendTelegram(`📖 <b>Story published</b> — ${title} by ${writer.name}\n🔗 ${siteUrl()}/stories/${slug}`);
      }
    } else {
      const { rows: dupe } = await getPool().query('SELECT id FROM stories WHERE slug=$1 LIMIT 1', [slug]);
      if (dupe.length) slug = `${slugBase}-${Date.now().toString(36)}`;

      const { rows } = await getPool().query(
        `INSERT INTO stories (writer_id, title, slug, excerpt, content, cover_image, status, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [writer.id, title, slug, excerpt, content, coverImage, status, status === 'published' ? new Date().toISOString() : null]
      );

      await getPool().query(
        `INSERT INTO story_activity (story_id, writer_id, action, meta) VALUES ($1, $2, $3, $4)`,
        [rows[0].id, writer.id, status === 'published' ? 'published' : 'created', JSON.stringify({ title, slug })]
      );

      if (status === 'published') {
        sendTelegram(`📖 <b>New story published</b> — ${title} by ${writer.name}\n🔗 ${siteUrl()}/stories/${slug}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('writer story save', e);
    const err = e as { code?: string; message?: string };
    let msg = 'Save failed';
    if (err.code === '23505') msg = 'A story with this title/slug already exists';
    else if (err.code === '23502') msg = `Required field missing: ${(err.message || '').match(/column "([^"]+)"/)?.[1] ?? 'unknown'}`;
    else if (err.code === '42703') msg = 'Database column missing — run migration';
    return NextResponse.json({ error: msg, detail: (err.message || String(e)).slice(0, 300) }, { status: 500 });
  }
}
