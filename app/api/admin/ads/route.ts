import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const STATUSES = ['pending_payment', 'paid', 'approved', 'rejected', 'expired'];

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const fd = await req.formData();
    const advertiserName = String(fd.get('advertiser_name') || '').trim();
    const contact = String(fd.get('contact') || '').trim();
    const imageUrl = String(fd.get('image_url') || '').trim();
    const targetUrl = String(fd.get('target_url') || '').trim();
    const slotIdRaw = String(fd.get('slot_id') || '').trim();
    const packageIdRaw = String(fd.get('package_id') || '').trim();
    const durationDays = Math.min(Math.max(parseInt(String(fd.get('duration_days') || '7'), 10) || 7, 1), 365);
    const startDate = String(fd.get('start_date') || '').trim();
    const amountPaid = Number(fd.get('amount_paid') || 0);
    const paystackRef = String(fd.get('paystack_ref') || '').trim();
    const status = STATUSES.includes(String(fd.get('status'))) ? String(fd.get('status')) : 'approved';

    if (!advertiserName || !contact || !imageUrl || !targetUrl) {
      return NextResponse.json(
        { error: 'Advertiser, contact, ad image and target URL are required' },
        { status: 400 }
      );
    }
    try {
      const parsed = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
    } catch {
      return NextResponse.json({ error: 'Target URL must start with http:// or https://' }, { status: 400 });
    }

    let slotId: number | null = null;
    if (slotIdRaw) {
      const { rows } = await getPool().query('SELECT id FROM ad_slots WHERE id=$1', [slotIdRaw]);
      if (!rows.length) return NextResponse.json({ error: 'Invalid website placement' }, { status: 400 });
      slotId = rows[0].id;
    }

    let packageId: number | null = null;
    let mediums = String(fd.get('mediums') || '').trim();
    if (packageIdRaw) {
      const { rows } = await getPool().query('SELECT id, mediums FROM ad_packages WHERE id=$1', [packageIdRaw]);
      if (!rows.length) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      packageId = rows[0].id;
      mediums = rows[0].mediums;
    }
    if (!mediums) mediums = slotId ? 'website' : '';

    const start = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date();
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + durationDays);

    const { rows } = await getPool().query(
      `INSERT INTO ad_submissions
         (slot_id, package_id, mediums, advertiser_name, contact, image_url, target_url,
          duration_days, start_date, end_date, amount_paid, paystack_ref, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        slotId,
        packageId,
        mediums,
        advertiserName,
        contact,
        imageUrl,
        targetUrl,
        durationDays,
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
        Number.isFinite(amountPaid) ? amountPaid : 0,
        paystackRef,
        status
      ]
    );

    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (e) {
    console.error('admin ad create', e);
    const err = e as { code?: string };
    const msg =
      err.code === '42703'
        ? 'Database column missing — run npm run seed to update the schema'
        : 'Save failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
