import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { initializePayment, makeReference, hasPaystackKeys } from '@/lib/paystack';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { email } = await req.json();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required to receive your purchase' }, { status: 400 });
    }
    const { rows } = await pool.query(
      `SELECT id, title, price, status, delivery_type, file_id, link FROM marketplace_listings WHERE id=$1 AND status='active' LIMIT 1`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'This listing is no longer available.' }, { status: 404 });
    const listing = rows[0];
    const amount = Number(listing.price);
    if (!(amount > 0)) return NextResponse.json({ error: 'This listing is not for sale.' }, { status: 400 });

    const ref = makeReference('listing');
    await pool.query(
      `INSERT INTO marketplace_purchases (listing_id, email, amount, paystack_ref, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [id, email, amount, ref]
    );

    if (!hasPaystackKeys()) {
      await pool.query(`UPDATE marketplace_purchases SET status='completed' WHERE paystack_ref=$1`, [ref]);
      return NextResponse.json({ url: `/thanks?ref=${ref}&type=listing` });
    }

    const settings = await getSettings();
    const base = (process.env.SITE_URL || settings.contact_email || 'http://localhost:3000').replace(/\/$/, '');
    const url = await initializePayment({
      email,
      amountKobo: Math.round(amount * 100),
      reference: ref,
      metadata: { 
        type: 'listing', 
        id: Number(id),
        delivery_type: listing.delivery_type,
        file_id: listing.file_id,
        link: listing.link
      },
      callbackUrl: `${base}/thanks?ref=${ref}&type=listing`
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error('marketplace/buy', e);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
