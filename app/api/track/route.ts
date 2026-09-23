import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!rateLimit(`track:${clientIp(req)}`, 60, 60 * 1000)) {
    return NextResponse.json({ ok: false });
  }
  try {
    let path = '/';
    let referrer = '';
    try {
      const body = await req.json();
      path = String(body.path || '/').slice(0, 200);
      referrer = String(body.referrer || '').slice(0, 500);
    } catch { /* ignore */ }
    const ua = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    await pool.query(
      'INSERT INTO page_views (path, referrer, user_agent, ip) VALUES ($1,$2,$3,$4)',
      [path, referrer, ua.slice(0, 500), ip.slice(0, 100)]
    ).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
