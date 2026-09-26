import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { createStudentSession } from '@/lib/student-session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!rateLimit(`signup:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  try {
    const { name, email, password } = await req.json();
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanName || cleanName.length > 80) return NextResponse.json({ error: 'Your name is required' }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    if (!password || String(password).length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    await ensureAcademySchema();
    const existing = await pool.query('SELECT id FROM students WHERE email=$1', [cleanEmail]);
    if (existing.rows.length) return NextResponse.json({ error: 'An account with this email already exists — log in instead.' }, { status: 409 });

    const hash = await bcrypt.hash(String(password), 10);
    const { rows } = await pool.query(
      `INSERT INTO students (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email`,
      [cleanName, cleanEmail, hash]
    );
    await createStudentSession({ id: rows[0].id, name: rows[0].name, email: rows[0].email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('student signup', e);
    return NextResponse.json({ error: 'Signup failed. Try again.' }, { status: 500 });
  }
}
