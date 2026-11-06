import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import crypto from 'crypto';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'story-comment-salt').digest('hex');
}

function clientIpHeader(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { rows: story } = await getPool().query(
      `SELECT id FROM stories WHERE slug=$1 AND status='published'`,
      [slug]
    );
    if (!story.length) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    const { rows } = await getPool().query(
      `SELECT id, name, content, created_at
       FROM story_comments
       WHERE story_id=$1 AND is_approved=true
       ORDER BY created_at DESC`,
      [story[0].id]
    );
    return NextResponse.json({ comments: rows });
  } catch (e) {
    console.error('story comments get', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`storycomment:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many comments. Try again later.' }, { status: 429 });
  }
  try {
    const { slug } = await params;
    const { name, content } = await req.json();

    if (!name?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Name and comment are required' }, { status: 400 });
    }
    if (String(name).length > 80) return NextResponse.json({ error: 'Name too long' }, { status: 400 });
    if (String(content).length > 2000) return NextResponse.json({ error: 'Comment too long' }, { status: 400 });

    const { rows: story } = await getPool().query(
      `SELECT id FROM stories WHERE slug=$1 AND status='published'`,
      [slug]
    );
    if (!story.length) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    await getPool().query(
      `INSERT INTO story_comments (story_id, name, content, ip_hash, is_approved) VALUES ($1, $2, $3, $4, true)`,
      [story[0].id, String(name).trim(), String(content).trim(), hashIp(clientIpHeader(req))]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('story comment post', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
