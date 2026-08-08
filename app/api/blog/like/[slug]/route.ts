import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'blog-like-salt').digest('hex');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = hashIp(ip);

    const { rows: post } = await pool.query('SELECT id FROM blog_posts WHERE slug=$1 AND status=\'published\'', [slug]);
    if (!post.length) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    const postId = post[0].id;

    try {
      await pool.query('INSERT INTO blog_likes (post_id, ip_hash) VALUES ($1, $2)', [postId, ipHash]);
      await pool.query('UPDATE blog_posts SET like_count = like_count + 1 WHERE id=$1', [postId]);
      return NextResponse.json({ liked: true });
    } catch (e: any) {
      if (e.code === '23505') {
        await pool.query('DELETE FROM blog_likes WHERE post_id=$1 AND ip_hash=$2', [postId, ipHash]);
        await pool.query('UPDATE blog_posts SET like_count = like_count - 1 WHERE id=$1', [postId]);
        return NextResponse.json({ liked: false });
      }
      throw e;
    }
  } catch (e) {
    console.error('blog like', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = hashIp(ip);

    const { rows } = await pool.query(
      `SELECT bp.like_count, 
              CASE WHEN bl.id IS NOT NULL THEN true ELSE false END as liked
       FROM blog_posts bp
       LEFT JOIN blog_likes bl ON bl.post_id = bp.id AND bl.ip_hash = $1
       WHERE bp.slug = $2 AND bp.status = 'published'`,
      [ipHash, slug]
    );
    if (!rows.length) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e) {
    console.error('blog like get', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}