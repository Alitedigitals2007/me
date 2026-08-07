import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const TABLES: Record<string, string[]> = {
  education: ['institution', 'program', 'start_date', 'end_date', 'description'],
  roles: ['title', 'org', 'start_date', 'end_date', 'description'],
  courses: ['title', 'description', 'link', 'price', 'is_own_product']
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { table } = await params;
  const fields = TABLES[table];
  if (!fields) return NextResponse.json({ error: 'unknown table' }, { status: 400 });
  try {
    const fd = await req.formData();
    const values: (string | boolean | number)[] = fields.map((f) =>
      f === 'is_own_product' ? (fd.get(f) === 'on' || fd.get(f) === 'true') : String(fd.get(f) || '').trim()
    );
    values.push(parseInt(String(fd.get('order_index') || '0'), 10) || 0);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(',');
    await pool.query(
      `INSERT INTO ${table} (${fields.join(',')}, order_index) VALUES (${placeholders}, $${fields.length + 1})`,
      values
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin content create', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
