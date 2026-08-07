const express = require('express');
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/admin');
const { upload, saveUpload } = require('../lib/uploads');
const { slugify } = require('../lib/slugify');
const { sendTelegram } = require('../lib/telegram');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id,title,slug,status,publish_at,tags FROM blog_posts ORDER BY COALESCE(publish_at, created_at) DESC');
    res.render('admin/blog', { title: 'Blog', posts: rows });
  } catch (e) { next(e); }
});

router.get('/new', (req, res) => {
  res.render('admin/blog-form', { title: 'New post', post: null });
});

router.post('/', upload.single('cover'), async (req, res, next) => {
  try {
    const b = req.body;
    const cover = await saveUpload(req.file, 'blog');
    const publishAt = b.publish_at ? new Date(b.publish_at).toISOString() : null;
    const { rows } = await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, tags, status, publish_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [b.title, slugify(b.title), b.excerpt || '', b.content || '', cover || b.cover_image || '', b.tags || '', b.status || 'draft', publishAt]
    );
    if (b.status === 'published') sendTelegram(`📝 New blog post published: <b>${b.title}</b>`);
    req.session.flash = { type: 'success', message: 'Post saved' };
    res.redirect(`/admin/blog/edit/${rows[0].id}`);
  } catch (e) { next(e); }
});

router.get('/edit/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM blog_posts WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.redirect('/admin/blog');
    const post = rows[0];
    if (post.publish_at) post.publish_at_local = new Date(post.publish_at).toISOString().slice(0, 16);
    res.render('admin/blog-form', { title: 'Edit post', post });
  } catch (e) { next(e); }
});

router.post('/edit/:id', upload.single('cover'), async (req, res, next) => {
  try {
    const b = req.body;
    const cover = await saveUpload(req.file, 'blog');
    const publishAt = b.publish_at ? new Date(b.publish_at).toISOString() : null;
    const { rows } = await pool.query(
      `UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, content=$4, cover_image=COALESCE(NULLIF($5,''), cover_image), tags=$6, status=$7, publish_at=$8, updated_at=now() WHERE id=$9 RETURNING status, title`,
      [b.title, slugify(b.title), b.excerpt || '', b.content || '', cover || b.cover_image || '', b.tags || '', b.status || 'draft', publishAt, req.params.id]
    );
    if (rows.length && rows[0].status === 'published') sendTelegram(`📝 Blog post published: <b>${rows[0].title}</b>`);
    req.session.flash = { type: 'success', message: 'Post updated' };
    res.redirect(`/admin/blog/edit/${req.params.id}`);
  } catch (e) { next(e); }
});

router.post('/delete/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM blog_posts WHERE id=$1', [req.params.id]);
    req.session.flash = { type: 'success', message: 'Post deleted' };
    res.redirect('/admin/blog');
  } catch (e) { next(e); }
});

router.post('/:id/publish', async (req, res, next) => {
  try {
    const { rows } = await pool.query("UPDATE blog_posts SET status='published', publish_at=COALESCE(publish_at, now()) WHERE id=$1 RETURNING title", [req.params.id]);
    if (rows.length) sendTelegram(`📝 Blog post published: <b>${rows[0].title}</b>`);
    req.session.flash = { type: 'success', message: 'Published' };
    res.redirect('/admin/blog');
  } catch (e) { next(e); }
});

router.post('/ai-draft', async (req, res, next) => {
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return res.json({ ok: false, error: 'Set ANTHROPIC_API_KEY in .env to enable AI drafts' });
    }
    const { topic } = req.body;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: `Write a blog post in HTML (h2/p/ul only, no html/body wrapper) on: ${topic}. Start with a 2 sentence excerpt after the tag EXCERPT: then the body.` }]
      })
    });
    const data = await r.json();
    const text = data.content && data.content[0] && data.content[0].text;
    if (!text) return res.json({ ok: false, error: data.error ? data.error.message : 'AI returned nothing' });
    const match = text.match(/EXCERPT:\s*(.*?)(?:\n|$)/s);
    res.json({
      ok: true,
      excerpt: match ? match[1].trim() : text.slice(0, 160),
      content: text.replace(/EXCERPT:.*?\n/, '').trim()
    });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

module.exports = router;
