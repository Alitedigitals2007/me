const express = require('express');
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/admin');
const { sendTelegram } = require('../lib/telegram');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.filter || 'pending';
    const valid = ['pending', 'paid', 'approved', 'rejected', 'expired', 'all'];
    const status = valid.includes(filter) ? filter : 'pending';
    const where = status === 'all' ? 'TRUE' : `a.status = '${status}'`;
    const { rows } = await pool.query(
      `SELECT a.*, s.name AS slot_name, s.position
       FROM ad_submissions a JOIN ad_slots s ON s.id = a.slot_id
       WHERE ${where} ORDER BY a.created_at DESC`
    );
    const { rows: counts } = await pool.query('SELECT status, COUNT(*)::int AS c FROM ad_submissions GROUP BY status');
    const countMap = Object.fromEntries(counts.map((r) => [r.status, r.c]));
    res.render('admin/ads', { title: 'Ads', subs: rows, filter: status, countMap });
  } catch (e) { next(e); }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE ad_submissions SET status='approved', start_date=CURRENT_DATE,
        end_date=CURRENT_DATE + (duration_days || ' days')::interval
       WHERE id=$1 AND status IN ('paid','pending_payment') RETURNING advertiser_name`,
      [req.params.id]
    );
    if (rows.length) sendTelegram(`✅ Ad approved and live: <b>${rows[0].advertiser_name}</b>`);
    req.session.flash = { type: 'success', message: 'Ad approved — now live' };
    res.redirect('/admin/ads');
  } catch (e) { next(e); }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE ad_submissions SET status='rejected' WHERE id=$1 AND status IN ('paid','pending_payment') RETURNING advertiser_name, paystack_ref`,
      [req.params.id]
    );
    if (rows.length) {
      sendTelegram(`⛔ Ad rejected: <b>${rows[0].advertiser_name}</b>${rows[0].paystack_ref ? ` (ref ${rows[0].paystack_ref}) — arrange refund` : ''}`);
    }
    req.session.flash = { type: 'success', message: 'Ad rejected — refund flow noted in Telegram' };
    res.redirect('/admin/ads');
  } catch (e) { next(e); }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM ad_clicks WHERE ad_id=$1', [req.params.id]);
    await pool.query('DELETE FROM ad_submissions WHERE id=$1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Submission deleted' };
    res.redirect('/admin/ads');
  } catch (e) { next(e); }
});

router.get('/slots', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ad_slots ORDER BY id ASC');
    res.render('admin/ad-slots', { title: 'Ad slots', slots: rows });
  } catch (e) { next(e); }
});

router.post('/slots', async (req, res, next) => {
  try {
    const b = req.body;
    await pool.query(
      `INSERT INTO ad_slots (name, position, price_per_day, max_active, description)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (position) DO UPDATE
       SET name=$1, price_per_day=$3, max_active=$4, description=$5`,
      [b.name, b.position, Number(b.price_per_day) || 0, parseInt(b.max_active, 10) || 1, b.description || '']
    );
    req.session.flash = { type: 'success', message: 'Slot saved' };
    res.redirect('/admin/ads/slots');
  } catch (e) { next(e); }
});

router.post('/slots/:id/toggle', async (req, res, next) => {
  try {
    await pool.query('UPDATE ad_slots SET is_active = NOT is_active WHERE id=$1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Slot toggled' };
    res.redirect('/admin/ads/slots');
  } catch (e) { next(e); }
});

module.exports = router;
