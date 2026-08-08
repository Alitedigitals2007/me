import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { sendTelegram, siteUrl } from '@/lib/telegram';

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
    const deliveryType = String(fd.get('delivery_type') || 'link');
    const fileId = String(fd.get('file_id') || '').trim();
    const ownerName = String(fd.get('owner_name') || '').trim();
    const ownerContact = String(fd.get('owner_contact') || '').trim();
    
    if (deliveryType === 'link' && !link) {
      return NextResponse.json({ error: 'Access link is required for link delivery type' }, { status: 400 });
    }
    if (deliveryType === 'file' && !fileId) {
      return NextResponse.json({ error: 'File upload is required for file delivery type' }, { status: 400 });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO marketplace_listings (title, description, price, image_url, category, link, delivery_type, file_id, is_own, owner_name, owner_contact, listing_fee, fee_paid, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,0,true,'active') RETURNING id, title`,
      [title, description, price, imageUrl, category, link, deliveryType, fileId || null, ownerName, ownerContact]
    );
    sendTelegram(
      `🛒 <b>New listing added:</b> ${title} (₦${Number(price).toLocaleString()})\n🔗 ${siteUrl()}/marketplace`
    );
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (e) {
    console.error('admin listing', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
