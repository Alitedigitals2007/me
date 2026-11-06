import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const writer = await getWriter();
  if (!writer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const { rows } = await getPool().query(
      `DELETE FROM story_comments
       WHERE id=$1 AND story_id IN (SELECT id FROM stories WHERE writer_id=$2)
       RETURNING id`,
      [id, writer.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('writer story comment delete', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
