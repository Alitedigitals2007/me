import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { ensureCouponSchema } from '@/lib/coupon-schema';
import { couponTargetError, parseCouponPayload } from '@/lib/coupons';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await ensureCouponSchema();
    const { id } = await params;
    const couponId = Number(id);
    if (!Number.isInteger(couponId) || couponId <= 0) {
      return NextResponse.json({ error: 'Invalid coupon.' }, { status: 400 });
    }

    const { rows: existingRows } = await getPool().query('SELECT * FROM coupons WHERE id=$1', [couponId]);
    if (!existingRows.length) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseCouponPayload({ ...existingRows[0], ...body });
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const targetError = await couponTargetError(parsed.value);
    if (targetError) return NextResponse.json({ error: targetError }, { status: 400 });

    const c = parsed.value;
    const { rows } = await getPool().query(
      `UPDATE coupons SET
         code=$1, description=$2, discount_type=$3, discount_value=$4, max_discount=$5,
         applies_to=$6, course_id=$7, listing_id=$8, starts_at=$9, expires_at=$10,
         max_uses=$11, max_uses_per_customer=$12, min_order=$13, is_active=$14
       WHERE id=$15
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
        c.is_active,
        couponId
      ]
    );
    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (e) {
    console.error('update coupon', e);
    if ((e as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not update coupon.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await ensureCouponSchema();
    const { id } = await params;
    const couponId = Number(id);
    if (!Number.isInteger(couponId) || couponId <= 0) {
      return NextResponse.json({ error: 'Invalid coupon.' }, { status: 400 });
    }
    const { rowCount } = await getPool().query(
      `DELETE FROM coupons c
       WHERE c.id=$1
         AND NOT EXISTS (SELECT 1 FROM coupon_redemptions r WHERE r.coupon_id=c.id)`,
      [couponId]
    );
    if (!rowCount) {
      const { rows } = await getPool().query('SELECT id FROM coupons WHERE id=$1', [couponId]);
      if (!rows.length) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
      return NextResponse.json(
        { error: 'This coupon has redemptions on record. Pause it instead of deleting.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('delete coupon', e);
    return NextResponse.json({ error: 'Could not delete coupon.' }, { status: 500 });
  }
}
