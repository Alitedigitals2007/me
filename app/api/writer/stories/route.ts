import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';
import { ensureWriterSchema } from '@/lib/writer-schema';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { slugify, normalizeTags, readingMinutes } from '@/lib/utils';

export const runtime = 'nodejs';

function parsePublishAt(raw: unknown): string | null {
  const s = String(raw || '').trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function POST(req: NextRequest) {
  const writer = await getWriter();
  if (!writer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    await ensureWriterSchema();
    const fd = await req.formData();
    const id = String(fd.get('id') || '');
    const title = String(fd.get('title') || '').trim();
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    const slugBase = slugify(String(fd.get('slug') || '') || title);
    const excerpt = String(fd.get('excerpt') || '').trim();
    const content = String(fd.get('content') || '').trim();
    const coverImage = String(fd.get('cover_image') || '').trim();
    const category = String(fd.get('category') || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    const topic = String(fd.get('topic') || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    const tags = normalizeTags(String(fd.get('tags') || '')).join(', ');
    const status = ['draft', 'published', 'scheduled'].includes(String(fd.get('status'))) ? String(fd.get('status')) : 'draft';
    let publishAt = parsePublishAt(fd.get('publish_at'));
    // A scheduled story needs a future date; otherwise fall back to draft.
    if (status === 'scheduled' && (!publishAt || new Date(publishAt).getTime() <= Date.now())) {
      publishAt = publishAt || null;
    }
    const minutes = readingMinutes(content);

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
         cover_image=COALESCE(NULLIF($5,''), cover_image), category=$6, topic=$7, tags=$8, status=$9,
         publish_at=$10, reading_minutes=$11,
         published_at=CASE WHEN $9='published' AND published_at IS NULL THEN now() ELSE published_at END,
         updated_at=now()
         WHERE id=$12 AND writer_id=$13`,
        [title, slug, excerpt, content, coverImage, category, topic, tags, status, publishAt, minutes, id, writer.id]
      );

      await getPool().query(
        `INSERT INTO story_activity (story_id, writer_id, action, meta) VALUES ($1, $2, $3, $4)`,
        [id, writer.id, isNewPublish ? 'published' : status === 'scheduled' ? 'scheduled' : 'updated', JSON.stringify({ title, slug, category, topic, tags })]
      );

      if (isNewPublish) {
        sendTelegram(`📖 <b>Story published</b> — ${title} by ${writer.name}\n🔗 ${siteUrl()}/stories/${slug}`);
      } else if (status === 'scheduled') {
        sendTelegram(`⏰ <b>Story scheduled</b> — ${title} by ${writer.name}`);
      }
    } else {
      const { rows: dupe } = await getPool().query('SELECT id FROM stories WHERE slug=$1 LIMIT 1', [slug]);
      if (dupe.length) slug = `${slugBase}-${Date.now().toString(36)}`;

      const { rows } = await getPool().query(
        `INSERT INTO stories (writer_id, title, slug, excerpt, content, cover_image, category, topic, tags, status, publish_at, published_at, reading_minutes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [writer.id, title, slug, excerpt, content, coverImage, category, topic, tags, status, publishAt, status === 'published' ? new Date().toISOString() : null, minutes]
      );

      await getPool().query(
        `INSERT INTO story_activity (story_id, writer_id, action, meta) VALUES ($1, $2, $3, $4)`,
        [rows[0].id, writer.id, status === 'published' ? 'published' : status === 'scheduled' ? 'scheduled' : 'created', JSON.stringify({ title, slug, category, topic, tags })]
      );

      if (status === 'published') {
        sendTelegram(`📖 <b>New story published</b> — ${title} by ${writer.name}\n🔗 ${siteUrl()}/stories/${slug}`);
      } else if (status === 'scheduled') {
        sendTelegram(`⏰ <b>New story scheduled</b> — ${title} by ${writer.name}`);
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
