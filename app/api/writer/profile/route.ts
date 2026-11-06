import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getWriter, createWriterSession } from '@/lib/writer-session';
import { ensureWriterSchema } from '@/lib/writer-schema';

export const runtime = 'nodejs';

export async function GET() {
  const writer = await getWriter();
  if (!writer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await ensureWriterSchema();
    const { rows } = await getPool().query(
      `SELECT id, name, email, bio, avatar_url, created_at FROM writer_users WHERE id=$1`,
      [writer.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ profile: rows[0] });
  } catch (e) {
    console.error('writer profile get', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const writer = await getWriter();
  if (!writer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await ensureWriterSchema();
    const fd = await req.formData();
    const name = String(fd.get('name') || '').trim();
    const bio = String(fd.get('bio') || '').trim().slice(0, 600);
    const avatarUrl = String(fd.get('avatar_url') || '').trim();

    if (!name || name.length > 80) {
      return NextResponse.json({ error: 'Your name is required (max 80 characters)' }, { status: 400 });
    }

    await getPool().query(
      `UPDATE writer_users SET name=$1, bio=$2, avatar_url=$3 WHERE id=$4`,
      [name, bio, avatarUrl, writer.id]
    );

    // Keep the JWT name in sync so the dashboard greeting updates.
    if (name !== writer.name) {
      await createWriterSession({ id: writer.id, name, email: writer.email });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('writer profile save', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
