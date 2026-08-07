const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/admin');
const { loadSettings, setSetting } = require('../lib/settings');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin login' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.session.flash = { type: 'error', message: 'Email and password are required' };
    return res.redirect('/admin/login');
  }
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 OR username = $1',
    [email.trim()]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    req.session.flash = { type: 'error', message: 'Invalid credentials' };
    return res.redirect('/admin/login');
  }
  req.session.user = { id: user.id, email: user.email, username: user.username, role: user.role };
  req.session.flash = { type: 'success', message: `Welcome back, ${user.username || user.email}` };
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const [ads, listings, messages, scheduled, viewsToday, viewsWeek, clicks, recentMsgs] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS c FROM ad_submissions WHERE status='paid'"),
      pool.query("SELECT COUNT(*)::int AS c FROM marketplace_listings WHERE status='pending'"),
      pool.query("SELECT COUNT(*)::int AS c FROM contact_messages WHERE is_read=false"),
      pool.query("SELECT COUNT(*)::int AS c FROM blog_posts WHERE status='scheduled'"),
      pool.query("SELECT COUNT(*)::int AS c FROM page_views WHERE viewed_at > now() - interval '1 day'"),
      pool.query("SELECT COUNT(*)::int AS c FROM page_views WHERE viewed_at > now() - interval '7 days'"),
      pool.query("SELECT COUNT(*)::int AS c FROM ad_clicks WHERE clicked_at > now() - interval '7 days'"),
      pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 5")
    ]);
    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats: {
        pendingAds: ads.rows[0].c,
        pendingListings: listings.rows[0].c,
        unreadMessages: messages.rows[0].c,
        scheduledPosts: scheduled.rows[0].c,
        viewsToday: viewsToday.rows[0].c,
        viewsWeek: viewsWeek.rows[0].c,
        clicksWeek: clicks.rows[0].c
      },
      recentMessages: recentMsgs.rows
    });
  } catch (e) { next(e); }
});

router.get('/analytics', requireAdmin, async (req, res, next) => {
  try {
    const [daily, topPaths, clicks] = await Promise.all([
      pool.query(`SELECT to_char(date_trunc('day', viewed_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS views
                  FROM page_views WHERE viewed_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1`),
      pool.query('SELECT path, COUNT(*)::int AS views FROM page_views GROUP BY path ORDER BY views DESC LIMIT 20'),
      pool.query(`SELECT a.advertiser_name, s.name AS slot, COUNT(c.id)::int AS clicks
                  FROM ad_clicks c JOIN ad_submissions a ON a.id=c.ad_id JOIN ad_slots s ON s.id=a.slot_id
                  GROUP BY a.advertiser_name, s.name ORDER BY clicks DESC`)
    ]);
    res.render('admin/analytics', {
      title: 'Analytics',
      daily: daily.rows,
      topPaths: topPaths.rows,
      clicks: clicks.rows
    });
  } catch (e) { next(e); }
});

router.get('/messages', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.render('admin/messages', { title: 'Messages', messages: rows });
  } catch (e) { next(e); }
});

router.post('/messages/:id/read', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read=true WHERE id=$1', [req.params.id]);
    res.redirect('/admin/messages');
  } catch (e) { next(e); }
});

router.post('/messages/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM contact_messages WHERE id=$1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Message deleted' };
    res.redirect('/admin/messages');
  } catch (e) { next(e); }
});

const SETTING_FIELDS = [
  'site_name', 'tagline', 'hero_name', 'hero_title', 'hero_bio', 'hero_photo',
  'about_bio', 'social_twitter', 'social_github', 'social_linkedin', 'social_instagram',
  'contact_email', 'contact_whatsapp', 'telegram_chat_id', 'og_image', 'marketplace_listing_fee'
];

router.get('/settings', requireAdmin, async (req, res, next) => {
  try {
    const settings = await loadSettings(true);
    res.render('admin/settings', { title: 'Settings', settings });
  } catch (e) { next(e); }
});

router.post('/settings', requireAdmin, async (req, res, next) => {
  try {
    for (const field of SETTING_FIELDS) {
      if (field in req.body) await setSetting(field, String(req.body[field]));
    }
    req.session.flash = { type: 'success', message: 'Settings saved' };
    res.redirect('/admin/settings');
  } catch (e) { next(e); }
});

module.exports = router;
