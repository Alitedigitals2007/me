import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegram-bot';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.CRON_SECRET || '';
  if (expected) {
    const given = req.headers.get('x-telegram-bot-api-secret-token') || '';
    if (given !== expected) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const update = await req.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: false }, { status: 400 });
  await handleTelegramUpdate(update);
  return NextResponse.json({ ok: true });
}
