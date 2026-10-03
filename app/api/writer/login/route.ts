import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getPool from '@/lib/db';
import { createWriterSession } from '@/lib/writer-session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!rateLimit(`writerlogin:${clientIp(req)}`, 5, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const { rows } = await getPool().query(
      'SELECT * FROM writer_users WHERE email = $1',
      [String(email).trim().toLowerCase()]
    );
    const writer = rows[0];
    if (!writer || !(await bcrypt.compare(String(password), writer.password_hash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (writer.status !== 'approved') {
      return NextResponse.json({ error: 'Your account is pending approval. You will be notified when approved.' }, { status: 403 });
    }
    await createWriterSession({ id: writer.id, name: writer.name, email: writer.email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('writer login', e);
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 });
  }
}
