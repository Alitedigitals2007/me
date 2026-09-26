import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { createStudentSession } from '@/lib/student-session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!rateLimit(`student-login:${clientIp(req)}`, 8, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });

    await ensureAcademySchema();
    const { rows } = await pool.query('SELECT * FROM students WHERE email=$1', [String(email).trim().toLowerCase()]);
    const student = rows[0];
    if (!student || !(await bcrypt.compare(String(password), student.password_hash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (student.status !== 'active') {
      return NextResponse.json({ error: 'This account is disabled. Contact support.' }, { status: 403 });
    }
    await createStudentSession({ id: student.id, name: student.name, email: student.email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('student login', e);
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 });
  }
}
