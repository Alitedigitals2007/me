import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { siteUrl } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { rows } = await pool.query(
      "SELECT target_url FROM ad_submissions WHERE id=$1 AND status='approved'",
      [id]
    );
    pool.query('INSERT INTO ad_clicks (ad_id) VALUES ($1)', [id]).catch(() => {});
    if (rows.length && rows[0].target_url) {
      return NextResponse.redirect(rows[0].target_url, 302);
    }
  } catch { /* fall through to home */ }
  return NextResponse.redirect(new URL('/', siteUrl()), 302);
}
  } catch { /* fall through to home */ }
  return NextResponse.redirect(new URL('/', 'https://example.com'), 302);
}
