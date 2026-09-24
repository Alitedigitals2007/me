import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { slugify, parseGallery } from '@/lib/utils';

export const runtime = 'nodejs';

interface ProjectsColumn {
  name: string;
  nullable: boolean;
  hasDefault: boolean;
  dataType: string;
  isarray: boolean;
}

// The live table may be a legacy layout (array-typed gallery_images, extra NOT NULL
// columns, missing columns). Read its real structure once and adapt queries to it.
let projectsColumns: ProjectsColumn[] | null = null;
async function getProjectsColumns(): Promise<ProjectsColumn[]> {
  if (projectsColumns) return projectsColumns;
  const res = await pool.query(
    `SELECT column_name, is_nullable, column_default, data_type, udt_name
     FROM information_schema.columns
     WHERE table_name = 'projects'`
  );
  projectsColumns = res.rows.map((r) => ({
    name: r.column_name,
    nullable: r.is_nullable === 'YES',
    hasDefault: r.column_default !== null,
    dataType: String(r.data_type || ''),
    isarray: r.data_type === 'ARRAY' || String(r.udt_name || '').startsWith('_')
  }));
  return projectsColumns;
}

function toPgArrayLiteral(urls: string[]): string {
  const escaped = urls.map((u) => '"' + u.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
  return '{' + escaped.join(',') + '}';
}

function safeDefaultFor(col: ProjectsColumn): string | boolean | number {
  if (col.dataType === 'boolean') return false;
  if (['integer', 'smallint', 'bigint', 'numeric', 'real', 'double precision'].includes(col.dataType)) return 0;
  if (col.isarray || col.dataType === 'ARRAY') return '{}';
  if (col.dataType.includes('timestamp') || col.dataType.includes('date')) return new Date().toISOString();
  return '';
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
    const liveUrl = String(fd.get('live_url') || '').trim();
    const repoUrl = String(fd.get('repo_url') || '').trim();
    const featured = fd.get('featured') === 'on' || fd.get('featured') === 'true';
    const orderIndex = parseInt(String(fd.get('order_index') || '0'), 10) || 0;
    const galleryUrls = parseGallery(fd.get('gallery_images'));

    const cols = await getProjectsColumns();
    const byName = new Map(cols.map((c) => [c.name, c]));

    let slug = slugBase;
    if (id) {
      const { rows: dupe } = await pool.query('SELECT id FROM projects WHERE slug=$1 AND id<>$2 LIMIT 1', [slug, id]);
      if (dupe.length) slug = `${slugBase}-${id}`;
    } else {
      const { rows: dupe } = await pool.query('SELECT id FROM projects WHERE slug=$1 LIMIT 1', [slug]);
      if (dupe.length) slug = `${slugBase}-${Date.now().toString(36)}`;
    }

    const values: Record<string, string | boolean | number> = {
      title,
      slug,
      description,
      stack,
      live_url: liveUrl,
      repo_url: repoUrl,
      featured,
      order_index: orderIndex
    };
    if (!id && !imageUrl) {
      // new project without image: let the column default apply
    } else {
      values.image_url = imageUrl;
    }
    const galleryCol = byName.get('gallery_images');
    if (galleryCol) {
      values.gallery_images = galleryCol.isarray ? toPgArrayLiteral(galleryUrls) : JSON.stringify(galleryUrls);
    }

    if (id) {
      const names = Object.keys(values).filter((n) => byName.has(n));
      const sets = names.map((n, i) => `${n}=$${i + 1}`).join(',');
      const params = names.map((n) => values[n]);
      params.push(id);
      const { rowCount } = await pool.query(`UPDATE projects SET ${sets} WHERE id=$${names.length + 1}`, params);
      if (!rowCount) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    } else {
      const names = Object.keys(values).filter((n) => byName.has(n));
      const fills: Record<string, string | boolean | number> = {};
      for (const c of cols) {
        if (names.includes(c.name) || c.nullable || c.hasDefault) continue;
        names.push(c.name);
        fills[c.name] = safeDefaultFor(c);
      }
      const placeholders = names.map((_, i) => `$${i + 1}`).join(',');
      const params = names.map((n) => (n in values ? values[n] : fills[n]));
      await pool.query(`INSERT INTO projects (${names.join(',')}) VALUES (${placeholders})`, params);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin project', e);
    const err = e as { code?: string; message?: string };
    let msg = 'Save failed';
    if (err.code === '23505') msg = 'A project with this title/slug already exists';
    else if (err.code === '23502') msg = `Required field missing in database: ${(err.message || '').match(/column "([^"]+)"/)?.[1] ?? 'unknown'}`;
    else if (err.code === '42703') msg = 'Database column missing';
    return NextResponse.json({ error: msg, detail: (err.message || String(e)).slice(0, 300) }, { status: 500 });
  }
}
