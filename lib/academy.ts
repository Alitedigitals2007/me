import crypto from 'crypto';
import pool from './db';
import { ensureAcademySchema } from './academy-schema';

export interface AcademyCourse {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: string;
  image_url: string;
  status: string;
  delivery: string;
  level: string;
  duration: string;
  link: string;
  order_index: number;
}

export interface Lesson {
  id: number;
  module_id: number | null;
  course_id: number;
  title: string;
  content: string;
  video_url: string;
  material_url: string;
  material_name: string;
  order_index: number;
  is_free_preview: boolean;
}

export async function getPublishedCourses(): Promise<AcademyCourse[]> {
  await ensureAcademySchema();
  const { rows } = await pool.query(
    `SELECT id, title, slug, description, price, image_url, status, delivery, level, duration, link, order_index
     FROM courses WHERE status='published' ORDER BY order_index ASC, id ASC`
  );
  return rows;
}

export async function getCourseBySlug(slug: string): Promise<AcademyCourse | null> {
  await ensureAcademySchema();
  const { rows } = await pool.query(
    `SELECT id, title, slug, description, price, image_url, status, delivery, level, duration, link, order_index
     FROM courses WHERE slug=$1 AND status='published'`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getCourseById(id: number): Promise<AcademyCourse | null> {
  await ensureAcademySchema();
  const { rows } = await pool.query('SELECT * FROM courses WHERE id=$1', [id]);
  return rows[0] ?? null;
}

export async function getCurriculum(courseId: number): Promise<{ id: number; title: string; lessons: Lesson[] }[]> {
  await ensureAcademySchema();
  const [mods, lessons] = await Promise.all([
    pool.query('SELECT id, title FROM modules WHERE course_id=$1 ORDER BY order_index ASC, id ASC', [courseId]),
    pool.query('SELECT * FROM lessons WHERE course_id=$1 ORDER BY order_index ASC, id ASC', [courseId])
  ]);
  return mods.rows.map((m) => ({
    ...m,
    lessons: lessons.rows.filter((l) => l.module_id === m.id)
  }));
}

export async function getAllLessons(courseId: number): Promise<Lesson[]> {
  await ensureAcademySchema();
  const { rows } = await pool.query('SELECT * FROM lessons WHERE course_id=$1 ORDER BY order_index ASC, id ASC', [courseId]);
  return rows;
}

export async function getLesson(lessonId: number): Promise<Lesson | null> {
  await ensureAcademySchema();
  const { rows } = await pool.query('SELECT * FROM lessons WHERE id=$1', [lessonId]);
  return rows[0] ?? null;
}

export async function getEnrollment(studentId: number, courseId: number) {
  await ensureAcademySchema();
  const { rows } = await pool.query(
    'SELECT * FROM enrollments WHERE student_id=$1 AND course_id=$2',
    [studentId, courseId]
  );
  return rows[0] ?? null;
}

export async function getCourseProgress(studentId: number, courseId: number) {
  await ensureAcademySchema();
  const [{ rows: totalRows }, { rows: doneRows }] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS n FROM lessons WHERE course_id=$1', [courseId]),
    pool.query('SELECT COUNT(*)::int AS n FROM lesson_progress WHERE student_id=$1 AND course_id=$2', [studentId, courseId])
  ]);
  const total = totalRows[0]?.n ?? 0;
  const done = doneRows[0]?.n ?? 0;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function coursePriceNumber(price: string | number): number {
  const n = Number(price);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function isEnrollmentActive(e: { status: string } | null): boolean {
  return !!e && (e.status === 'active' || e.status === 'completed');
}

export function lessonUnlocked(lesson: Lesson, enrolled: boolean): boolean {
  return enrolled || lesson.is_free_preview;
}

// Certificate: all lessons done AND (no assignments OR all graded with >= 60%)
// AND (no quizzes OR latest attempt passed).
export async function checkAndIssueCertificate(studentId: number, courseId: number): Promise<string | null> {
  await ensureAcademySchema();
  const progress = await getCourseProgress(studentId, courseId);
  if (progress.total === 0 || progress.done < progress.total) return null;

  const { rows: assigns } = await pool.query('SELECT id, max_score FROM assignments WHERE course_id=$1', [courseId]);
  if (assigns.length) {
    const { rows: subs } = await pool.query(
      `SELECT s.assignment_id, s.score FROM submissions s
       WHERE s.student_id=$1 AND s.assignment_id = ANY($2::int[]) AND s.status='graded'`,
      [studentId, assigns.map((a) => a.id)]
    );
    const ok = assigns.every((a) => {
      const s = subs.find((x) => x.assignment_id === a.id);
      return s && s.score !== null && s.score >= Math.ceil(a.max_score * 0.6);
    });
    if (!ok) return null;
  }

  const { rows: quizzes } = await pool.query('SELECT id FROM quizzes WHERE course_id=$1', [courseId]);
  if (quizzes.length) {
    for (const q of quizzes) {
      const { rows: attempts } = await pool.query(
        'SELECT passed FROM quiz_attempts WHERE quiz_id=$1 AND student_id=$2 ORDER BY id DESC LIMIT 1',
        [q.id, studentId]
      );
      if (!attempts[0]?.passed) return null;
    }
  }

  const existing = await pool.query('SELECT code FROM certificates WHERE student_id=$1 AND course_id=$2', [studentId, courseId]);
  if (existing.rows[0]) return existing.rows[0].code;

  const code = `ALITE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  await pool.query(
    `INSERT INTO certificates (student_id, course_id, code) VALUES ($1, $2, $3)
     ON CONFLICT (student_id, course_id) DO NOTHING`,
    [studentId, courseId, code]
  );
  await pool.query(`UPDATE enrollments SET status='completed', completed_at=now() WHERE student_id=$1 AND course_id=$2 AND status='active'`, [
    studentId,
    courseId
  ]);
  return code;
}

export function embedVideoUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}`;
      return `https://www.youtube.com/embed${u.pathname.replace('/watch', '')}`;
    }
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}`;
    }
    if (u.hostname.includes('drive.google.com')) {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  } catch {
    return url;
  }
}
