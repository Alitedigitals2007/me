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
    const mediums = String(fd.get('mediums') || '').trim();
    const dailyRate = Number(fd.get('daily_rate') || 0);
    const bundle3Rate = Number(fd.get('bundle_3_rate') || 0);
    const description = String(fd.get('description') || '').trim();
    if (!name || !mediums || !dailyRate || !bundle3Rate) {
      return NextResponse.json({ error: 'Name, mediums and rates are required' }, { status: 400 });
    }
    await pool.query(
      `INSERT INTO ad_packages (name, mediums, daily_rate, bundle_3_rate, description)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (name) DO UPDATE SET mediums=$2, daily_rate=$3, bundle_3_rate=$4, description=$5`,
      [name, mediums, dailyRate, bundle3Rate, description]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin packages', e);
    const err = e as { code?: string; message?: string };
    let msg = 'Save failed';
    if (err.code === '42703') msg = 'Database column missing — run npm run seed to update the schema';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
