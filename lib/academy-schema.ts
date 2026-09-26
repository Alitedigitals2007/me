import pool from './db';

// Idempotent academy DDL. Runs at most once per process; also mirrored in db/schema.sql.
export const ACADEMY_DDL = `
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS delivery TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration TEXT NOT NULL DEFAULT '';
UPDATE courses SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL OR slug = '';
UPDATE courses SET slug = slug || '-' || id WHERE slug IN (SELECT slug FROM courses WHERE slug IS NOT NULL AND slug <> '' GROUP BY slug HAVING COUNT(*) > 1);
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_key ON courses (slug);

CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  module_id INT REFERENCES modules(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  material_url TEXT NOT NULL DEFAULT '',
  material_name TEXT NOT NULL DEFAULT '',
  order_index INT NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  payment_ref TEXT NOT NULL DEFAULT '',
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  due_at TIMESTAMPTZ,
  max_score INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  score INT,
  feedback TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ,
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pass_pct INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_index INT NOT NULL DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_sessions (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  join_url TEXT NOT NULL DEFAULT '',
  recording_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);
`;

let ensured = false;

const CRITICAL_TABLES = [
  'students', 'modules', 'lessons', 'enrollments', 'lesson_progress', 'assignments',
  'submissions', 'quizzes', 'quiz_questions', 'quiz_attempts', 'class_sessions', 'certificates'
];

async function schemaReady(): Promise<boolean> {
  try {
    const tableChecks = CRITICAL_TABLES.map((t, i) => `to_regclass('public.${t}') IS NOT NULL AS t${i}`).join(', ');
    const { rows } = await pool.query(`SELECT ${tableChecks}`);
    if (!Object.values(rows[0]).every(Boolean)) return false;
    await pool.query(`SELECT slug, status, delivery, level, duration FROM courses LIMIT 0`);
    return true;
  } catch {
    return false;
  }
}

export async function ensureAcademySchema(): Promise<void> {
  if (ensured) return;
  try {
    const statements = ACADEMY_DDL.split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${s};`);
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (e) {
        console.error('academy ddl statement failed:', (e as Error).message, '->', stmt.slice(0, 80));
      }
    }
    ensured = await schemaReady();
  } catch (e) {
    console.error('academy schema', e);
  }
}
