import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const { rows } = await getPool().query(
      `DELETE FROM story_comments WHERE id=$1 RETURNING id`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin story comment delete', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
