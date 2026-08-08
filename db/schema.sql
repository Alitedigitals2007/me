-- Alite Platform schema (PostgreSQL / Neon)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate pre-existing users tables from older alite layouts
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS session (
  sid TEXT PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  stack TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  live_url TEXT NOT NULL DEFAULT '',
  repo_url TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT false,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate legacy projects table (old alite layout: link/is_featured/gallery_images)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stack TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_url TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN;
UPDATE projects SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL OR slug = '';
UPDATE projects SET featured = true WHERE is_featured = true AND featured = false;
UPDATE projects SET live_url = link WHERE (live_url = '' OR live_url IS NULL) AND link IS NOT NULL;
UPDATE projects SET stack = 'legacy' WHERE stack = '';
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_key ON projects (slug);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gallery_images TEXT NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS education (
  id SERIAL PRIMARY KEY,
  institution TEXT NOT NULL,
  program TEXT NOT NULL,
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  order_index INT NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'education'
);

ALTER TABLE education ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'education';

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  org TEXT NOT NULL,
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_own_product BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT NOT NULL DEFAULT '',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  publish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  like_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS blog_likes (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, ip_hash)
);

CREATE TABLE IF NOT EXISTS blog_comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_likes_post_idx ON blog_likes (post_id);
CREATE INDEX IF NOT EXISTS blog_comments_post_idx ON blog_comments (post_id);

CREATE TABLE IF NOT EXISTS ad_slots (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT UNIQUE NOT NULL,
  price_per_day NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_active INT NOT NULL DEFAULT 1,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ad_packages (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  mediums TEXT NOT NULL DEFAULT '',
  daily_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  bundle_3_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ad_submissions (
  id SERIAL PRIMARY KEY,
  slot_id INT REFERENCES ad_slots(id),
  package_id INT REFERENCES ad_packages(id),
  mediums TEXT NOT NULL DEFAULT '',
  advertiser_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  target_url TEXT NOT NULL DEFAULT '',
  duration_days INT NOT NULL DEFAULT 7,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE + 7,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  paystack_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending_payment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  is_own BOOLEAN NOT NULL DEFAULT true,
  owner_name TEXT NOT NULL DEFAULT '',
  owner_contact TEXT NOT NULL DEFAULT '',
  listing_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  fee_paid BOOLEAN NOT NULL DEFAULT true,
  paystack_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  delivery_type TEXT NOT NULL DEFAULT 'link',
  file_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id SERIAL PRIMARY KEY,
  listing_id INT NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  paystack_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_purchases_listing_idx ON marketplace_purchases (listing_id);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate marketplace listings (categories + external links, admin-managed)
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS link TEXT NOT NULL DEFAULT '';
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'link';
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS file_id UUID;

-- Migrate ad submissions (package-based pricing, slot optional)
ALTER TABLE ad_submissions ADD COLUMN IF NOT EXISTS package_id INT;
ALTER TABLE ad_submissions ADD COLUMN IF NOT EXISTS mediums TEXT NOT NULL DEFAULT '';
ALTER TABLE ad_submissions ALTER COLUMN slot_id DROP NOT NULL;

-- Migrate blog posts (likes + comments)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS blog_likes (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, ip_hash)
);

CREATE TABLE IF NOT EXISTS blog_comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_likes_post_idx ON blog_likes (post_id);
CREATE INDEX IF NOT EXISTS blog_comments_post_idx ON blog_comments (post_id);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id SERIAL PRIMARY KEY,
  ad_id INT NOT NULL REFERENCES ad_submissions(id),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image/jpeg',
  data BYTEA NOT NULL,
  folder TEXT NOT NULL DEFAULT 'general',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uploaded_images_folder_idx ON uploaded_images (folder);
