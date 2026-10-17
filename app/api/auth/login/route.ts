import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getPool from '@/lib/db';
import { createSession, destroySession } from '@/lib/session';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { createStudentSession, destroyStudentSession } from '@/lib/student-session';
import { ensureWriterSchema } from '@/lib/writer-schema';
import { createWriterSession, destroyWriterSession } from '@/lib/writer-session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const REDIRECTS = {
  admin: '/admin',
  student: '/dashboard',
  writer: '/writer/dashboard'
} as const;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`auth-login:${ip}`, 8, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  try {
    const { identifier, email, password } = await req.json();
    const id = String(identifier || email || '').trim();
    if (!id || !password) {
      return NextResponse.json({ error: 'Your email (or username) and password are required' }, { status: 400 });
    }

    const lower = id.toLowerCase();
    await Promise.all([ensureAcademySchema(), ensureWriterSchema()]);
    const pool = getPool();

    const [admins, students, writers] = await Promise.all([
      pool.query('SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1', [lower]),
      pool.query('SELECT * FROM students WHERE LOWER(email) = $1', [lower]),
      pool.query('SELECT * FROM writer_users WHERE LOWER(email) = $1', [lower])
    ]);

    for (const user of admins.rows) {
      if (!(await bcrypt.compare(String(password), user.password_hash))) continue;
      await Promise.all([destroyStudentSession(), destroyWriterSession()]);
      await createSession({ id: user.id, email: user.email, username: user.username, role: user.role });
      return NextResponse.json({ ok: true, role: 'admin', redirect: REDIRECTS.admin });
    }

    for (const student of students.rows) {
      if (!(await bcrypt.compare(String(password), student.password_hash))) continue;
      if (student.status !== 'active') {
        return NextResponse.json({ error: 'This account is disabled. Contact support.' }, { status: 403 });
      }
      await Promise.all([destroySession(), destroyWriterSession()]);
      await createStudentSession({ id: student.id, name: student.name, email: student.email });
      return NextResponse.json({ ok: true, role: 'student', redirect: REDIRECTS.student });
    }

    for (const writer of writers.rows) {
      if (!(await bcrypt.compare(String(password), writer.password_hash))) continue;
      if (writer.status === 'pending') {
        return NextResponse.json(
          { error: 'Your writer application is still pending approval.', pending: true, role: 'writer' },
          { status: 403 }
        );
      }
      if (writer.status !== 'approved') {
        return NextResponse.json({ error: 'This account is not active. Contact support.' }, { status: 403 });
      }
      await Promise.all([destroySession(), destroyStudentSession()]);
      await createWriterSession({ id: writer.id, name: writer.name, email: writer.email });
      return NextResponse.json({ ok: true, role: 'writer', redirect: REDIRECTS.writer });
    }

    return NextResponse.json({ error: 'Invalid credentials. Check your details and try again.' }, { status: 401 });
  } catch (e) {
    console.error('auth login', e);
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 });
  }
}
