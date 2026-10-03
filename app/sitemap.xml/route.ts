import getPool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  try {
    const [posts, projects, stories] = await Promise.all([
      getPool().query("SELECT slug FROM blog_posts WHERE status='published'"),
      getPool().query('SELECT slug FROM projects'),
      getPool().query("SELECT slug FROM stories WHERE status='published'")
    ]);
    const urls = ['/', '/about', '/portfolio', '/academy', '/blog', '/marketplace', '/advertise', '/contact', '/stories'];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
${posts.rows.map((p) => `  <url><loc>${base}/blog/${p.slug}</loc></url>`).join('\n')}
${projects.rows.map((p) => `  <url><loc>${base}/portfolio/${p.slug}</loc></url>`).join('\n')}
${stories.rows.map((s) => `  <url><loc>${base}/stories/${s.slug}</loc></url>`).join('\n')}
</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
  } catch (e) {
    // Fallback if DB not available
    const urls = ['/', '/about', '/portfolio', '/academy', '/blog', '/marketplace', '/advertise', '/contact', '/stories'];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
  }
}
