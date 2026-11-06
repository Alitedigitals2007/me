import getPool from './db';

// Idempotent writer/story DDL. Runs at most once per process; also mirrored in db/schema.sql.
export const WRITER_DDL = `
CREATE TABLE IF NOT EXISTS writer_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by INT
);

ALTER TABLE writer_users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE writer_users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE writer_users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';
ALTER TABLE writer_users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE writer_users ADD COLUMN IF NOT EXISTS approved_by INT;

CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  writer_id INT NOT NULL REFERENCES writer_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  views INT NOT NULL DEFAULT 0,
  reading_minutes INT NOT NULL DEFAULT 1,
  like_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stories ADD COLUMN IF NOT EXISTS excerpt TEXT NOT NULL DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS cover_image TEXT NOT NULL DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS tags TEXT NOT NULL DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS views INT NOT NULL DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reading_minutes INT NOT NULL DEFAULT 1;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS story_activity (
  id SERIAL PRIMARY KEY,
  story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  writer_id INT NOT NULL REFERENCES writer_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_views (
  id SERIAL PRIMARY KEY,
  story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, ip_hash)
);

CREATE TABLE IF NOT EXISTS story_likes (
  id SERIAL PRIMARY KEY,
  story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, ip_hash)
);

CREATE TABLE IF NOT EXISTS story_comments (
  id SERIAL PRIMARY KEY,
  story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stories_writer_idx ON stories (writer_id);
CREATE INDEX IF NOT EXISTS stories_status_idx ON stories (status);
CREATE INDEX IF NOT EXISTS stories_slug_key ON stories (slug);
CREATE INDEX IF NOT EXISTS stories_category_idx ON stories (category);
CREATE INDEX IF NOT EXISTS stories_topic_idx ON stories (topic);
CREATE INDEX IF NOT EXISTS story_activity_story_idx ON story_activity (story_id);
CREATE INDEX IF NOT EXISTS story_activity_writer_idx ON story_activity (writer_id);
CREATE INDEX IF NOT EXISTS story_views_story_idx ON story_views (story_id);
CREATE INDEX IF NOT EXISTS story_likes_story_idx ON story_likes (story_id);
CREATE INDEX IF NOT EXISTS story_comments_story_idx ON story_comments (story_id);
`;

let ensured = false;

async function schemaReady(): Promise<boolean> {
  try {
    const { rows } = await getPool().query(
      `SELECT to_regclass('public.writer_users') IS NOT NULL AS writers,
              to_regclass('public.stories') IS NOT NULL AS stories,
              to_regclass('public.story_activity') IS NOT NULL AS activity,
              to_regclass('public.story_views') IS NOT NULL AS views,
              to_regclass('public.story_likes') IS NOT NULL AS likes,
              to_regclass('public.story_comments') IS NOT NULL AS comments`
    );
    if (!Object.values(rows[0]).every(Boolean)) return false;
    await getPool().query(`SELECT status, bio, avatar_url, approved_at, approved_by FROM writer_users LIMIT 0`);
    await getPool().query(`SELECT excerpt, content, cover_image, category, topic, tags, status, publish_at, published_at, views, reading_minutes, like_count, updated_at FROM stories LIMIT 0`);
    return true;
  } catch {
    return false;
  }
}

export async function ensureWriterSchema(): Promise<void> {
  if (ensured) return;
  try {
    const statements = WRITER_DDL.split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${s};`);
    for (const stmt of statements) {
      try {
        await getPool().query(stmt);
      } catch (e) {
        console.error('writer ddl statement failed:', (e as Error).message, '->', stmt.slice(0, 80));
      }
    }
    ensured = await schemaReady();
  } catch (e) {
    console.error('writer schema', e);
  }
}
