import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import LessonComplete from '@/components/academy/LessonComplete';
import pool from '@/lib/db';
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

  const [flat, curriculum, { rows: doneRows }] = await Promise.all([
    getAllLessons(course.id),
    getCurriculum(course.id),
    pool.query('SELECT lesson_id FROM lesson_progress WHERE student_id=$1 AND course_id=$2', [student.id, course.id])
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
