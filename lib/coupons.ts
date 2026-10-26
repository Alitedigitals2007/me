import getPool from './db';
import { ensureCouponSchema } from './coupon-schema';

export type CouponContext = 'course' | 'listing';
export type CouponDiscountType = 'percent' | 'fixed';
export type CouponScope = 'all' | 'courses' | 'products';

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: CouponDiscountType;
  discount_value: string | number;
  max_discount: string | number;
  applies_to: CouponScope;
  course_id: number | null;
  listing_id: number | null;
  starts_at: string | Date | null;
  expires_at: string | Date | null;
  max_uses: number | null;
  used_count: number;
  max_uses_per_customer: number;
  min_order: string | number;
  is_active: boolean;
  created_at: string | Date;
}

export interface CouponPreview {
  coupon_id: number;
  code: string;
  description: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  original: number;
  discount: number;
  total: number;
}

export interface CouponPayload {
  code: string;
  description: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount: number;
  applies_to: CouponScope;
  course_id: number | null;
  listing_id: number | null;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  max_uses_per_customer: number;
  min_order: number;
  is_active: boolean;
}

type QueryFn = (text: string, values?: unknown[]) => Promise<{ rows: any[] }>;

export function normalizeCouponCode(raw: unknown): string {
  return String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

function roundMoney(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseOptionalDate(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function parseCouponPayload(
  body: Record<string, unknown>
): { ok: true; value: CouponPayload } | { ok: false; error: string } {
  const code = normalizeCouponCode(body.code);
  if (!/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(code)) {
    return { ok: false, error: 'Code must be 2–32 characters (letters, numbers, - or _).' };
  }

  const discountType = String(body.discount_type ?? 'percent');
  if (discountType !== 'percent' && discountType !== 'fixed') {
    return { ok: false, error: 'Discount type must be percent or fixed.' };
  }

  const discountValue = toNumber(body.discount_value);
  if (discountValue <= 0) return { ok: false, error: 'Discount value must be greater than 0.' };
  if (discountType === 'percent' && discountValue > 100) {
    return { ok: false, error: 'Percentage discount cannot be more than 100%.' };
  }

  const scope = String(body.applies_to ?? 'all');
  if (scope !== 'all' && scope !== 'courses' && scope !== 'products') {
    return { ok: false, error: 'Choose a valid coupon scope.' };
  }

  const optionalId = (value: unknown): number | null | undefined => {
    if (value === undefined || value === null || value === '') return null;
    const n = Math.floor(Number(value));
    if (!Number.isInteger(n) || n <= 0) return undefined;
    return n;
  };

  const courseId = optionalId(body.course_id);
  if (courseId === undefined) return { ok: false, error: 'Selected course is invalid.' };
  const listingId = optionalId(body.listing_id);
  if (listingId === undefined) return { ok: false, error: 'Selected product is invalid.' };
  if (courseId && listingId) return { ok: false, error: 'Choose either a course or a product, not both.' };
  if (courseId && scope === 'products') {
    return { ok: false, error: 'A products-only coupon cannot target a course.' };
  }
  if (listingId && scope === 'courses') {
    return { ok: false, error: 'A courses-only coupon cannot target a product.' };
  }

  const startsAt = parseOptionalDate(body.starts_at);
  if (startsAt === undefined) return { ok: false, error: 'Start date is invalid.' };
  const expiresAt = parseOptionalDate(body.expires_at);
  if (expiresAt === undefined) return { ok: false, error: 'Expiry date is invalid.' };
  if (startsAt && expiresAt && new Date(startsAt) > new Date(expiresAt)) {
    return { ok: false, error: 'Expiry date must be after the start date.' };
  }

  let maxUses: number | null = null;
  if (body.max_uses !== undefined && body.max_uses !== null && String(body.max_uses).trim() !== '') {
    const n = Math.floor(Number(body.max_uses));
    if (!Number.isInteger(n) || n < 1) return { ok: false, error: 'Total usage limit must be at least 1.' };
    maxUses = n;
  }

  const perCustomer = Math.floor(toNumber(body.max_uses_per_customer));
  if (perCustomer < 0) return { ok: false, error: 'Per-customer limit cannot be negative.' };

  const maxDiscount = toNumber(body.max_discount);
  if (maxDiscount < 0) return { ok: false, error: 'Maximum discount cannot be negative.' };
  const minOrder = toNumber(body.min_order);
  if (minOrder < 0) return { ok: false, error: 'Minimum order cannot be negative.' };

  return {
    ok: true,
    value: {
      code,
      description: String(body.description ?? '').trim().slice(0, 240),
      discount_type: discountType,
      discount_value: roundMoney(discountValue),
      max_discount: roundMoney(maxDiscount),
      applies_to: scope,
      course_id: courseId,
      listing_id: listingId,
      starts_at: startsAt,
      expires_at: expiresAt,
      max_uses: maxUses,
      max_uses_per_customer: perCustomer,
      min_order: roundMoney(minOrder),
      is_active: body.is_active === false || body.is_active === 'false' ? false : true
    }
  };
}

export async function couponTargetError(payload: CouponPayload): Promise<string | null> {
  if (payload.course_id) {
    const { rows } = await getPool().query('SELECT id FROM courses WHERE id=$1', [payload.course_id]);
    if (!rows.length) return 'Selected course was not found.';
  }
  if (payload.listing_id) {
    const { rows } = await getPool().query('SELECT id FROM marketplace_listings WHERE id=$1', [payload.listing_id]);
    if (!rows.length) return 'Selected product was not found.';
  }
  return null;
}

function windowError(coupon: Coupon): string | null {
  const now = Date.now();
  if (!coupon.is_active) return 'This coupon is not active.';
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return 'This coupon is not available yet.';
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) return 'This coupon has expired.';
  const maxUses = coupon.max_uses === null ? null : Number(coupon.max_uses);
  if (maxUses !== null && Number(coupon.used_count) >= maxUses) return 'This coupon has reached its usage limit.';
  return null;
}

function scopeError(coupon: Coupon, context: CouponContext, itemId: number, amount: number): string | null {
  if (coupon.course_id && (context !== 'course' || Number(coupon.course_id) !== itemId)) {
    return 'This coupon does not apply to this course.';
  }
  if (coupon.listing_id && (context !== 'listing' || Number(coupon.listing_id) !== itemId)) {
    return 'This coupon does not apply to this product.';
  }
  if (coupon.applies_to === 'courses' && context !== 'course') return 'This coupon is for courses only.';
  if (coupon.applies_to === 'products' && context !== 'listing') return 'This coupon is for products only.';
  const minOrder = Number(coupon.min_order) || 0;
  if (amount < minOrder) {
    return `This coupon needs a minimum purchase of ₦${minOrder.toLocaleString()}.`;
  }
  return null;
}

function validateCoupon(coupon: Coupon, context: CouponContext, itemId: number, amount: number): string | null {
  return windowError(coupon) ?? scopeError(coupon, context, itemId, amount);
}

async function perCustomerError(
  query: QueryFn,
  coupon: Coupon,
  context: CouponContext,
  studentId: number | null | undefined,
  email: string | null | undefined,
  includePending: boolean
): Promise<string | null> {
  const limit = Math.floor(Number(coupon.max_uses_per_customer) || 0);
  if (limit <= 0) return null;
  const statuses = includePending ? "('pending','completed')" : "('completed')";
  let result;
  if (context === 'course' && studentId) {
    result = await query(
      `SELECT COUNT(*)::int AS n FROM coupon_redemptions
       WHERE coupon_id=$1 AND context='course' AND student_id=$2 AND status IN ${statuses}`,
      [coupon.id, studentId]
    );
  } else if (context === 'listing' && email) {
    result = await query(
      `SELECT COUNT(*)::int AS n FROM coupon_redemptions
       WHERE coupon_id=$1 AND context='listing' AND LOWER(email)=LOWER($2) AND status IN ${statuses}`,
      [coupon.id, email]
    );
  } else {
    return null;
  }
  const used = Number(result.rows[0]?.n ?? 0);
  return used >= limit ? 'You have already used this coupon.' : null;
}

function computeDiscount(coupon: Coupon, amount: number): number {
  const value = Number(coupon.discount_value) || 0;
  let discount = coupon.discount_type === 'fixed' ? value : (amount * value) / 100;
  const cap = Number(coupon.max_discount) || 0;
  if (cap > 0) discount = Math.min(discount, cap);
  discount = Math.max(0, Math.min(discount, amount));
  return roundMoney(discount);
}

function buildPreview(coupon: Coupon, amount: number): CouponPreview {
  const discount = computeDiscount(coupon, amount);
  const original = roundMoney(amount);
  return {
    coupon_id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value) || 0,
    original,
    discount,
    total: roundMoney(original - discount)
  };
}

async function releaseSameBuyerPending(
  query: QueryFn,
  couponId: number,
  context: CouponContext,
  itemId: number,
  studentId: number | null | undefined,
  email: string | null | undefined
): Promise<number> {
  if (context === 'course' && studentId) {
    const { rows } = await query(
      `WITH released AS (
         UPDATE coupon_redemptions SET status='cancelled'
         WHERE coupon_id=$1 AND context='course' AND course_id=$2 AND student_id=$3 AND status='pending'
         RETURNING coupon_id
       )
       SELECT COUNT(*)::int AS n FROM released`,
      [couponId, itemId, studentId]
    );
    return Number(rows[0]?.n ?? 0);
  }
  if (context === 'listing' && email) {
    const { rows } = await query(
      `WITH released AS (
         UPDATE coupon_redemptions SET status='cancelled'
         WHERE coupon_id=$1 AND context='listing' AND listing_id=$2 AND LOWER(email)=LOWER($3) AND status='pending'
         RETURNING coupon_id
       )
       SELECT COUNT(*)::int AS n FROM released`,
      [couponId, itemId, email]
    );
    return Number(rows[0]?.n ?? 0);
  }
  return 0;
}

export async function previewCoupon(input: {
  code: string;
  context: CouponContext;
  itemId: number;
  amount: number;
  studentId?: number | null;
  email?: string | null;
}): Promise<{ ok: true; preview: CouponPreview } | { ok: false; error: string }> {
  await ensureCouponSchema();
  const code = normalizeCouponCode(input.code);
  if (!code) return { ok: false, error: 'Enter a coupon code.' };
  const { rows } = await getPool().query('SELECT * FROM coupons WHERE code=$1', [code]);
  const coupon = rows[0] as Coupon | undefined;
  if (!coupon) return { ok: false, error: 'Coupon code not found.' };
  const error = validateCoupon(coupon, input.context, input.itemId, input.amount);
  if (error) return { ok: false, error };
  const customerError = await perCustomerError(
    getPool().query.bind(getPool()),
    coupon,
    input.context,
    input.studentId,
    input.email,
    false
  );
  if (customerError) return { ok: false, error: customerError };
  return { ok: true, preview: buildPreview(coupon, input.amount) };
}

export async function reserveCoupon(input: {
  code: string;
  context: CouponContext;
  itemId: number;
  amount: number;
  paymentRef: string;
  studentId?: number | null;
  email?: string | null;
}): Promise<{ ok: true; preview: CouponPreview; redemptionId: number } | { ok: false; error: string }> {
  await ensureCouponSchema();
  const code = normalizeCouponCode(input.code);
  if (!code) return { ok: false, error: 'Enter a coupon code.' };

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM coupons WHERE code=$1 FOR UPDATE', [code]);
    const coupon = rows[0] as Coupon | undefined;
    if (!coupon) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Coupon code not found.' };
    }

    const released = await releaseSameBuyerPending(
      (text, values) => client.query(text, values),
      coupon.id,
      input.context,
      input.itemId,
      input.studentId,
      input.email
    );
    if (released > 0) {
      coupon.used_count = Math.max(0, Number(coupon.used_count) - released);
      await client.query('UPDATE coupons SET used_count = GREATEST(used_count - $2, 0) WHERE id=$1', [
        coupon.id,
        released
      ]);
    }

    const error =
      validateCoupon(coupon, input.context, input.itemId, input.amount) ??
      (await perCustomerError(
        (text, values) => client.query(text, values),
        coupon,
        input.context,
        input.studentId,
        input.email,
        true
      ));
    if (error) {
      await client.query('ROLLBACK');
      return { ok: false, error };
    }

    await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id=$1', [coupon.id]);
    const { rows: redemptionRows } = await client.query(
      `INSERT INTO coupon_redemptions
        (coupon_id, context, course_id, listing_id, student_id, email, amount_before,
         discount_amount, amount_after, payment_ref, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
       RETURNING id`,
      [
        coupon.id,
        input.context,
        input.context === 'course' ? input.itemId : null,
        input.context === 'listing' ? input.itemId : null,
        input.studentId ?? null,
        String(input.email ?? '').trim(),
        roundMoney(input.amount),
        computeDiscount(coupon, input.amount),
        buildPreview(coupon, input.amount).total,
        input.paymentRef
      ]
    );
    await client.query('COMMIT');
    return { ok: true, preview: buildPreview(coupon, input.amount), redemptionId: redemptionRows[0].id as number };
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.error('reserve coupon', e);
    return { ok: false, error: 'Could not apply this coupon. Please try again.' };
  } finally {
    client.release();
  }
}

export async function releaseCouponReservation(redemptionId: number): Promise<void> {
  try {
    await ensureCouponSchema();
    await getPool().query(
      `WITH released AS (
         UPDATE coupon_redemptions SET status='cancelled'
         WHERE id=$1 AND status='pending'
         RETURNING coupon_id
       ),
       counts AS (
         SELECT coupon_id, COUNT(*)::int AS n FROM released GROUP BY coupon_id
       )
       UPDATE coupons c SET used_count = GREATEST(c.used_count - counts.n, 0)
       FROM counts WHERE c.id=counts.coupon_id`,
      [redemptionId]
    );
  } catch (e) {
    console.error('release coupon reservation', e);
  }
}

export async function completeCouponRedemption(paymentRef: string): Promise<void> {
  if (!paymentRef) return;
  try {
    await ensureCouponSchema();
    await getPool().query(
      `UPDATE coupon_redemptions SET status='completed'
       WHERE payment_ref=$1 AND status='pending'`,
      [paymentRef]
    );
  } catch (e) {
    console.error('complete coupon redemption', e);
  }
}

export async function releaseExpiredCouponRedemptions(): Promise<void> {
  try {
    await ensureCouponSchema();
    await getPool().query(
      `WITH released AS (
         UPDATE coupon_redemptions SET status='cancelled'
         WHERE status='pending' AND created_at < now() - interval '90 minutes'
         RETURNING coupon_id
       ),
       counts AS (
         SELECT coupon_id, COUNT(*)::int AS n FROM released GROUP BY coupon_id
       )
       UPDATE coupons c SET used_count = GREATEST(c.used_count - counts.n, 0)
       FROM counts WHERE c.id=counts.coupon_id`
    );
  } catch (e) {
    console.error('release expired coupon redemptions', e);
  }
}
