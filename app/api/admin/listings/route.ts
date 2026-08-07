import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const fd = await req.formData();
    const title = String(fd.get('title') || '').trim();
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    const description = String(fd.get('description') || '').trim();
    const price = Number(fd.get('price') || 0);
    const imageUrl = String(fd.get('image_url') || '').trim();
    const category = String(fd.get('category') || '').trim();
    const link = String(fd.get('link') || '').trim();
    const ownerName = String(fd.get('owner_name') || '').trim();
    const ownerContact = String(fd.get('owner_contact') || '').trim();
    await pool.query(
      `INSERT INTO marketplace_listings (title, description, price, image_url, category, link, is_own, owner_name, owner_contact, listing_fee, fee_paid, status)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8,0,true,'active')`,
      [title, description, price, imageUrl, category, link, ownerName, ownerContact]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin listing', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
