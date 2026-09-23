import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'blog-comment-salt').digest('hex');
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { rows: post } = await pool.query('SELECT id FROM blog_posts WHERE slug=$1 AND status=\'published\'', [slug]);
    if (!post.length) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    const postId = post[0].id;

    const { rows } = await pool.query(
      `SELECT id, name, content, created_at 
       FROM blog_comments 
       WHERE post_id=$1 AND is_approved=true 
       ORDER BY created_at DESC`,
      [postId]
    );
    return NextResponse.json({ comments: rows });
  } catch (e) {
    console.error('blog comments get', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`comment:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many comments. Try again later.' }, { status: 429 });
  }
  try {
    const { slug } = await params;
    const { name, content } = await req.json();
    
    if (!name?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Name and comment are required' }, { status: 400 });
    }
    if (name.length > 80) return NextResponse.json({ error: 'Name too long' }, { status: 400 });
    if (content.length > 2000) return NextResponse.json({ error: 'Comment too long' }, { status: 400 });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = hashIp(ip);

    const { rows: post } = await pool.query('SELECT id FROM blog_posts WHERE slug=$1 AND status=\'published\'', [slug]);
    if (!post.length) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    const postId = post[0].id;

    await pool.query(
      `INSERT INTO blog_comments (post_id, name, content, ip_hash) VALUES ($1, $2, $3, $4)`,
      [postId, name.trim(), content.trim(), ipHash]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('blog comment post', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}