const express = require('express');
const { pool } = require('../config/db');
const { sendTelegram } = require('../lib/telegram');
const paystack = require('../lib/paystack');
const { loadSettings } = require('../lib/settings');

const router = express.Router();

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function finalizePayment(reference) {
  const txn = await paystack.verifyTransaction(reference);
  if (!txn) return { type: null };
  const meta = txn.metadata || {};
  const amountNaira = (txn.amount || 0) / 100;
  if (meta.type === 'ad') {
    const { rowCount, rows } = await pool.query(
      `UPDATE ad_submissions SET status='paid', amount_paid=$2, paystack_ref=$3
       WHERE id=$1 AND status='pending_payment' RETURNING id, advertiser_name`,
      [meta.id, amountNaira, reference]
    );
    if (rowCount) {
      sendTelegram(`💰 New ad payment received from <b>${rows[0].advertiser_name}</b> (₦${amountNaira.toLocaleString()}, ref ${reference}). Review it in the dashboard.`);
    }
    return { type: 'ad', id: meta.id, rowCount };
  }
  if (meta.type === 'listing') {
    const { rowCount, rows } = await pool.query(
      `UPDATE marketplace_listings SET status='pending', fee_paid=true, paystack_ref=$2
       WHERE id=$1 AND status='pending_payment' RETURNING id, title`,
      [meta.id, reference]
    );
    if (rowCount) {
      sendTelegram(`🏪 New marketplace listing awaiting approval: <b>${rows[0].title}</b>`);
    }
    return { type: 'listing', id: meta.id, rowCount };
  }
  return { type: 'unknown' };
}

router.get('/', async (req, res, next) => {
  try {
    const [proj, posts, listings] = await Promise.all([
      pool.query("SELECT * FROM projects ORDER BY featured DESC, order_index ASC LIMIT 3"),
      pool.query("SELECT id,title,slug,excerpt,cover_image,tags,publish_at FROM blog_posts WHERE status='published' ORDER BY publish_at DESC LIMIT 3"),
      pool.query("SELECT id,title,description,price,image_url FROM marketplace_listings WHERE status='active' ORDER BY created_at DESC LIMIT 3")
    ]);
    res.render('site/home', { title: 'Home', projects: proj.rows, posts: posts.rows, listings: listings.rows });
  } catch (e) { next(e); }
});

router.get('/about', async (req, res, next) => {
  try {
    const [ed, roles] = await Promise.all([
      pool.query('SELECT * FROM education ORDER BY order_index ASC'),
      pool.query('SELECT * FROM roles ORDER BY order_index ASC')
    ]);
    res.render('site/about', { title: 'About', education: ed.rows, roles: roles.rows });
  } catch (e) { next(e); }
});

router.get('/portfolio', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY order_index ASC, created_at DESC');
    res.render('site/portfolio', { title: 'Portfolio', projects: rows });
  } catch (e) { next(e); }
});

router.get('/portfolio/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE slug=$1', [req.params.slug]);
    if (!rows.length) return res.status(404).render('site/notfound', { title: 'Not found' });
    res.render('site/project', { title: rows[0].title, project: rows[0] });
  } catch (e) { next(e); }
});

router.get('/courses', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses ORDER BY order_index ASC');
    res.render('site/courses', { title: 'Courses', courses: rows });
  } catch (e) { next(e); }
});

router.get('/blog', async (req, res, next) => {
  try {
    const tag = (req.query.tag || '').toString().trim();
    let { rows } = await pool.query(
      "SELECT id,title,slug,excerpt,cover_image,tags,publish_at FROM blog_posts WHERE status='published' ORDER BY publish_at DESC"
    );
    if (tag) rows = rows.filter((p) => p.tags.toLowerCase().includes(tag.toLowerCase()));
    const allTags = [...new Set(rows.flatMap((p) => p.tags.split(',').map((t) => t.trim()).filter(Boolean)))];
    res.render('site/blog', { title: 'Blog', posts: rows, tag, allTags });
  } catch (e) { next(e); }
});

router.get('/blog/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM blog_posts WHERE slug=$1 AND status='published'",
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).render('site/notfound', { title: 'Not found' });
    const post = rows[0];
    const { rows: related } = await pool.query(
      "SELECT id,title,slug FROM blog_posts WHERE status='published' AND id != $1 ORDER BY publish_at DESC LIMIT 3",
      [post.id]
    );
    res.render('site/post', { title: post.title, post, related, fmtDate });
  } catch (e) { next(e); }
});

router.get('/marketplace', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM marketplace_listings WHERE status='active' ORDER BY is_own DESC, created_at DESC"
    );
    const settings = await loadSettings();
    res.render('site/marketplace', {
      title: 'Marketplace',
      listings: rows,
      listingFee: Number(settings.marketplace_listing_fee || 5000)
    });
  } catch (e) { next(e); }
});

router.post('/marketplace/submit', async (req, res, next) => {
  try {
    const settings = await loadSettings();
    const fee = Number(settings.marketplace_listing_fee || 5000);
    const { title, description, price, owner_name, owner_contact, image_url } = req.body;
    if (!title || !owner_contact) {
      req.session.flash = { type: 'error', message: 'Title and contact are required' };
      return res.redirect('/marketplace');
    }
    const { rows } = await pool.query(
      `INSERT INTO marketplace_listings (title, description, price, image_url, is_own, owner_name, owner_contact, listing_fee, fee_paid, status)
       VALUES ($1,$2,$3,$4,false,$5,$6,$7,false,'pending_payment')
       RETURNING id`,
      [title, description, price || 0, image_url || '', owner_name || '', owner_contact, fee]
    );
    const ref = paystack.makeReference('list');
    await pool.query('UPDATE marketplace_listings SET paystack_ref=$2 WHERE id=$1', [rows[0].id, ref]);
    const base = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const init = await paystack.initializePayment({
      email: /@/.test(owner_contact) ? owner_contact : `${owner_contact.replace(/\D/g, '').slice(-10)}@marketplace.alite`,
      amountKobo: Math.round(fee * 100),
      reference: ref,
      metadata: { type: 'listing', id: rows[0].id },
      callbackUrl: `${base}/marketplace/thanks?ref=${ref}`
    });
    res.redirect(init.authorization_url);
  } catch (e) { next(e); }
});

router.get('/marketplace/thanks', async (req, res, next) => {
  try {
    const ref = String(req.query.ref || '');
    if (ref) await finalizePayment(ref);
    res.render('site/thanks', { title: 'Thank you', kind: 'listing', ref });
  } catch (e) { next(e); }
});

router.get('/advertise', async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM ad_slots WHERE is_active = true ORDER BY id ASC");
    const { rows: live } = await pool.query(
      `SELECT s.name, s.position, s.max_active,
        (SELECT COUNT(*) FROM ad_submissions a WHERE a.slot_id = s.id AND a.status='approved' AND a.end_date >= CURRENT_DATE) AS active_count
       FROM ad_slots s WHERE s.is_active = true`
    );
    res.render('site/advertise', { title: 'Advertise', slots: rows, live, durations: [7, 14, 30] });
  } catch (e) { next(e); }
});

router.post('/advertise/submit', async (req, res, next) => {
  try {
    const { slot_id, duration_days, advertiser_name, contact, image_url, target_url } = req.body;
    const days = parseInt(duration_days, 10) || 7;
    if (!slot_id || !advertiser_name || !contact || !image_url || !target_url) {
      req.session.flash = { type: 'error', message: 'All fields are required' };
      return res.redirect('/advertise');
    }
    const { rows } = await pool.query('SELECT * FROM ad_slots WHERE id=$1 AND is_active=true', [slot_id]);
    if (!rows.length) {
      req.session.flash = { type: 'error', message: 'Invalid slot' };
      return res.redirect('/advertise');
    }
    const slot = rows[0];
    const amount = Number(slot.price_per_day) * days;
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    const { rows: sub } = await pool.query(
      `INSERT INTO ad_submissions (slot_id, advertiser_name, contact, image_url, target_url, duration_days, start_date, end_date, amount_paid, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending_payment') RETURNING id`,
      [slot_id, advertiser_name, contact, image_url, target_url, days, start.toISOString().slice(0, 10), end.toISOString().slice(0, 10), amount]
    );
    const ref = paystack.makeReference('ad');
    await pool.query('UPDATE ad_submissions SET paystack_ref=$2 WHERE id=$1', [sub[0].id, ref]);
    const base = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const init = await paystack.initializePayment({
      email: /@/.test(contact) ? contact : `${contact.replace(/\D/g, '').slice(-10)}@ads.alite`,
      amountKobo: Math.round(amount * 100),
      reference: ref,
      metadata: { type: 'ad', id: sub[0].id },
      callbackUrl: `${base}/advertise/thanks?ref=${ref}`
    });
    res.redirect(init.authorization_url);
  } catch (e) { next(e); }
});

router.get('/advertise/thanks', async (req, res, next) => {
  try {
    const ref = String(req.query.ref || '');
    if (ref) await finalizePayment(ref);
    res.render('site/thanks', { title: 'Thank you', kind: 'ad', ref });
  } catch (e) { next(e); }
});

router.get('/contact', (req, res) => {
  res.render('site/contact', { title: 'Contact' });
});

router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      req.session.flash = { type: 'error', message: 'All fields are required' };
      return res.redirect('/contact');
    }
    const { rows } = await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES ($1,$2,$3) RETURNING *',
      [name, email, message]
    );
    sendTelegram(`✉️ New contact message from <b>${name}</b> (${email}):\n${message.slice(0, 300)}`);
    req.session.flash = { type: 'success', message: 'Message sent — I will get back to you soon.' };
    res.redirect('/contact');
  } catch (e) { next(e); }
});

router.get('/click/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT target_url FROM ad_submissions WHERE id=$1 AND status=\'approved\'', [req.params.id]);
    pool.query('INSERT INTO ad_clicks (ad_id) VALUES ($1)', [req.params.id]).catch(() => {});
    if (rows.length && rows[0].target_url) return res.redirect(rows[0].target_url);
    res.redirect('/');
  } catch (e) { next(e); }
});

router.get('/robots.txt', (req, res) => {
  const base = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`);
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const [posts, projects, courses] = await Promise.all([
      pool.query("SELECT slug, publish_at FROM blog_posts WHERE status='published'"),
      pool.query('SELECT slug, created_at FROM projects'),
      pool.query('SELECT id, created_at FROM courses')
    ]);
    const urls = ['/', '/about', '/portfolio', '/courses', '/blog', '/marketplace', '/advertise', '/contact'];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
${posts.rows.map((p) => `  <url><loc>${base}/blog/${p.slug}</loc></url>`).join('\n')}
${projects.rows.map((p) => `  <url><loc>${base}/portfolio/${p.slug}</loc></url>`).join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  } catch (e) { next(e); }
});

module.exports = router;
