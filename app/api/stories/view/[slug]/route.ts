import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import crypto from 'crypto';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { recordStoryView } from '@/lib/data';

export const runtime = 'nodejs';

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'story-view-salt').digest('hex');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`storyview:${clientIp(req)}`, 30, 60 * 1000)) {
    return NextResponse.json({ ok: false });
  }
  try {
    const { slug } = await params;
    const { rows } = await getPool().query(
      `SELECT id FROM stories WHERE slug=$1 AND status='published'`,
      [slug]
    );
    if (!rows.length) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const views = await recordStoryView(rows[0].id, hashIp(ip));
    return NextResponse.json({ ok: true, views });
  } catch (e) {
    console.error('story view', e);
    return NextResponse.json({ ok: false });
  }
}
