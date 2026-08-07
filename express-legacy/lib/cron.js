const { pool } = require('../config/db');
const { sendTelegram } = require('./telegram');

let running = false;

async function publishDuePosts() {
  const { rows } = await pool.query(
    `UPDATE blog_posts SET status='published', publish_at=COALESCE(publish_at, now())
     WHERE status='scheduled' AND publish_at <= now()
     RETURNING id, title, slug`
  );
  for (const post of rows) {
    await sendTelegram(`📝 Blog post published: <b>${post.title}</b>`);
  }
  return rows.length;
}

async function expireAds() {
  const { rows } = await pool.query(
    `UPDATE ad_submissions SET status='expired'
     WHERE status='approved' AND end_date < CURRENT_DATE
     RETURNING id`
  );
  return rows.length;
}

async function runScheduledTasks() {
  if (running) return { skipped: true };
  running = true;
  try {
    const published = await publishDuePosts();
    const expired = await expireAds();
    return { published, expired };
  } finally {
    running = false;
  }
}

function startLocalScheduler() {
  const cron = require('node-cron');
  cron.schedule('* * * * *', () => {
    runScheduledTasks().catch((e) => console.error('cron error:', e.message));
  });
  console.log('Local scheduler started (checks every minute)');
}

module.exports = { runScheduledTasks, startLocalScheduler };
