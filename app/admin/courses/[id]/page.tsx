import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import CourseStudio from '@/components/academy/CourseStudio';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { ensureAcademySchema } from '@/lib/academy-schema';

export const metadata = { title: 'Course studio' };
export const dynamic = 'force-dynamic';

export default async function CourseStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) notFound();
  const { id } = await params;
  await ensureAcademySchema();

  const { rows: cRows } = await pool.query('SELECT * FROM courses WHERE id=$1', [Number(id)]);
  if (!cRows.length) notFound();
  const course = cRows[0];

  const [{ rows: modRows }, { rows: lessonRows }, { rows: assignments }, { rows: quizzes }, { rows: qnRows }, { rows: sessions }] =
    await Promise.all([
      pool.query('SELECT * FROM modules WHERE course_id=$1 ORDER BY order_index ASC, id ASC', [course.id]),
      pool.query('SELECT * FROM lessons WHERE course_id=$1 ORDER BY order_index ASC, id ASC', [course.id]),
      pool.query('SELECT * FROM assignments WHERE course_id=$1 ORDER BY id ASC', [course.id]),
      pool.query('SELECT * FROM quizzes WHERE course_id=$1 ORDER BY id ASC', [course.id]),
      pool.query(
        `SELECT qn.* FROM quiz_questions qn JOIN quizzes q ON q.id=qn.quiz_id WHERE q.course_id=$1 ORDER BY qn.order_index ASC, qn.id ASC`,
        [course.id]
      ),
      pool.query('SELECT * FROM class_sessions WHERE course_id=$1 ORDER BY starts_at ASC', [course.id])
    ]);

  const modules = modRows.map((m) => ({ ...m, lessons: lessonRows.filter((l) => l.module_id === m.id) }));
  const orphans = lessonRows.filter((l) => l.module_id === null);
  if (orphans.length) modules.push({ id: -1, title: 'Ungrouped lessons', order_index: 9999, lessons: orphans });

  const quizData = quizzes.map((q) => ({ ...q, questions: qnRows.filter((qn) => qn.quiz_id === q.id) }));

  return (
    <div className="space-y-6">
      <AdminHeader title="Course studio" sub={course.title}>
        <div className="flex gap-2">
          <Link href="/admin/academy" className="px-4 py-2 rounded-full text-xs font-semibold bg-paper ring-1 ring-line hover:ring-accent/50">← All courses</Link>
          <Link href={`/academy/${course.slug}`} target="_blank" className="px-4 py-2 rounded-full text-xs font-semibold bg-paper ring-1 ring-line hover:ring-accent/50">View public page ↗</Link>
        </div>
      </AdminHeader>
      <CourseStudio
        course={course}
        modules={modules}
        assignments={assignments}
        quizzes={quizData}
        sessions={sessions}
      />
    </div>
  );
}
