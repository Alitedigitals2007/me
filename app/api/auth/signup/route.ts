import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getPool from '@/lib/db';
import { destroySession } from '@/lib/session';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { createStudentSession } from '@/lib/student-session';
import { ensureWriterSchema } from '@/lib/writer-schema';
import { destroyWriterSession } from '@/lib/writer-session';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const REDIRECTS = {
  student: '/dashboard',
  writer: '/writer/dashboard'
} as const;

export async function POST(req: NextRequest) {
  if (!rateLimit(`auth-signup:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  try {
    const { role, name, email, password } = await req.json();
    if (role !== 'student' && role !== 'writer') {
      return NextResponse.json({ error: 'Choose whether you want to join as a student or a writer' }, { status: 400 });
    }

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanName || cleanName.length > 80) return NextResponse.json({ error: 'Your name is required' }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    if (!password || String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await Promise.all([ensureAcademySchema(), ensureWriterSchema()]);
    const pool = getPool();

    const [admins, students, writers] = await Promise.all([
      pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]),
      pool.query('SELECT id FROM students WHERE LOWER(email) = $1', [cleanEmail]),
      pool.query('SELECT id FROM writer_users WHERE LOWER(email) = $1', [cleanEmail])
    ]);
    if (admins.rows.length || students.rows.length || writers.rows.length) {
      return NextResponse.json({ error: 'An account with this email already exists — log in instead.' }, { status: 409 });
    }

    const hash = await bcrypt.hash(String(password), 10);

    if (role === 'student') {
      const { rows } = await pool.query(
        'INSERT INTO students (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [cleanName, cleanEmail, hash]
      );
      await Promise.all([destroySession(), destroyWriterSession()]);
      await createStudentSession({ id: rows[0].id, name: rows[0].name, email: rows[0].email });
      return NextResponse.json({ ok: true, role, redirect: REDIRECTS.student });
    }

    const { rows } = await pool.query(
      `INSERT INTO writer_users (name, email, password_hash, status) VALUES ($1, $2, $3, 'pending') RETURNING id, name, email`,
      [cleanName, cleanEmail, hash]
    );

    sendTelegram(
      `📝 <b>New writer application</b>\n` +
      `👤 ${rows[0].name} (${rows[0].email})\n` +
      `🔗 ${siteUrl()}/admin/writers`
    );

    return NextResponse.json({
      ok: true,
      role,
      pending: true,
      message: 'Application received! Your writer account is pending admin approval — you can log in once it is approved.'
    });
  } catch (e) {
    console.error('auth signup', e);
    return NextResponse.json({ error: 'Signup failed. Try again.' }, { status: 500 });
  }
}
