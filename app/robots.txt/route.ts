export async function GET() {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
