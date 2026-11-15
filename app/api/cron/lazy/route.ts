import { NextRequest, NextResponse } from 'next/server';
import { runScheduledTasks } from '@/lib/cron';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!rateLimit(`cron-lazy:${clientIp(req)}`, 6, 60 * 1000)) {
    return NextResponse.json({ ok: false, skipped: true }, { status: 429 });
  }
  const result = await runScheduledTasks({ reports: false });
  return NextResponse.json({ ok: true, ...result });
}
