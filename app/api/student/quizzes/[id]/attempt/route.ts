import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import { getEnrollment, isEnrollmentActive, checkAndIssueCertificate } from '@/lib/academy';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (!rateLimit(`quiz:${clientIp(req)}`, 15, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  try {
    const { id } = await params;
    const quizId = Number(id);
    const { rows: qRows } = await pool.query(
      'SELECT q.*, c.title AS course_title FROM quizzes q JOIN courses c ON c.id=q.course_id WHERE q.id=$1',
      [quizId]
    );
    if (!qRows.length) return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    const quiz = qRows[0];

    const enrollment = await getEnrollment(student.id, quiz.course_id);
    if (!isEnrollmentActive(enrollment)) return NextResponse.json({ error: 'Enroll in this course first.' }, { status: 403 });

    const { rows: questions } = await pool.query(
      'SELECT id, correct_index FROM quiz_questions WHERE quiz_id=$1 ORDER BY order_index ASC, id ASC',
      [quizId]
    );
    if (!questions.length) return NextResponse.json({ error: 'This quiz has no questions yet.' }, { status: 400 });

    const body = await req.json();
    const answers = (body.answers || {}) as Record<string, number>;
    const answered = questions.filter((q) => answers[String(q.id)] !== undefined);
    if (answered.length < questions.length) {
      return NextResponse.json({ error: `Answer all questions (${answered.length}/${questions.length} done).` }, { status: 400 });
    }
    const score = questions.filter((q) => Number(answers[String(q.id)]) === q.correct_index).length;
    const total = questions.length;
    const passed = Math.round((score / total) * 100) >= quiz.pass_pct;

    await pool.query(
      'INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, total, passed) VALUES ($1, $2, $3, $4, $5, $6)',
      [quizId, student.id, JSON.stringify(answers), score, total, passed]
    );

    await sendTelegram(
      `❓ <b>New quiz attempt</b>\nQuiz: ${quiz.title}\nCourse: ${quiz.course_title}\nStudent: ${student.name} (${student.email})\nScore: ${score}/${total} — ${passed ? 'PASSED ✅' : 'FAILED ⚠️'}\n🔗 ${siteUrl()}/admin/submissions`
    );

    const certificate = passed ? await checkAndIssueCertificate(student.id, quiz.course_id) : null;
    return NextResponse.json({ ok: true, score, total, passed, passPct: quiz.pass_pct, certificate });
  } catch (e) {
    console.error('quiz attempt', e);
    return NextResponse.json({ error: 'Could not submit quiz. Try again.' }, { status: 500 });
  }
}
