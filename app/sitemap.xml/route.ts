import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  const [posts, projects] = await Promise.all([
    pool.query("SELECT slug FROM blog_posts WHERE status='published'"),
    pool.query('SELECT slug FROM projects')
  ]);
  const urls = ['/', '/about', '/portfolio', '/academy', '/blog', '/marketplace', '/advertise', '/contact'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
${posts.rows.map((p) => `  <url><loc>${base}/blog/${p.slug}</loc></url>`).join('\n')}
${projects.rows.map((p) => `  <url><loc>${base}/portfolio/${p.slug}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
