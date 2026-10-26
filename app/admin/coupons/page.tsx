import AdminHeader from '@/components/admin/AdminHeader';
import CouponManager from '@/components/admin/CouponManager';
import getPool from '@/lib/db';
import { ensureCouponSchema } from '@/lib/coupon-schema';

export const metadata = { title: 'Coupons' };
export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  await ensureCouponSchema();
  const [{ rows: coupons }, { rows: courses }, { rows: listings }] = await Promise.all([
    getPool().query('SELECT * FROM coupons ORDER BY created_at DESC'),
    getPool().query('SELECT id, title FROM courses ORDER BY title ASC'),
    getPool().query("SELECT id, title FROM marketplace_listings WHERE status='active' ORDER BY title ASC")
  ]);

  const serialized = coupons.map((c) => ({
    ...c,
    discount_value: Number(c.discount_value) || 0,
    max_discount: Number(c.max_discount) || 0,
    min_order: Number(c.min_order) || 0,
    used_count: Number(c.used_count) || 0,
    max_uses: c.max_uses === null ? null : Number(c.max_uses),
    max_uses_per_customer: Number(c.max_uses_per_customer) || 0,
    starts_at: c.starts_at ? new Date(c.starts_at).toISOString() : null,
    expires_at: c.expires_at ? new Date(c.expires_at).toISOString() : null,
    created_at: c.created_at ? new Date(c.created_at).toISOString() : ''
  }));

  return (
    <div>
      <AdminHeader
        title="Coupons"
        sub="Discount codes for products and courses, with expiry windows and usage limits."
      />
      <CouponManager
        coupons={serialized}
        courses={courses.map((c) => ({ id: Number(c.id), title: String(c.title) }))}
        listings={listings.map((l) => ({ id: Number(l.id), title: String(l.title) }))}
      />
    </div>
  );
}
