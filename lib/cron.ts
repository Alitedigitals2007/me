import pool from './db';
import { sendTelegram, siteUrl } from './telegram';

let running = false;

export async function runScheduledTasks() {
  if (running) return { skipped: true, published: 0, expired: 0 };
  running = true;
  try {
    const posts = await pool.query(
      `UPDATE blog_posts SET status='published', publish_at=COALESCE(publish_at, now())
       WHERE status='scheduled' AND publish_at <= now()
       RETURNING title, slug`
    );
    for (const p of posts.rows) {
      await sendTelegram(`📝 Blog post published: <b>${p.title}</b>\n🔗 ${siteUrl()}/blog/${p.slug}`);
    }
    const ads = await pool.query(
      `UPDATE ad_submissions SET status='expired'
       WHERE status='approved' AND end_date < CURRENT_DATE RETURNING id`
    );
    return { published: posts.rowCount ?? 0, expired: ads.rowCount ?? 0 };
  } finally {
    running = false;
  }
}
