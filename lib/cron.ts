import pool from './db';
import { sendTelegram, siteUrl } from './telegram';
import { getSettings } from './settings';

let running = false;

async function dailyReport() {
  const settings = await getSettings();
  if (settings.telegram_daily_report !== 'true') return;
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM page_views WHERE viewed_at::date = CURRENT_DATE - 1) AS views,
       (SELECT COUNT(*) FROM ad_clicks WHERE clicked_at::date = CURRENT_DATE - 1) AS clicks,
       (SELECT COUNT(*) FROM contact_messages WHERE created_at::date = CURRENT_DATE - 1) AS messages,
       (SELECT COUNT(*) FROM ad_submissions WHERE status='approved' AND end_date < CURRENT_DATE) AS expired
    `
  );
  const top = await pool.query(
    `SELECT path, COUNT(*) AS v FROM page_views
      WHERE viewed_at >= CURRENT_DATE - 1
      GROUP BY path ORDER BY v DESC LIMIT 5`
  );
  const r = rows[0];
  const lines = (top.rows as { path: string; v: string }[]).map((p, i) => `${i + 1}. ${p.path} — ${p.v}`);
  await sendTelegram(
    `📈 <b>Yesterday report</b>\n\n` +
    `👀 Views: <b>${r.views}</b>\n` +
    `🖱 Ad clicks: <b>${r.clicks}</b>\n` +
    `✉️ Messages: <b>${r.messages}</b>\n` +
    `⛔ Ads expired: <b>${r.expired}</b>` +
    (lines.length ? `\n\n🔥 Top pages:\n${lines.join('\n')}` : '') +
    `\n🔗 ${siteUrl()}/admin/analytics`
  );
}

async function weeklyDigest() {
  const settings = await getSettings();
  if (settings.telegram_weekly_digest !== 'true') return;
  const isMonday = new Date().getDay() === 1;
  if (!isMonday) return;
  const total = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM page_views WHERE viewed_at >= CURRENT_DATE - 7) AS views,
       (SELECT COUNT(*) FROM ad_clicks WHERE clicked_at >= CURRENT_DATE - 7) AS clicks
    `
  );
  const topPosts = await pool.query(
    `SELECT path, COUNT(*) AS v FROM page_views
      WHERE viewed_at >= CURRENT_DATE - 7 AND path LIKE '/blog/%'
      GROUP BY path ORDER BY v DESC LIMIT 5`
  );
  const topAds = await pool.query(
    `SELECT a.advertiser_name, COUNT(c.id) AS clicks
       FROM ad_clicks c JOIN ad_submissions a ON a.id = c.ad_id
      WHERE c.clicked_at >= CURRENT_DATE - 7
      GROUP BY a.id ORDER BY clicks DESC LIMIT 5`
  );
  const t = total.rows[0];
  const posts = (topPosts.rows as { path: string; v: string }[]).map((p, i) => `${i + 1}. ${p.path.replace('/blog/', '')} — ${p.v}`);
  const ads = (topAds.rows as { advertiser_name: string; clicks: string }[]).map((a, i) => `${i + 1}. ${a.advertiser_name} — ${a.clicks}`);
  await sendTelegram(
    `📊 <b>Weekly digest (7 days)</b>\n\n` +
    `👀 Views: <b>${Number(t.views).toLocaleString()}</b>\n` +
    `🖱 Ad clicks: <b>${t.clicks}</b>\n` +
    `\n📝 Top posts:\n${posts.length ? posts.join('\n') : 'No blog traffic yet.'}` +
    `\n\n📣 Top ads:\n${ads.length ? ads.join('\n') : 'No ad clicks yet.'}` +
    `\n🔗 ${siteUrl()}/admin/analytics`
  );
}

async function expiringAds() {
  const settings = await getSettings();
  if (settings.telegram_expiring_ads !== 'true') return;
  const { rows } = await pool.query(
    `SELECT advertiser_name, contact, end_date FROM ad_submissions
      WHERE status='approved' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 2
      ORDER BY end_date`
  );
  if (!rows.length) return;
  const lines = (rows as { advertiser_name: string; contact: string; end_date: Date }[]).map(
    (a, i) => `${i + 1}. <b>${a.advertiser_name}</b> — ends ${new Date(a.end_date).toISOString().slice(0, 10)} (${a.contact})`
  );
  await sendTelegram(
    `⏳ <b>Ads ending in 2 days</b> (renew or let them expire)\n\n${lines.join('\n')}\n🔗 ${siteUrl()}/admin/ads`
  );
}

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
    await dailyReport();
    await expiringAds();
    await weeklyDigest();
    return { published: posts.rowCount ?? 0, expired: ads.rowCount ?? 0 };
  } finally {
    running = false;
  }
}
