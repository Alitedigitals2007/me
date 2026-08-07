import { NextRequest, NextResponse } from 'next/server';
import { runScheduledTasks } from '@/lib/cron';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await runScheduledTasks();
  return NextResponse.json({ ok: true, ...result });
}
