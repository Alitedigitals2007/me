import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { getAdmin } from '@/lib/admin-auth';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const fd = await req.formData();
    const id = String(fd.get('id') || '');
    const title = String(fd.get('title') || '').trim();
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    const slugBase = slugify(String(fd.get('slug') || '') || title);
    const excerpt = String(fd.get('excerpt') || '').trim();
    const content = String(fd.get('content') || '').trim();
    const coverImage = String(fd.get('cover_image') || '').trim();
    const tags = String(fd.get('tags') || '').trim();
    const status = ['draft', 'published', 'scheduled'].includes(String(fd.get('status'))) ? String(fd.get('status')) : 'draft';
    const publishAt = fd.get('publish_at') ? new Date(String(fd.get('publish_at'))).toISOString() : null;

    let slug = slugBase;
    if (id) {
      const { rows: dupe } = await pool.query('SELECT id FROM blog_posts WHERE slug=$1 AND id<>$2 LIMIT 1', [slug, id]);
      if (dupe.length) slug = `${slugBase}-${id}`;
      const { rows } = await pool.query(
        `UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, content=$4,
         cover_image=COALESCE(NULLIF($5,''), cover_image), tags=$6, status=$7, publish_at=$8, updated_at=now()
         WHERE id=$9 RETURNING title, status`,
        [title, slug, excerpt, content, coverImage, tags, status, publishAt, id]
      );
      if (!rows.length) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      if (rows[0].status === 'published') sendTelegram(`📝 Blog post published: <b>${rows[0].title}</b>\n🔗 ${siteUrl()}/blog/${slug}`);
    } else {
      const { rows: dupe } = await pool.query('SELECT id FROM blog_posts WHERE slug=$1 LIMIT 1', [slug]);
      if (dupe.length) slug = `${slugBase}-${Date.now().toString(36)}`;
      await pool.query(
        `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, tags, status, publish_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [title, slug, excerpt, content, coverImage, tags, status, publishAt]
      );
      if (status === 'published') sendTelegram(`📝 New blog post published: <b>${title}</b>\n🔗 ${siteUrl()}/blog/${slug}`);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin post', e);
    const err = e as { code?: string; message?: string };
    let msg = 'Save failed';
    if (err.code === '23505') msg = 'A post with this title/slug already exists';
    else if (err.code === '23502') msg = `Required field missing in database: ${(err.message || '').match(/column "([^"]+)"/)?.[1] ?? 'unknown'}`;
    else if (err.code === '42703') msg = 'Database column missing — run npm run seed to update the schema';
    return NextResponse.json({ error: msg, detail: (err.message || String(e)).slice(0, 300) }, { status: 500 });
  }
}
