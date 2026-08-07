import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { rows } = await pool.query('SELECT * FROM social_accounts ORDER BY order_index ASC, id ASC');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const fd = await req.formData();
    const platform = String(fd.get('platform') || '').trim();
    const url = String(fd.get('url') || '').trim();
    if (!platform || !url) {
      return NextResponse.json({ error: 'Platform and URL are required' }, { status: 400 });
    }
    const { rows } = await pool.query(
      'INSERT INTO social_accounts (platform, url, order_index) VALUES ($1,$2, COALESCE((SELECT MAX(order_index)+1 FROM social_accounts),0)) RETURNING id',
      [platform, url]
    );
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (e) {
    console.error('admin socials', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
