import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { ensureCouponSchema } from '@/lib/coupon-schema';
import { couponTargetError, parseCouponPayload } from '@/lib/coupons';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await ensureCouponSchema();
    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseCouponPayload(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const targetError = await couponTargetError(parsed.value);
    if (targetError) return NextResponse.json({ error: targetError }, { status: 400 });

    const c = parsed.value;
    const { rows } = await getPool().query(
      `INSERT INTO coupons
        (code, description, discount_type, discount_value, max_discount, applies_to,
         course_id, listing_id, starts_at, expires_at, max_uses, max_uses_per_customer,
         min_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        c.code,
        c.description,
        c.discount_type,
        c.discount_value,
        c.max_discount,
        c.applies_to,
        c.course_id,
        c.listing_id,
        c.starts_at,
        c.expires_at,
        c.max_uses,
        c.max_uses_per_customer,
        c.min_order,
        c.is_active
      ]
    );
    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (e) {
    console.error('create coupon', e);
    if ((e as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not create coupon.' }, { status: 500 });
  }
}
