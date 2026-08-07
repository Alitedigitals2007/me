import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const TABLES: Record<string, string[]> = {
  education: ['institution', 'program', 'start_date', 'end_date', 'description'],
  roles: ['title', 'org', 'start_date', 'end_date', 'description'],
  courses: ['title', 'description', 'link', 'price', 'is_own_product']
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string; action: string; id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { table, action, id } = await params;
  const fields = TABLES[table];
  if (!fields) return NextResponse.json({ error: 'unknown table' }, { status: 400 });
  try {
    if (action === 'delete') {
      await pool.query(`DELETE FROM ${table} WHERE id=$1`, [id]);
      return NextResponse.json({ ok: true });
    }
    if (action === 'edit') {
      const fd = await req.formData();
      const values: (string | boolean | number)[] = fields.map((f) =>
        f === 'is_own_product' ? (fd.get(f) === 'on' || fd.get(f) === 'true') : String(fd.get(f) || '').trim()
      );
      values.push(parseInt(String(fd.get('order_index') || '0'), 10) || 0, id);
      const sets = fields.map((f, i) => `${f}=$${i + 1}`).join(',');
      await pool.query(`UPDATE ${table} SET ${sets}, order_index=$${fields.length + 1} WHERE id=$${fields.length + 2}`, values);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (e) {
    console.error('admin content action', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
