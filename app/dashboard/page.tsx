import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Reveal from '@/components/site/Reveal';
import AssignmentSubmit from '@/components/academy/AssignmentSubmit';
import LogoutButton from '@/components/academy/LogoutButton';
import pool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { getCourseProgress } from '@/lib/academy';

export const metadata: Metadata = { title: 'My dashboard · Academy' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const student = await getStudent();
  if (!student) redirect('/academy/login?next=/dashboard');
  await ensureAcademySchema();

  const { rows: enrollments } = await pool.query(
    `SELECT e.status, e.enrolled_at, e.completed_at, c.id AS course_id, c.title, c.slug, c.image_url, c.price
     FROM enrollments e JOIN courses c ON c.id=e.course_id
     WHERE e.student_id=$1 AND e.status IN ('active','completed')
     ORDER BY e.enrolled_at DESC`,
    [student.id]
  );

  const courseIds = enrollments.map((e) => e.course_id);
  const [assignmentsRes, certsRes, classesRes] = courseIds.length
    ? await Promise.all([
        pool.query(
          `SELECT a.id, a.title, a.instructions, a.due_at, a.max_score, c.title AS course_title, c.slug AS course_slug,
                  s.content AS sub_content, s.file_url AS sub_file, s.status AS sub_status, s.score, s.feedback, s.submitted_at
           FROM assignments a
           JOIN courses c ON c.id=a.course_id
           LEFT JOIN submissions s ON s.assignment_id=a.id AND s.student_id=$1
           WHERE a.course_id = ANY($2::int[])
           ORDER BY a.due_at ASC NULLS LAST, a.id ASC`,
          [student.id, courseIds]
        ),
        pool.query(
          `SELECT cert.code, cert.issued_at, c.title, c.slug
           FROM certificates cert JOIN courses c ON c.id=cert.course_id
           WHERE cert.student_id=$1 ORDER BY cert.issued_at DESC`,
          [student.id]
        ),
        pool.query(
          `SELECT cs.id, cs.title, cs.starts_at, cs.join_url, cs.recording_url, c.title AS course_title
           FROM class_sessions cs JOIN courses c ON c.id=cs.course_id
           WHERE cs.course_id = ANY($2::int[]) AND cs.starts_at >= now()
           ORDER BY cs.starts_at ASC LIMIT 10`,
          [student.id, courseIds]
        )
      ])
    : [
        { rows: [] as any[] },
        { rows: [] as any[] },
        { rows: [] as any[] }
      ];

  const progressByCourse: Record<number, { done: number; total: number; pct: number }> = {};
  for (const e of enrollments) {
    progressByCourse[e.course_id] = await getCourseProgress(student.id, e.course_id);
  }

  const pending = assignmentsRes.rows.filter((a) => !a.sub_status || a.sub_status === 'pending');
  const pendingSubs = assignmentsRes.rows.filter((a) => a.sub_status === 'pending' && a.submitted_at);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-accent">ALITE Academy</p>
          <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl mt-1 tracking-[-0.02em]">Hi, {student.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted mt-1">{student.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/academy" className="rounded-full ring-1 ring-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:ring-accent/50 transition-all">Browse courses</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
        <a href="#courses" className="rounded-full bg-accent/10 text-accent px-4 py-2.5">My courses ({enrollments.length})</a>
        <a href="#assignments" className="rounded-full bg-card ring-1 ring-line px-4 py-2.5">Assignments ({pending.length + pendingSubs.length})</a>
        <a href="#certificates" className="rounded-full bg-card ring-1 ring-line px-4 py-2.5">Certificates ({certsRes.rows.length})</a>
        <a href="#classes" className="rounded-full bg-card ring-1 ring-line px-4 py-2.5">Classes ({classesRes.rows.length})</a>
      </div>

      <section id="courses" className="mt-8">
        <h2 className="font-display font-bold uppercase text-xl mb-4">My courses</h2>
        {enrollments.length === 0 ? (
          <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">
            You are not enrolled in any course yet. <Link href="/academy" className="text-accent font-semibold">Browse the Academy →</Link>
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrollments.map((e) => {
              const p = progressByCourse[e.course_id] || { done: 0, total: 0, pct: 0 };
              return (
                <Link key={e.course_id} href={`/academy/${e.slug}`} className="group rounded-3xl bg-card ring-1 ring-line shadow-card overflow-hidden hover:ring-accent/40 transition-all">
                  {e.image_url && (
                    <div className="aspect-video bg-paper overflow-hidden">
                      <img src={e.image_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${e.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-accent/10 text-accent'}`}>
                        {e.status === 'completed' ? 'Completed' : 'Enrolled'}
                      </span>
                    </div>
                    <h3 className="font-display font-bold mt-2 group-hover:text-accent transition-colors">{e.title}</h3>
                    <div className="mt-3 h-2 rounded-full bg-ink/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent to-cyan-accent" style={{ width: `${p.pct}%` }} />
                    </div>
                    <p className="text-xs text-muted mt-1.5">{p.done}/{p.total} lessons · {p.pct}%</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section id="assignments" className="mt-12">
        <h2 className="font-display font-bold uppercase text-xl mb-4">Assignments</h2>
        {assignmentsRes.rows.length === 0 ? (
          <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">No assignments in your courses yet.</p>
        ) : (
          <div className="space-y-4">
            {assignmentsRes.rows.map((a) => (
              <Reveal key={a.id}>
                <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">{a.course_title}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      a.sub_status === 'graded' ? 'bg-emerald-500/10 text-emerald-600' : a.sub_status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-ink/5 text-muted'
                    }`}>
                      {a.sub_status === 'graded' ? 'Graded' : a.sub_status === 'pending' ? 'Submitted' : 'Not submitted'}
                    </span>
                    <span className="text-xs text-muted ml-auto">
                      {a.due_at ? `Due ${new Date(a.due_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'No deadline'} · max {a.max_score}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg mt-2">{a.title}</h3>
                  {a.instructions && <p className="text-sm text-muted mt-1 whitespace-pre-wrap break-words">{a.instructions}</p>}

                  {a.sub_status === 'graded' ? (
                    <div className="mt-4 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30 p-4">
                      <p className="font-bold text-emerald-700">Score: {a.score}/{a.max_score}</p>
                      {a.feedback && <p className="text-sm text-ink-soft mt-1 break-words whitespace-pre-wrap">Feedback: {a.feedback}</p>}
                    </div>
                  ) : a.sub_status === 'pending' ? (
                    <div className="mt-4 rounded-xl bg-paper ring-1 ring-line p-4">
                      <p className="text-sm font-semibold">Your submission:</p>
                      {a.sub_content && <p className="text-sm text-ink-soft mt-1 whitespace-pre-wrap break-words">{a.sub_content}</p>}
                      {a.sub_file && (
                        <a href={a.sub_file} target="_blank" rel="noopener noreferrer" className="text-sm text-accent font-semibold underline mt-1 inline-block">📎 Attached file</a>
                      )}
                      <p className="text-xs text-muted mt-2">Waiting for review — you can resubmit until it is graded.</p>
                      <AssignmentSubmit assignmentId={a.id} initialContent={a.sub_content || ''} initialFileUrl={a.sub_file || ''} />
                    </div>
                  ) : (
                    <AssignmentSubmit assignmentId={a.id} />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section id="certificates" className="mt-12">
        <h2 className="font-display font-bold uppercase text-xl mb-4">Certificates</h2>
        {certsRes.rows.length === 0 ? (
          <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">
            Complete a course (all lessons + assignments + quizzes) and your certificate appears here.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {certsRes.rows.map((c) => (
              <a key={c.code} href={`/certificates/${c.code}`} target="_blank" className="group rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-6 hover:ring-accent/40 transition-all block">
                <p className="text-xs font-black uppercase tracking-widest text-accent">Certificate of completion</p>
                <h3 className="font-display font-bold text-lg mt-1 group-hover:text-accent transition-colors">{c.title}</h3>
                <p className="text-xs text-muted mt-2">Issued {new Date(c.issued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} · {c.code}</p>
                <span className="inline-block text-sm font-semibold text-accent mt-3">View & print →</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section id="classes" className="mt-12">
        <h2 className="font-display font-bold uppercase text-xl mb-4">Upcoming live classes</h2>
        {classesRes.rows.length === 0 ? (
          <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">No live classes scheduled for your courses.</p>
        ) : (
          <div className="space-y-3">
            {classesRes.rows.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card ring-1 ring-line p-5 flex flex-wrap items-center gap-3">
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-xs text-muted mt-0.5">{s.course_title} · {new Date(s.starts_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  {s.join_url && (
                    <a href={s.join_url} target="_blank" rel="noopener noreferrer" className="bg-gradient-cta text-white text-sm font-semibold px-5 py-2.5 rounded-full">Join class</a>
                  )}
                  {s.recording_url && (
                    <a href={s.recording_url} target="_blank" rel="noopener noreferrer" className="ring-1 ring-line text-sm font-semibold px-5 py-2.5 rounded-full hover:ring-accent/50 transition-all">Recording</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
