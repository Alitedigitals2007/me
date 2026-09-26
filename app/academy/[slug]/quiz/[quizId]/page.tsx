import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import QuizTaker from '@/components/academy/QuizTaker';
import pool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import { getCourseBySlug, getEnrollment, isEnrollmentActive } from '@/lib/academy';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Quiz · Academy' };
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string; quizId: string }> }) {
  const { slug, quizId } = await params;
  const student = await getStudent();
  if (!student) redirect(`/academy/login?next=${encodeURIComponent(`/academy/${slug}/quiz/${quizId}`)}`);

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const { rows: qRows } = await pool.query('SELECT * FROM quizzes WHERE id=$1 AND course_id=$2', [Number(quizId), course.id]);
  if (!qRows.length) notFound();
  const quiz = qRows[0];

  const enrollment = await getEnrollment(student.id, course.id);
  if (!isEnrollmentActive(enrollment)) redirect(`/academy/${slug}`);

  const { rows: questions } = await pool.query(
    'SELECT id, question, options FROM quiz_questions WHERE quiz_id=$1 ORDER BY order_index ASC, id ASC',
    [quiz.id]
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted mb-4">
        <Link href="/academy" className="hover:text-accent">Academy</Link>
        <span>/</span>
        <Link href={`/academy/${course.slug}`} className="hover:text-accent">{course.title}</Link>
        <span>/</span>
        <span className="text-ink">Quiz</span>
      </div>
      <h1 className="font-display font-extrabold uppercase text-2xl md:text-4xl tracking-[-0.01em] mb-2">{quiz.title}</h1>
      <p className="text-muted mb-8">
        {questions.length} questions · pass mark {quiz.pass_pct}% · you can retake it.
      </p>
      {questions.length === 0 ? (
        <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">This quiz has no questions yet.</p>
      ) : (
        <QuizTaker quizId={quiz.id} questions={questions} passPct={quiz.pass_pct} />
      )}
    </div>
  );
}
