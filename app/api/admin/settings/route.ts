import { NextRequest, NextResponse } from 'next/server';
import { setSetting, getSettings } from '@/lib/settings';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const SETTING_FIELDS = [
  'site_name', 'tagline', 'hero_name', 'hero_title', 'hero_bio', 'hero_photo',
  'about_bio', 'social_twitter', 'social_github', 'social_linkedin', 'social_instagram',
  'contact_email', 'contact_whatsapp', 'telegram_chat_id', 'og_image', 'marketplace_listing_fee'
];

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    for (const field of SETTING_FIELDS) {
      if (field in body) await setSetting(field, String(body[field] ?? ''));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin settings', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await getSettings(true));
}
