import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import { getLesson, getEnrollment, isEnrollmentActive, lessonUnlocked, checkAndIssueCertificate } from '@/lib/academy';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  try {
    const { id } = await params;
    const lesson = await getLesson(Number(id));
    if (!lesson) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    const enrollment = await getEnrollment(student.id, lesson.course_id);
    if (!lessonUnlocked(lesson, isEnrollmentActive(enrollment))) {
      return NextResponse.json({ error: 'Enroll to unlock this lesson.' }, { status: 403 });
    }
    await pool.query(
      `INSERT INTO lesson_progress (student_id, lesson_id, course_id) VALUES ($1, $2, $3)
       ON CONFLICT (student_id, lesson_id) DO NOTHING`,
      [student.id, lesson.id, lesson.course_id]
    );
    const [{ rows: totalRows }, { rows: doneRows }] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS n FROM lessons WHERE course_id=$1', [lesson.course_id]),
      pool.query('SELECT COUNT(*)::int AS n FROM lesson_progress WHERE student_id=$1 AND course_id=$2', [student.id, lesson.course_id])
    ]);
    const total = totalRows[0]?.n ?? 0;
    const done = doneRows[0]?.n ?? 0;
    const certificate = await checkAndIssueCertificate(student.id, lesson.course_id);
    return NextResponse.json({ ok: true, pct: total ? Math.round((done / total) * 100) : 0, done, total, certificate });
  } catch (e) {
    console.error('lesson complete', e);
    return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 });
  }
}
