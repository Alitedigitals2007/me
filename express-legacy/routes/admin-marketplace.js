const express = require('express');
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/admin');
const { upload, saveUpload } = require('../lib/uploads');
const { sendTelegram } = require('../lib/telegram');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM marketplace_listings ORDER BY created_at DESC');
    res.render('admin/marketplace', { title: 'Marketplace', items: rows });
  } catch (e) { next(e); }
});

router.get('/new', (req, res) => {
  res.render('admin/listing-form', { title: 'New listing', item: null });
});

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const b = req.body;
    const image = await saveUpload(req.file, 'marketplace');
    await pool.query(
      `INSERT INTO marketplace_listings (title, description, price, image_url, is_own, owner_name, owner_contact, listing_fee, fee_paid, status)
       VALUES ($1,$2,$3,$4,true,$5,$6,0,true,'active')`,
      [b.title, b.description || '', Number(b.price) || 0, image || b.image_url || '', b.owner_name || '', b.owner_contact || '']
    );
    req.session.flash = { type: 'success', message: 'Listing created (live immediately — it is yours)' };
    res.redirect('/admin/marketplace');
  } catch (e) { next(e); }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "UPDATE marketplace_listings SET status='active' WHERE id=$1 AND status IN ('pending','rejected') RETURNING title, owner_name",
      [req.params.id]
    );
    if (rows.length) sendTelegram(`✅ Listing approved: <b>${rows[0].title}</b> by ${rows[0].owner_name || 'you'}`);
    req.session.flash = { type: 'success', message: 'Listing approved' };
    res.redirect('/admin/marketplace');
  } catch (e) { next(e); }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    await pool.query("UPDATE marketplace_listings SET status='rejected' WHERE id=$1", [req.params.id]);
    req.session.flash = { type: 'success', message: 'Listing rejected' };
    res.redirect('/admin/marketplace');
  } catch (e) { next(e); }
});

router.post('/:id/sold', async (req, res, next) => {
  try {
    await pool.query("UPDATE marketplace_listings SET status='sold' WHERE id=$1", [req.params.id]);
    req.session.flash = { type: 'success', message: 'Marked as sold' };
    res.redirect('/admin/marketplace');
  } catch (e) { next(e); }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM marketplace_listings WHERE id=$1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Listing deleted' };
    res.redirect('/admin/marketplace');
  } catch (e) { next(e); }
});

module.exports = router;
