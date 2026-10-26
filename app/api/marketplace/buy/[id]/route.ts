import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { initializePayment, makeReference, hasPaystackKeys } from '@/lib/paystack';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { ensureCouponSchema } from '@/lib/coupon-schema';
import { completeCouponRedemption, releaseCouponReservation, reserveCoupon } from '@/lib/coupons';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`buy:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many checkout attempts. Try again later.' }, { status: 429 });
  }
  let reservationId: number | null = null;
  try {
    await ensureCouponSchema();
    const { id } = await params;
    const { email, coupon_code } = (await req.json()) as { email?: string; coupon_code?: string };
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required to receive your purchase' }, { status: 400 });
    }
    const { rows } = await getPool().query(
      `SELECT id, title, price, status, delivery_type, file_id, link FROM marketplace_listings WHERE id=$1 AND status='active' LIMIT 1`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'This listing is no longer available.' }, { status: 404 });
    const listing = rows[0];
    const originalAmount = Number(listing.price);
    if (!(originalAmount > 0)) return NextResponse.json({ error: 'This listing is not for sale.' }, { status: 400 });

    const ref = makeReference('listing');
    let amount = originalAmount;
    let discount = 0;
    let appliedCode = '';
    if (coupon_code && String(coupon_code).trim()) {
      const applied = await reserveCoupon({
        code: String(coupon_code),
        context: 'listing',
        itemId: Number(id),
        amount: originalAmount,
        paymentRef: ref,
        email
      });
      if (!applied.ok) return NextResponse.json({ error: applied.error }, { status: 400 });
      reservationId = applied.redemptionId;
      amount = applied.preview.total;
      discount = applied.preview.discount;
      appliedCode = applied.preview.code;
    }

    await getPool().query(
      `INSERT INTO marketplace_purchases
        (listing_id, email, amount, original_amount, discount_amount, coupon_code, paystack_ref, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
      [id, email, amount, originalAmount, discount, appliedCode, ref]
    );

    if (!hasPaystackKeys() || amount <= 0) {
      await getPool().query(`UPDATE marketplace_purchases SET status='completed' WHERE paystack_ref=$1`, [ref]);
      await completeCouponRedemption(ref);
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
        link: listing.link,
        coupon_code: appliedCode,
        original_amount: originalAmount,
        discount_amount: discount
      },
      callbackUrl: `${base}/thanks?ref=${ref}&type=listing`
    });
    return NextResponse.json({ url });
  } catch (e) {
    if (reservationId) await releaseCouponReservation(reservationId);
    console.error('marketplace/buy', e);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
