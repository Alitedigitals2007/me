import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { slugify, parseGallery } from '@/lib/utils';

export const runtime = 'nodejs';

// Legacy DBs created gallery_images as a native array column (text[], varchar[], ...);
// fresh schema uses TEXT (JSON). Detect once, and self-heal on format mismatch.
let galleryColIsArray: boolean | null = null;
async function galleryColumnIsArray(): Promise<boolean> {
  if (galleryColIsArray !== null) return galleryColIsArray;
  try {
    const colRes = await pool.query(
      `SELECT data_type, udt_name FROM information_schema.columns WHERE table_name='projects' AND column_name='gallery_images'`
    );
    const row = colRes.rows[0];
    galleryColIsArray = row?.data_type === 'ARRAY' || String(row?.udt_name || '').startsWith('_');
  } catch {
    galleryColIsArray = false;
  }
  return galleryColIsArray;
}

function toPgArrayLiteral(urls: string[]): string {
  const escaped = urls.map((u) => '"' + u.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
  return '{' + escaped.join(',') + '}';
}

/** Runs the query with gallery_images in the detected format; on a malformed-array error, flips format and retries once */
async function execWithGallery(
  sql: string,
  baseParams: (string | boolean | number | null)[],
  galleryIdx: number,
  galleryJson: string,
  galleryPgArray: string
) {
  const isArray = await galleryColumnIsArray();
  const params = [...baseParams];
  params[galleryIdx] = isArray ? galleryPgArray : galleryJson;
  try {
    return await pool.query(sql, params);
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === '22P02') {
      galleryColIsArray = !isArray;
      params[galleryIdx] = galleryColIsArray ? galleryPgArray : galleryJson;
      return await pool.query(sql, params);
    }
    throw e;
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const fd = await req.formData();
    const id = String(fd.get('id') || '');
    const title = String(fd.get('title') || '').trim();
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    const slugBase = slugify(String(fd.get('slug') || '') || title);
    const description = String(fd.get('description') || '').trim();
    const stack = String(fd.get('stack') || '').trim();
    const imageUrl = String(fd.get('image_url') || '').trim();
    const galleryUrls = parseGallery(fd.get('gallery_images'));
    const galleryJson = JSON.stringify(galleryUrls);
    const galleryPgArray = toPgArrayLiteral(galleryUrls);
    const liveUrl = String(fd.get('live_url') || '').trim();
    const repoUrl = String(fd.get('repo_url') || '').trim();
    const featured = fd.get('featured') === 'on' || fd.get('featured') === 'true';
    const orderIndex = parseInt(String(fd.get('order_index') || '0'), 10) || 0;

    let slug = slugBase;
    if (id) {
      const { rows: dupe } = await pool.query('SELECT id FROM projects WHERE slug=$1 AND id<>$2 LIMIT 1', [slug, id]);
      if (dupe.length) slug = `${slugBase}-${id}`;
      await execWithGallery(
        `UPDATE projects SET title=$1, slug=$2, description=$3, stack=$4,
         image_url=COALESCE(NULLIF($5,''), image_url), gallery_images=$6, live_url=$7, repo_url=$8, featured=$9, order_index=$10
         WHERE id=$11`,
        [title, slug, description, stack, imageUrl, '', liveUrl, repoUrl, featured, orderIndex, id],
        5,
        galleryJson,
        galleryPgArray
      );
    } else {
      const { rows: dupe } = await pool.query('SELECT id FROM projects WHERE slug=$1 LIMIT 1', [slug]);
      if (dupe.length) slug = `${slugBase}-${Date.now().toString(36)}`;
      await execWithGallery(
        `INSERT INTO projects (title, slug, description, stack, image_url, gallery_images, live_url, repo_url, featured, order_index)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [title, slug, description, stack, imageUrl, '', liveUrl, repoUrl, featured, orderIndex],
        5,
        galleryJson,
        galleryPgArray
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin project', e);
    const err = e as { code?: string; message?: string };
    let msg = 'Save failed';
    if (err.code === '23505') msg = 'A project with this title/slug already exists';
    else if (err.code === '23502') msg = `Required field missing in database: ${(err.message || '').match(/column "([^"]+)"/)?.[1] ?? 'unknown'}`;
    else if (err.code === '42703') msg = 'Database column missing — run npm run seed to update the schema';
    return NextResponse.json({ error: msg, detail: (err.message || String(e)).slice(0, 300) }, { status: 500 });
  }
}
