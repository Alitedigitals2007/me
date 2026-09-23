import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { initializePayment, makeReference, hasPaystackKeys } from '@/lib/paystack';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!rateLimit(`adsubmit:${clientIp(req)}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
  }
  try {
    const fd = await req.formData();
    const packageId = String(fd.get('package_id') || '');
    const days = parseInt(String(fd.get('duration_days') || '7'), 10) || 7;
    const advertiserName = String(fd.get('advertiser_name') || '').trim();
    const contact = String(fd.get('contact') || '').trim();
    const imageUrl = String(fd.get('image_url') || '').trim();
    const targetUrl = String(fd.get('target_url') || '').trim();
    const slotId = String(fd.get('slot_id') || '') || null;

    if (!packageId || !advertiserName || !contact || !imageUrl || !targetUrl) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (days < 1 || days > 14) {
      return NextResponse.json({ error: 'Duration must be between 1 and 14 days' }, { status: 400 });
    }

    const { rows } = await pool.query(
      'SELECT * FROM ad_packages WHERE id=$1 AND is_active=true',
      [packageId]
    );
    if (!rows.length) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const pkg = rows[0];
    const mediums: string[] = String(pkg.mediums || '')
      .split(',')
      .map((m: string) => m.trim())
      .filter(Boolean);

    if (mediums.includes('website')) {
      if (!slotId) return NextResponse.json({ error: 'Choose a website placement' }, { status: 400 });
      const { rows: slotRows } = await pool.query('SELECT id FROM ad_slots WHERE id=$1 AND is_active=true', [slotId]);
      if (!slotRows.length) return NextResponse.json({ error: 'Invalid website placement' }, { status: 400 });
    }

    const amount = days === 3 ? Number(pkg.bundle_3_rate) : Number(pkg.daily_rate) * days;
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

    const { rows: sub } = await pool.query(
      `INSERT INTO ad_submissions (slot_id, package_id, mediums, advertiser_name, contact, image_url, target_url, duration_days, start_date, end_date, amount_paid, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending_payment') RETURNING id`,
      [slotId, pkg.id, pkg.mediums, advertiserName, contact, imageUrl, targetUrl, days,
        start.toISOString().slice(0, 10), end.toISOString().slice(0, 10), amount]
    );
    const ref = makeReference('ad');
    await pool.query('UPDATE ad_submissions SET paystack_ref=$2 WHERE id=$1', [sub[0].id, ref]);

    const wa = contact.replace(/[^\d+]/g, '').replace(/^\+/, '');
    const isPhone = /^\+?\d{7,15}$/.test(contact.trim());
    sendTelegram(
      `🛒 <b>New ad order #${sub[0].id}</b>\n` +
      `👤 ${advertiserName} (${contact})\n` +
      `📦 ${pkg.name} · ${days} day${days > 1 ? 's' : ''} · ₦${Number(amount).toLocaleString()}\n` +
      `🔗 ${targetUrl}\n` +
      `${isPhone ? `💬 WhatsApp: https://wa.me/${wa}\n` : ''}` +
      `🔗 ${siteUrl()}/admin/ads`
    );

    if (!hasPaystackKeys()) {
      await pool.query(
        "UPDATE ad_submissions SET status='approved' WHERE id=$1",
        [sub[0].id]
      );
      return NextResponse.json({
        url: `/thanks?ref=${ref}&type=ad`
      });
    }

    const settings = await getSettings();
    const base = process.env.SITE_URL || 'http://localhost:3000';
    const url = await initializePayment({
      email: /@/.test(contact) ? contact : `${contact.replace(/\D/g, '').slice(-10)}@ads.alite`,
      amountKobo: Math.round(amount * 100),
      reference: ref,
      metadata: { type: 'ad', id: sub[0].id },
      callbackUrl: `${base}/thanks?ref=${ref}&type=ad`
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error('ads/submit', e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
