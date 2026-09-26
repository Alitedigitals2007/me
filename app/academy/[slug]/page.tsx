import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '@/components/site/Reveal';
import EnrollButton from '@/components/academy/EnrollButton';
import pool from '@/lib/db';
import { getStudent } from '@/lib/student-session';
import {
  getCourseBySlug,
  getCurriculum,
  getEnrollment,
  isEnrollmentActive,
  lessonUnlocked,
  coursePriceNumber,
  getCourseProgress
} from '@/lib/academy';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return { title: course ? `${course.title} · Academy` : 'Academy' };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const student = await getStudent();
  const [curriculum, enrollment] = await Promise.all([
    getCurriculum(course.id),
    student ? getEnrollment(student.id, course.id) : Promise.resolve(null)
  ]);
  const enrolled = isEnrollmentActive(enrollment);
  const price = coursePriceNumber(course.price);
  const external = course.delivery === 'external';

  const [{ rows: assignments }, { rows: quizzes }, { rows: sessions }] = await Promise.all([
    pool.query('SELECT id, title, due_at, max_score FROM assignments WHERE course_id=$1 ORDER BY id ASC', [course.id]),
    pool.query('SELECT id, title, pass_pct FROM quizzes WHERE course_id=$1 ORDER BY id ASC', [course.id]),
    pool.query('SELECT id, title, starts_at FROM class_sessions WHERE course_id=$1 AND starts_at >= now() ORDER BY starts_at ASC LIMIT 5', [course.id])
  ]);

  const lessonCount = curriculum.reduce((n, m) => n + m.lessons.length, 0);
  const progress = student && enrolled ? await getCourseProgress(student.id, course.id) : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${price > 0 ? 'bg-accent/10 text-accent' : 'bg-emerald-500/10 text-emerald-600'}`}>
                {price > 0 ? `₦${price.toLocaleString()}` : 'Free'}
              </span>
              {course.level && <span className="text-[11px] font-semibold uppercase tracking-wider text-muted ring-1 ring-line px-2.5 py-1 rounded-full">{course.level}</span>}
              {course.duration && <span className="text-[11px] font-semibold text-muted ring-1 ring-line px-2.5 py-1 rounded-full">{course.duration}</span>}
              <span className="text-[11px] font-semibold text-muted ring-1 ring-line px-2.5 py-1 rounded-full">{lessonCount} lessons</span>
            </div>
            <h1 className="font-display font-extrabold uppercase text-3xl md:text-5xl mt-4 leading-[1.02] tracking-[-0.02em]">{course.title}</h1>
            <p className="text-muted mt-3 max-w-2xl whitespace-pre-wrap">{course.description}</p>
            <div className="mt-6">
              {external ? (
                <a href={course.link || '#'} target="_blank" rel="noopener noreferrer" className="inline-block bg-gradient-cta text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all">
                  Take this course →
                </a>
              ) : enrolled ? (
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/dashboard" className="bg-gradient-cta text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all">
                    {progress && progress.pct > 0 ? `Continue — ${progress.pct}% done` : 'Go to dashboard'}
                  </Link>
                  {progress && (
                    <div className="w-44">
                      <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-accent to-cyan-accent" style={{ width: `${progress.pct}%` }} />
                      </div>
                      <p className="text-xs text-muted mt-1">{progress.done}/{progress.total} lessons complete</p>
                    </div>
                  )}
                </div>
              ) : (
                <EnrollButton courseId={course.id} loggedIn={!!student} price={price} loginNext={`/academy/${course.slug}`} />
              )}
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Reveal>
            <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
              <h2 className="font-display font-bold uppercase text-lg mb-4">Curriculum</h2>
              {lessonCount === 0 ? (
                <p className="text-muted text-sm">Curriculum is being uploaded — check back soon.</p>
              ) : (
                <div className="space-y-5">
                  {curriculum.map((m) => (
                    <div key={m.id}>
                      <p className="text-xs font-black uppercase tracking-widest text-accent mb-2">{m.title}</p>
                      <div className="space-y-2">
                        {m.lessons.map((l) => {
                          const unlocked = lessonUnlocked(l, enrolled);
                          return unlocked ? (
                            <Link
                              key={l.id}
                              href={`/academy/${course.slug}/learn/${l.id}`}
                              className="flex items-center gap-3 rounded-xl bg-paper ring-1 ring-line px-4 py-3 hover:ring-accent/50 transition-all group"
                            >
                              <span className="w-6 h-6 rounded-full bg-accent/10 text-accent grid place-items-center text-xs font-bold shrink-0">▶</span>
                              <span className="text-sm font-semibold group-hover:text-accent transition-colors">{l.title}</span>
                              {l.is_free_preview && !enrolled && (
                                <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Free preview</span>
                              )}
                            </Link>
                          ) : (
                            <div key={l.id} className="flex items-center gap-3 rounded-xl bg-paper/60 ring-1 ring-line px-4 py-3 opacity-70">
                              <span className="w-6 h-6 rounded-full bg-ink/10 text-muted grid place-items-center text-xs shrink-0">🔒</span>
                              <span className="text-sm font-semibold text-muted">{l.title}</span>
                              <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-muted">Locked</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {assignments.length > 0 && (
            <Reveal>
              <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
                <h2 className="font-display font-bold uppercase text-lg mb-4">Assignments</h2>
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl bg-paper ring-1 ring-line px-4 py-3">
                      <span className="text-sm font-semibold">{a.title}</span>
                      <span className="ml-auto text-xs text-muted">
                        {a.due_at ? `Due ${new Date(a.due_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : 'No deadline'} · max {a.max_score}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted mt-3">Submit assignments from your dashboard after enrolling.</p>
              </div>
            </Reveal>
          )}

          {quizzes.length > 0 && enrolled && (
            <Reveal>
              <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
                <h2 className="font-display font-bold uppercase text-lg mb-4">Quizzes</h2>
                <div className="space-y-2">
                  {quizzes.map((q) => (
                    <Link
                      key={q.id}
                      href={`/academy/${course.slug}/quiz/${q.id}`}
                      className="flex items-center gap-3 rounded-xl bg-paper ring-1 ring-line px-4 py-3 hover:ring-accent/50 transition-all"
                    >
                      <span className="text-sm font-semibold">{q.title}</span>
                      <span className="ml-auto text-xs text-muted">Pass mark {q.pass_pct}%</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        <div className="space-y-6">
          {sessions.length > 0 && (
            <Reveal>
              <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
                <h3 className="font-display font-bold uppercase text-base mb-3">Upcoming live classes</h3>
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.id} className="rounded-xl bg-paper ring-1 ring-line px-4 py-3">
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-xs text-muted mt-1">
                        {new Date(s.starts_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {!enrolled && <p className="text-[11px] text-accent mt-1 font-semibold">Join link after enrolling</p>}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {!external && !enrolled && (
            <Reveal>
              <div className="rounded-3xl bg-gradient-to-br from-accent to-accent-2 text-white p-6 shadow-lift">
                <p className="text-xs font-black uppercase tracking-widest text-white/70">{price > 0 ? 'Full access' : 'Free course'}</p>
                <p className="font-display font-extrabold text-3xl mt-1">{price > 0 ? `₦${price.toLocaleString()}` : 'Free'}</p>
                <ul className="text-sm text-white/85 space-y-1.5 mt-4">
                  <li>✓ All lessons + videos</li>
                  <li>✓ Assignments with grading</li>
                  <li>✓ Quizzes & live class links</li>
                  <li>✓ Certificate on completion</li>
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
