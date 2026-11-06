import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import crypto from 'crypto';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'story-like-salt').digest('hex');
}

function clientHash(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return hashIp(ip);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`storylike:${clientIp(req)}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Slow down' }, { status: 429 });
  }
  try {
    const { slug } = await params;
    const ipHash = clientHash(req);

    const { rows: story } = await getPool().query(
      `SELECT id FROM stories WHERE slug=$1 AND status='published'`,
      [slug]
    );
    if (!story.length) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    const storyId = story[0].id;

    try {
      await getPool().query('INSERT INTO story_likes (story_id, ip_hash) VALUES ($1, $2)', [storyId, ipHash]);
      await getPool().query('UPDATE stories SET like_count = like_count + 1 WHERE id=$1', [storyId]);
      return NextResponse.json({ liked: true });
    } catch (e: any) {
      if (e.code === '23505') {
        await getPool().query('DELETE FROM story_likes WHERE story_id=$1 AND ip_hash=$2', [storyId, ipHash]);
        await getPool().query('UPDATE stories SET like_count = GREATEST(like_count - 1, 0) WHERE id=$1', [storyId]);
        return NextResponse.json({ liked: false });
      }
      throw e;
    }
  } catch (e) {
    console.error('story like', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const ipHash = clientHash(req);
    const { rows } = await getPool().query(
      `SELECT s.like_count,
              CASE WHEN sl.id IS NOT NULL THEN true ELSE false END as liked
       FROM stories s
       LEFT JOIN story_likes sl ON sl.story_id = s.id AND sl.ip_hash = $1
       WHERE s.slug = $2 AND s.status = 'published'`,
      [ipHash, slug]
    );
    if (!rows.length) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e) {
    console.error('story like get', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
