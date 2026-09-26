import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import { getEnrollment, isEnrollmentActive } from '@/lib/academy';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (!rateLimit(`submit:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
  }
  try {
    const { id } = await params;
    const assignmentId = Number(id);
    const { rows: aRows } = await pool.query('SELECT a.*, c.title AS course_title FROM assignments a JOIN courses c ON c.id=a.course_id WHERE a.id=$1', [assignmentId]);
    if (!aRows.length) return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    const assignment = aRows[0];

    const enrollment = await getEnrollment(student.id, assignment.course_id);
    if (!isEnrollmentActive(enrollment)) return NextResponse.json({ error: 'Enroll in this course first.' }, { status: 403 });

    const body = await req.json();
    const content = String(body.content || '').trim();
    const fileUrl = String(body.file_url || '').trim();
    if (!content && !fileUrl) return NextResponse.json({ error: 'Add your answer or attach a file link.' }, { status: 400 });
    if (content.length > 20000) return NextResponse.json({ error: 'Answer is too long (max 20,000 characters).' }, { status: 400 });

    const { rows: existing } = await pool.query('SELECT id, status FROM submissions WHERE assignment_id=$1 AND student_id=$2', [assignmentId, student.id]);
    if (existing[0]?.status === 'graded') {
      return NextResponse.json({ error: 'This submission has already been graded.' }, { status: 409 });
    }
    if (existing[0]) {
      await pool.query('UPDATE submissions SET content=$1, file_url=$2, submitted_at=now() WHERE id=$3', [content, fileUrl, existing[0].id]);
    } else {
      await pool.query(
        'INSERT INTO submissions (assignment_id, student_id, content, file_url) VALUES ($1, $2, $3, $4)',
        [assignmentId, student.id, content, fileUrl]
      );
    }

    await sendTelegram(
      `📝 <b>New assignment submission</b>\nAssignment: ${assignment.title}\nCourse: ${assignment.course_title}\nStudent: ${student.name} (${student.email})` +
        (fileUrl ? `\n📎 ${fileUrl}` : '') +
        `\n🔗 ${siteUrl()}/admin/submissions`
    );
    return NextResponse.json({ ok: true, message: 'Submitted! You will see your grade here once it is reviewed.' });
  } catch (e) {
    console.error('assignment submit', e);
    return NextResponse.json({ error: 'Submission failed. Try again.' }, { status: 500 });
  }
}
