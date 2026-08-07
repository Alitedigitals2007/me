import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const fd = await req.formData();
    const name = String(fd.get('name') || '').trim();
    const position = String(fd.get('position') || '').trim();
    const pricePerDay = Number(fd.get('price_per_day') || 0);
    const maxActive = parseInt(String(fd.get('max_active') || '1'), 10) || 1;
    const description = String(fd.get('description') || '').trim();
    if (!name || !position) return NextResponse.json({ error: 'Name and position are required' }, { status: 400 });
    await pool.query(
      `INSERT INTO ad_slots (name, position, price_per_day, max_active, description)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (position) DO UPDATE
       SET name=$1, price_per_day=$3, max_active=$4, description=$5`,
      [name, position, pricePerDay, maxActive, description]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin slot', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
