const { pool } = require('../config/db');
const { loadSettings } = require('../lib/settings');
const { runScheduledTasks } = require('../lib/cron');

async function loadAds() {
  const { rows } = await pool.query(
    `SELECT a.id, a.image_url, a.target_url, a.slot_id, s.position, s.max_active
     FROM ad_submissions a
     JOIN ad_slots s ON s.id = a.slot_id
     WHERE a.status = 'approved' AND s.is_active = true AND a.end_date >= CURRENT_DATE`
  );
  const byPosition = {};
  for (const ad of rows) {
    if (!byPosition[ad.position]) byPosition[ad.position] = [];
    byPosition[ad.position].push(ad);
  }
  for (const pos of Object.keys(byPosition)) {
    const max = byPosition[pos][0].max_active;
    byPosition[pos] = shuffle(byPosition[pos]).slice(0, max);
  }
  return byPosition;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadSiteLocals(req, res, next) {
  try {
    const settings = await loadSettings();
    res.locals.site = settings;
    res.locals.user = req.session.user || null;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    res.locals.ads = await loadAds();
    res.locals.currentYear = new Date().getFullYear();
    res.locals.isAdminRoute = req.path.startsWith('/admin');

    if (!res.locals.isAdminRoute && !req.path.startsWith('/api') && !req.path.startsWith('/click') && !/\.[a-z0-9]+$/i.test(req.path)) {
      pool.query('INSERT INTO page_views (path) VALUES ($1)', [req.path]).catch(() => {});
    }

    if (Math.random() < 0.25) {
      runScheduledTasks().catch(() => {});
    }
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { loadSiteLocals };
