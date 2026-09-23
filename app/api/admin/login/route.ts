import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { createSession } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 5, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [String(email).trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await createSession({ id: user.id, email: user.email, username: user.username, role: user.role });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('admin login', e);
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 });
  }
}
