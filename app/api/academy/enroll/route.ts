import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { initializePayment, makeReference, hasPaystackKeys } from '@/lib/paystack';
import { getSettings } from '@/lib/settings';
import { coursePriceNumber, getEnrollment, isEnrollmentActive } from '@/lib/academy';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: 'Please log in or create an account first.' }, { status: 401 });
  if (!rateLimit(`enroll:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  try {
    const { course_id } = await req.json();
    await ensureAcademySchema();
    const { rows } = await pool.query(
      `SELECT id, title, slug, price, delivery, status FROM courses WHERE id=$1 AND status='published'`,
      [course_id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    const course = rows[0];
    if (course.delivery === 'external') {
      return NextResponse.json({ error: 'This course is hosted externally.' }, { status: 400 });
    }

    const existing = await getEnrollment(student.id, course.id);
    if (isEnrollmentActive(existing)) return NextResponse.json({ url: `/dashboard` });

    const price = coursePriceNumber(course.price);
    if (price === 0) {
      await pool.query(
        `INSERT INTO enrollments (student_id, course_id, status) VALUES ($1, $2, 'active')
         ON CONFLICT (student_id, course_id) DO UPDATE SET status='active'`,
        [student.id, course.id]
      );
      await sendTelegram(`🎓 <b>New free enrollment</b>\nCourse: ${course.title}\nStudent: ${student.name} (${student.email})\n🔗 ${siteUrl()}/admin/academy`);
      return NextResponse.json({ url: `/dashboard` });
    }

    const ref = makeReference('course');
    await pool.query(
      `INSERT INTO enrollments (student_id, course_id, status, payment_ref, amount_paid)
       VALUES ($1, $2, 'pending', $3, $4)
       ON CONFLICT (student_id, course_id)
       DO UPDATE SET payment_ref=$3, amount_paid=$4, status='pending'`,
      [student.id, course.id, ref, price]
    );

    if (!hasPaystackKeys()) {
      await pool.query(`UPDATE enrollments SET status='active' WHERE student_id=$1 AND course_id=$2`, [student.id, course.id]);
      return NextResponse.json({ url: `/dashboard` });
    }

    const settings = await getSettings();
    const base = (process.env.SITE_URL || settings.contact_email || 'http://localhost:3000').replace(/\/$/, '');
    const url = await initializePayment({
      email: student.email,
      amountKobo: Math.round(price * 100),
      reference: ref,
      metadata: { type: 'course', course_id: course.id, student_id: student.id, title: course.title },
      callbackUrl: `${base}/thanks?ref=${ref}&type=course`
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error('academy enroll', e);
    return NextResponse.json({ error: 'Could not start enrollment. Please try again.' }, { status: 500 });
  }
}
