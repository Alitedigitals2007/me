import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import LessonComplete from '@/components/academy/LessonComplete';
import AssignmentSubmit from '@/components/academy/AssignmentSubmit';
import getPool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import { getCourseBySlug, getLesson, getAllLessons, getCurriculum, getEnrollment, isEnrollmentActive, lessonUnlocked, embedVideoUrl } from '@/lib/academy';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lessonId: string }> }): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getLesson(Number(lessonId));
  return { title: lesson ? `${lesson.title} · Academy` : 'Lesson · Academy' };
}

function materialHref(url: string): string {
  if (/\.pdf($|\?)/i.test(url) && !url.includes('docs.google.com')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const student = await getStudent();
  if (!student) redirect(`/academy/login?next=${encodeURIComponent(`/academy/${slug}/learn/${lessonId}`)}`);

  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const lesson = await getLesson(Number(lessonId));
  if (!lesson || lesson.course_id !== course.id) notFound();

  const enrollment = await getEnrollment(student.id, course.id);
  const enrolled = isEnrollmentActive(enrollment);
  if (!lessonUnlocked(lesson, enrolled)) redirect(`/academy/${slug}`);

  const [flat, curriculum, { rows: doneRows }, { rows: lessonAssignments }, { rows: lessonQuizzes }] = await Promise.all([
    getAllLessons(course.id),
    getCurriculum(course.id),
    getPool().query('SELECT lesson_id FROM lesson_progress WHERE student_id=$1 AND course_id=$2', [student.id, course.id]),
    getPool().query(
      `SELECT a.id, a.title, a.instructions, a.due_at, a.max_score,
              s.content AS sub_content, s.file_url AS sub_file, s.status AS sub_status,
              s.score, s.feedback, s.submitted_at
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id=a.id AND s.student_id=$1
       WHERE a.lesson_id=$2 AND a.course_id=$3
       ORDER BY a.id ASC`,
      [student.id, lesson.id, course.id]
    ),
    getPool().query(
      `SELECT q.id, q.title, q.pass_pct, q.is_final_exam,
              a.score, a.total, a.passed, a.attempted_at
       FROM quizzes q
       LEFT JOIN LATERAL (
         SELECT score, total, passed, attempted_at FROM quiz_attempts
         WHERE quiz_id=q.id AND student_id=$1 ORDER BY id DESC LIMIT 1
       ) a ON true
       WHERE q.lesson_id=$2 AND q.course_id=$3
       ORDER BY q.id ASC`,
      [student.id, lesson.id, course.id]
    )
  ]);
  const doneSet = new Set(doneRows.map((r) => r.lesson_id));
  const idx = flat.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  const video = embedVideoUrl(lesson.video_url);
  const directVideo = /\.(mp4|webm|m3u8)($|\?)/i.test(lesson.video_url);
  const paragraphs = lesson.content ? lesson.content.split(/\n{2,}/) : [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted mb-6">
        <Link href="/academy" className="hover:text-accent">Academy</Link>
        <span>/</span>
        <Link href={`/academy/${course.slug}`} className="hover:text-accent">{course.title}</Link>
        <span>/</span>
        <span className="text-ink">Lesson {idx + 1}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-card ring-1 ring-line shadow-card overflow-hidden">
            {video && (
              <div className="aspect-video bg-ink">
                {directVideo ? (
                  <video src={lesson.video_url} controls controlsList="nodownload noremoteplayback" className="w-full h-full" />
                ) : (
                  <iframe
                    src={video}
                    title={lesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )}
              </div>
            )}
            <div className="p-6 md:p-8">
              <h1 className="font-display font-extrabold uppercase text-2xl md:text-3xl tracking-[-0.01em]">{lesson.title}</h1>
              {paragraphs.length > 0 ? (
                <div className="mt-4 space-y-4 text-ink-soft leading-relaxed">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="whitespace-pre-wrap break-words">{p}</p>
                  ))}
                </div>
              ) : (
                !video && !lesson.material_url && <p className="text-muted mt-4">This lesson has no written content yet.</p>
              )}

              {lesson.material_url && (
                <a
                  href={materialHref(lesson.material_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 rounded-full bg-paper ring-1 ring-line px-5 py-3 text-sm font-semibold hover:ring-accent/50 transition-all"
                >
                  📄 {lesson.material_name || 'Open course material'} <span className="text-muted font-normal">(opens in browser)</span>
                </a>
              )}
            </div>
          </div>

          <LessonComplete lessonId={lesson.id} initiallyDone={doneSet.has(lesson.id)} />

          {enrolled && (lessonAssignments.length > 0 || lessonQuizzes.length > 0) && (
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-accent">Lesson assignment &amp; test</p>

              {lessonAssignments.map((a) => (
                <div key={`assignment-${a.id}`} className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full">Assignment</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      a.sub_status === 'graded' ? 'bg-emerald-500/10 text-emerald-600' : a.sub_status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-ink/5 text-muted'
                    }`}>
                      {a.sub_status === 'graded' ? 'Graded' : a.sub_status === 'pending' ? 'Submitted' : 'Not submitted'}
                    </span>
                    <span className="text-xs text-muted ml-auto">
                      {a.due_at ? `Due ${new Date(a.due_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'No deadline'} · max {a.max_score}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-lg mt-2">{a.title}</h2>
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
                      <p className="text-xs text-muted mt-2">Waiting for review — you can resubmit until it is graded. Every attempt is saved.</p>
                      <AssignmentSubmit assignmentId={a.id} initialContent={a.sub_content || ''} initialFileUrl={a.sub_file || ''} />
                    </div>
                  ) : (
                    <AssignmentSubmit assignmentId={a.id} />
                  )}
                </div>
              ))}

              {lessonQuizzes.map((q) => (
                <div key={`quiz-${q.id}`} className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                      {q.is_final_exam ? 'Final exam' : 'Test'}
                    </span>
                    {q.passed !== null && q.passed !== undefined && (
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${q.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {q.passed ? 'Passed' : 'Retry'}
                      </span>
                    )}
                    <span className="text-xs text-muted ml-auto">Pass mark {q.pass_pct}%</span>
                  </div>
                  <h2 className="font-display font-bold text-lg mt-2">{q.title}</h2>
                  {q.attempted_at ? (
                    <p className="text-sm text-muted mt-1">
                      Last attempt: {q.score}/{q.total} ({q.total ? Math.round((q.score / q.total) * 100) : 0}%) · {new Date(q.attempted_at).toLocaleDateString('en-GB')}
                    </p>
                  ) : (
                    <p className="text-sm text-muted mt-1">You have not taken this test yet.</p>
                  )}
                  <Link
                    href={`/academy/${course.slug}/quiz/${q.id}`}
                    className="inline-block mt-4 bg-gradient-cta text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-all"
                  >
                    {q.attempted_at ? 'Retake test' : 'Take test'} →
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {prev ? (
              <Link href={`/academy/${course.slug}/learn/${prev.id}`} className="rounded-full bg-card ring-1 ring-line px-5 py-2.5 text-sm font-semibold hover:ring-accent/50 transition-all">
                ← {prev.title}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/academy/${course.slug}/learn/${next.id}`} className="rounded-full bg-card ring-1 ring-line px-5 py-2.5 text-sm font-semibold hover:ring-accent/50 transition-all text-right">
                {next.title} →
              </Link>
            ) : (
              <Link href="/dashboard" className="rounded-full bg-gradient-cta text-white px-5 py-2.5 text-sm font-semibold">
                Back to dashboard
              </Link>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-accent">Curriculum</p>
              <p className="text-xs text-muted">{doneSet.size}/{flat.length}</p>
            </div>
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-accent to-cyan-accent transition-all"
                style={{ width: `${flat.length ? Math.round((doneSet.size / flat.length) * 100) : 0}%` }}
              />
            </div>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {curriculum.map((m) => (
                <div key={m.id}>
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted mb-1.5">{m.title}</p>
                  <div className="space-y-1">
                    {m.lessons.map((l) => {
                      const current = l.id === lesson.id;
                      const isDone = doneSet.has(l.id);
                      return (
                        <Link
                          key={l.id}
                          href={`/academy/${course.slug}/learn/${l.id}`}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                            current ? 'bg-accent text-white' : isDone ? 'text-emerald-600 hover:bg-ink/5' : 'text-ink-soft hover:bg-ink/5'
                          }`}
                        >
                          <span>{isDone ? '✓' : current ? '▶' : '○'}</span>
                          <span className="truncate">{l.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
