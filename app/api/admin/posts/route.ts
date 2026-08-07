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
    const slug = slugify(String(fd.get('slug') || '') || title);
    const excerpt = String(fd.get('excerpt') || '').trim();
    const content = String(fd.get('content') || '').trim();
    const coverImage = String(fd.get('cover_image') || '').trim();
    const tags = String(fd.get('tags') || '').trim();
    const status = ['draft', 'published', 'scheduled'].includes(String(fd.get('status'))) ? String(fd.get('status')) : 'draft';
    const publishAt = fd.get('publish_at') ? new Date(String(fd.get('publish_at'))).toISOString() : null;

    if (id) {
      const { rows } = await pool.query(
        `UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, content=$4,
         cover_image=COALESCE(NULLIF($5,''), cover_image), tags=$6, status=$7, publish_at=$8, updated_at=now()
         WHERE id=$9 RETURNING title, status`,
        [title, slug, excerpt, content, coverImage, tags, status, publishAt, id]
      );
      if (rows.length && rows[0].status === 'published') sendTelegram(`📝 Blog post published: <b>${rows[0].title}</b>\n🔗 ${siteUrl()}/blog/${slug}`);
    } else {
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
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
