import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import { previewCoupon, type CouponContext } from '@/lib/coupons';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!rateLimit(`coupon:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many coupon attempts. Try again later.' }, { status: 429 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const context: CouponContext | null =
      body.context === 'course' ? 'course' : body.context === 'listing' ? 'listing' : null;
    if (!context) return NextResponse.json({ error: 'Choose a course or product first.' }, { status: 400 });

    const itemId = Number(body.item_id ?? (context === 'course' ? body.course_id : body.listing_id));
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json({ error: 'Invalid item.' }, { status: 400 });
    }

    let amount = 0;
    if (context === 'course') {
      const { rows } = await getPool().query(
        "SELECT price FROM courses WHERE id=$1 AND status='published'",
        [itemId]
      );
      if (!rows.length) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
      amount = Number(rows[0].price) || 0;
    } else {
      const { rows } = await getPool().query(
        "SELECT price FROM marketplace_listings WHERE id=$1 AND status='active'",
        [itemId]
      );
      if (!rows.length) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      amount = Number(rows[0].price) || 0;
    }
    if (!(amount > 0)) {
      return NextResponse.json({ error: 'This item is free — no coupon needed.' }, { status: 400 });
    }

    const student = context === 'course' ? await getStudent() : null;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const result = await previewCoupon({
      code: String(body.code || ''),
      context,
      itemId,
      amount,
      studentId: student?.id ?? null,
      email
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, ...result.preview });
  } catch (e) {
    console.error('validate coupon', e);
    return NextResponse.json({ error: 'Could not check this coupon right now.' }, { status: 500 });
  }
}
