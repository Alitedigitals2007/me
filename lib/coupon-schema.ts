import getPool from './db';
import { ensureAcademySchema } from './academy-schema';

export const COUPON_DDL = `
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'all',
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  listing_id INT REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  max_uses_per_customer INT NOT NULL DEFAULT 0,
  min_order NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percent';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applies_to TEXT NOT NULL DEFAULT 'all';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS course_id INT REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS listing_id INT REFERENCES marketplace_listings(id) ON DELETE CASCADE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_uses INT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INT NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_uses_per_customer INT NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_key ON coupons (code);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id SERIAL PRIMARY KEY,
  coupon_id INT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  context TEXT NOT NULL,
  course_id INT,
  listing_id INT,
  student_id INT,
  email TEXT NOT NULL DEFAULT '',
  amount_before NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_after NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_idx ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_ref_idx ON coupon_redemptions (payment_ref);
CREATE INDEX IF NOT EXISTS coupon_redemptions_student_idx ON coupon_redemptions (student_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_email_idx ON coupon_redemptions (LOWER(email));

ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS coupon_code TEXT NOT NULL DEFAULT '';
`;

let ensured = false;

async function schemaReady(): Promise<boolean> {
  try {
    const { rows } = await getPool().query(
      `SELECT to_regclass('public.coupons') IS NOT NULL AS coupons,
              to_regclass('public.coupon_redemptions') IS NOT NULL AS redemptions`
    );
    if (!rows[0]?.coupons || !rows[0]?.redemptions) return false;
    await getPool().query(
      `SELECT code, description, discount_type, discount_value, max_discount, applies_to, course_id,
              listing_id, starts_at, expires_at, max_uses, used_count, max_uses_per_customer,
              min_order, is_active FROM coupons LIMIT 0`
    );
    await getPool().query('SELECT original_amount, discount_amount, coupon_code FROM marketplace_purchases LIMIT 0');
    return true;
  } catch {
    return false;
  }
}

export async function ensureCouponSchema(): Promise<void> {
  if (ensured) return;
  try {
    await ensureAcademySchema();
    const statements = COUPON_DDL.split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${s};`);
    for (const stmt of statements) {
      try {
        await getPool().query(stmt);
      } catch (e) {
        console.error('coupon ddl statement failed:', (e as Error).message, '->', stmt.slice(0, 80));
      }
    }
    ensured = await schemaReady();
  } catch (e) {
    console.error('coupon schema', e);
  }
}
