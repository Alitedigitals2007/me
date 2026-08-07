import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const ACTIONS: Record<string, { sql: string; telegram?: (row: { title: string }) => string }> = {
  publish: {
    sql: "UPDATE blog_posts SET status='published', publish_at=COALESCE(publish_at, now()) WHERE id=$1 RETURNING title, slug",
    telegram: (r) => `📝 Blog post published: <b>${r.title}</b>\n🔗 ${siteUrl()}/blog/${r.slug}`
  },
  unpublish: {
    sql: "UPDATE blog_posts SET status='draft' WHERE id=$1 RETURNING title"
  },
  delete: { sql: 'DELETE FROM blog_posts WHERE id=$1' }
};

export async function POST(_req: NextRequest, { params }: { params: Promise<{ action: string; id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { action, id } = await params;
  const fn = ACTIONS[action];
  if (!fn) return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  try {
    const { rows } = await pool.query(fn.sql, [id]);
    if (fn.telegram && rows.length) sendTelegram(fn.telegram(rows[0]));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
