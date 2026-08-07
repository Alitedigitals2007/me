import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ ok: false, error: 'Set ANTHROPIC_API_KEY in .env to enable AI drafts' });
    const { topic } = await req.json();
    if (!String(topic || '').trim()) return NextResponse.json({ ok: false, error: 'Topic is required' });
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
    if (!text) return NextResponse.json({ ok: false, error: data.error ? data.error.message : 'AI returned nothing' });
    const match = text.match(/EXCERPT:\s*(.*?)(?:\n|$)/s);
    return NextResponse.json({
      ok: true,
      excerpt: match ? match[1].trim() : text.slice(0, 160),
      content: text.replace(/EXCERPT:.*?\n/, '').trim()
    });
  } catch (e) {
    console.error('ai-draft', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'AI failed' });
  }
}
