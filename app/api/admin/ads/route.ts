import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { ensureAdsSchema } from '@/lib/ads-schema';

export const runtime = 'nodejs';

const STATUSES = ['pending_payment', 'paid', 'approved', 'rejected', 'expired'];

type AdInput = {
  advertiserName: string;
  contact: string;
  imageUrl: string;
  targetUrl: string;
  caption: string;
  slotId: number | null;
  packageId: number | null;
  mediums: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  amountPaid: number;
  paystackRef: string;
  status: string;
};

async function parseAdInput(fd: FormData): Promise<{ ok: true; data: AdInput } | { ok: false; error: string }> {
  const advertiserName = String(fd.get('advertiser_name') || '').trim();
  const contact = String(fd.get('contact') || '').trim();
  const imageUrl = String(fd.get('image_url') || '').trim();
  const targetUrl = String(fd.get('target_url') || '').trim();
  const caption = String(fd.get('caption') || '').trim().slice(0, 200);
  const slotIdRaw = String(fd.get('slot_id') || '').trim();
  const packageIdRaw = String(fd.get('package_id') || '').trim();
  const durationDays = Math.min(Math.max(parseInt(String(fd.get('duration_days') || '7'), 10) || 7, 1), 365);
  const startDate = String(fd.get('start_date') || '').trim();
  const amountPaid = Number(fd.get('amount_paid') || 0);
  const paystackRef = String(fd.get('paystack_ref') || '').trim();
  const status = STATUSES.includes(String(fd.get('status'))) ? String(fd.get('status')) : 'approved';

  if (!advertiserName || !contact || !imageUrl || !targetUrl) {
    return { ok: false, error: 'Advertiser, contact, ad image and target URL are required' };
  }
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
  } catch {
    return { ok: false, error: 'Target URL must start with http:// or https://' };
  }

  let slotId: number | null = null;
  if (slotIdRaw) {
    const { rows } = await getPool().query('SELECT id FROM ad_slots WHERE id=$1', [slotIdRaw]);
    if (!rows.length) return { ok: false, error: 'Invalid website placement' };
    slotId = rows[0].id;
  }

  let packageId: number | null = null;
  let mediums = String(fd.get('mediums') || '').trim();
  if (packageIdRaw) {
    const { rows } = await getPool().query('SELECT id, mediums FROM ad_packages WHERE id=$1', [packageIdRaw]);
    if (!rows.length) return { ok: false, error: 'Invalid package' };
    packageId = rows[0].id;
    mediums = rows[0].mediums;
  }
  if (!mediums) mediums = slotId ? 'website' : '';

  const start = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date();
  if (Number.isNaN(start.getTime())) return { ok: false, error: 'Invalid start date' };
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + durationDays);

  return {
    ok: true,
    data: {
      advertiserName,
      contact,
      imageUrl,
      targetUrl,
      caption,
      slotId,
      packageId,
      mediums,
      durationDays,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      amountPaid: Number.isFinite(amountPaid) ? amountPaid : 0,
      paystackRef,
      status
    }
  };
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await ensureAdsSchema();
    const fd = await req.formData();
    const parsed = await parseAdInput(fd);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const d = parsed.data;

    const { rows } = await getPool().query(
      `INSERT INTO ad_submissions
         (slot_id, package_id, mediums, advertiser_name, contact, image_url, target_url, caption,
          duration_days, start_date, end_date, amount_paid, paystack_ref, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [
        d.slotId,
        d.packageId,
        d.mediums,
        d.advertiserName,
        d.contact,
        d.imageUrl,
        d.targetUrl,
        d.caption,
        d.durationDays,
        d.startDate,
        d.endDate,
        d.amountPaid,
        d.paystackRef,
        d.status
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

export async function PUT(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await ensureAdsSchema();
    const fd = await req.formData();
    const adId = parseInt(String(fd.get('id') || ''), 10);
    if (!Number.isFinite(adId)) return NextResponse.json({ error: 'Invalid advert' }, { status: 400 });

    const parsed = await parseAdInput(fd);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const d = parsed.data;

    const { rows } = await getPool().query(
      `UPDATE ad_submissions SET
         slot_id=$1, package_id=$2, mediums=$3, advertiser_name=$4, contact=$5,
         image_url=$6, target_url=$7, caption=$8, duration_days=$9,
         start_date=$10, end_date=$11, amount_paid=$12, paystack_ref=$13, status=$14
       WHERE id=$15 RETURNING id`,
      [
        d.slotId,
        d.packageId,
        d.mediums,
        d.advertiserName,
        d.contact,
        d.imageUrl,
        d.targetUrl,
        d.caption,
        d.durationDays,
        d.startDate,
        d.endDate,
        d.amountPaid,
        d.paystackRef,
        d.status,
        adId
      ]
    );
    if (!rows.length) return NextResponse.json({ error: 'Advert not found' }, { status: 404 });

    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (e) {
    console.error('admin ad update', e);
    const err = e as { code?: string };
    const msg =
      err.code === '42703'
        ? 'Database column missing — run npm run seed to update the schema'
        : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
