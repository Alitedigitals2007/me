const express = require('express');
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/admin');
const { upload, saveUpload } = require('../lib/uploads');
const { slugify } = require('../lib/slugify');

const router = express.Router();
router.use(requireAdmin);

router.get('/projects', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY order_index ASC, created_at DESC');
    res.render('admin/projects', { title: 'Projects', items: rows });
  } catch (e) { next(e); }
});

router.get('/projects/new', (req, res) => {
  res.render('admin/project-form', { title: 'New project', project: null });
});

router.post('/projects', upload.single('image'), async (req, res, next) => {
  try {
    const b = req.body;
    const image = await saveUpload(req.file, 'projects');
    const { rows } = await pool.query(
      `INSERT INTO projects (title, slug, description, stack, image_url, live_url, repo_url, featured, order_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [b.title, slugify(b.title), b.description || '', b.stack || '', image || b.image_url || '', b.live_url || '', b.repo_url || '', !!b.featured, parseInt(b.order_index, 10) || 0]
    );
    req.session.flash = { type: 'success', message: 'Project created' };
    res.redirect(`/admin/projects/edit/${rows[0].id}`);
  } catch (e) { next(e); }
});

router.get('/projects/edit/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.redirect('/admin/projects');
    res.render('admin/project-form', { title: 'Edit project', project: rows[0] });
  } catch (e) { next(e); }
});

router.post('/projects/edit/:id', upload.single('image'), async (req, res, next) => {
  try {
    const b = req.body;
    const image = await saveUpload(req.file, 'projects');
    await pool.query(
      `UPDATE projects SET title=$1, slug=$2, description=$3, stack=$4, image_url=COALESCE(NULLIF($5,''), image_url), live_url=$6, repo_url=$7, featured=$8, order_index=$9 WHERE id=$10`,
      [b.title, slugify(b.title), b.description || '', b.stack || '', image || b.image_url || '', b.live_url || '', b.repo_url || '', !!b.featured, parseInt(b.order_index, 10) || 0, req.params.id]
    );
    req.session.flash = { type: 'success', message: 'Project updated' };
    res.redirect('/admin/projects');
  } catch (e) { next(e); }
});

router.post('/projects/delete/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Project deleted' };
    res.redirect('/admin/projects');
  } catch (e) { next(e); }
});

function timelineCrud(path, table, fields, formView) {
  router.get(`/${path}`, async (req, res, next) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY order_index ASC`);
      res.render(`admin/${formView}-list`, { title: path, items: rows });
    } catch (e) { next(e); }
  });

  router.post(`/${path}`, async (req, res, next) => {
    try {
      const b = req.body;
      const values = fields.map((f) => (f === 'is_own_product' ? !!b[f] : b[f] || ''));
      values.push(parseInt(b.order_index, 10) || 0);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO ${table} (${fields.join(',')}, order_index) VALUES (${placeholders}, $${fields.length + 1})`, values);
      req.session.flash = { type: 'success', message: 'Saved' };
      res.redirect(`/admin/${path}`);
    } catch (e) { next(e); }
  });

  router.post(`/${path}/edit/:id`, async (req, res, next) => {
    try {
      const b = req.body;
      const values = fields.map((f) => (f === 'is_own_product' ? !!b[f] : b[f] || ''));
      values.push(parseInt(b.order_index, 10) || 0, req.params.id);
      const sets = fields.map((f, i) => `${f}=$${i + 1}`).join(',');
      await pool.query(`UPDATE ${table} SET ${sets}, order_index=$${fields.length + 1} WHERE id=$${fields.length + 2}`, values);
      req.session.flash = { type: 'success', message: 'Saved' };
      res.redirect(`/admin/${path}`);
    } catch (e) { next(e); }
  });

  router.post(`/${path}/delete/:id`, async (req, res, next) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
      req.session.flash = { type: 'success', message: 'Deleted' };
      res.redirect(`/admin/${path}`);
    } catch (e) { next(e); }
  });
}

timelineCrud('education', 'education', ['institution', 'program', 'start_date', 'end_date', 'description'], 'timeline');
timelineCrud('roles', 'roles', ['title', 'org', 'start_date', 'end_date', 'description'], 'timeline');
timelineCrud('courses', 'courses', ['title', 'description', 'link', 'price', 'is_own_product'], 'timeline');

module.exports = router;
