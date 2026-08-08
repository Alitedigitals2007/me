import pool from './db';
import type {
  Project, EducationItem, RoleItem, Course, BlogPost, Listing, AdSlot, AdPackage, AdSubmission, Message, SocialAccount
} from './types';

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const { rows } = await pool.query(
    'SELECT * FROM projects ORDER BY featured DESC, order_index ASC, created_at DESC LIMIT $1',
    [limit]
  );
  return rows;
}

export async function getAllProjects(): Promise<Project[]> {
  const { rows } = await pool.query('SELECT * FROM projects ORDER BY order_index ASC, created_at DESC');
  return rows;
}

export async function getProject(slug: string): Promise<Project | null> {
  const { rows } = await pool.query('SELECT * FROM projects WHERE slug=$1', [slug]);
  return rows[0] ?? null;
}

export async function getEducation(): Promise<EducationItem[]> {
  const { rows } = await pool.query('SELECT * FROM education ORDER BY order_index ASC');
  return rows;
}

export async function getRoles(): Promise<RoleItem[]> {
  const { rows } = await pool.query('SELECT * FROM roles ORDER BY order_index ASC');
  return rows;
}

export async function getCourses(): Promise<Course[]> {
  const { rows } = await pool.query('SELECT * FROM courses ORDER BY order_index ASC');
  return rows;
}

export async function getPublishedPosts(tag?: string): Promise<BlogPost[]> {
  const { rows } = await pool.query(
    `SELECT bp.*, COALESCE(bc.comment_count, 0) as comment_count
     FROM blog_posts bp
     LEFT JOIN (
       SELECT post_id, COUNT(*) as comment_count
       FROM blog_comments
       WHERE is_approved = true
       GROUP BY post_id
     ) bc ON bc.post_id = bp.id
     WHERE bp.status='published' ORDER BY bp.publish_at DESC`
  );
  const filtered = tag ? rows.filter((p) => p.tags.toLowerCase().includes(tag.toLowerCase())) : rows;
  return filtered;
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const { rows } = await pool.query(
    `SELECT bp.*, COALESCE(bc.comment_count, 0) as comment_count
     FROM blog_posts bp
     LEFT JOIN (
       SELECT post_id, COUNT(*) as comment_count
       FROM blog_comments
       WHERE is_approved = true
       GROUP BY post_id
     ) bc ON bc.post_id = bp.id
     WHERE bp.slug=$1 AND bp.status='published'`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getRelatedPosts(excludeId: number, limit = 3): Promise<BlogPost[]> {
  const { rows } = await pool.query(
    `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.cover_image, bp.tags, bp.publish_at, bp.like_count, COALESCE(bc.comment_count, 0) as comment_count
     FROM blog_posts bp
     LEFT JOIN (
       SELECT post_id, COUNT(*) as comment_count
       FROM blog_comments
       WHERE is_approved = true
       GROUP BY post_id
     ) bc ON bc.post_id = bp.id
     WHERE bp.status='published' AND bp.id != $1 ORDER BY bp.publish_at DESC LIMIT $2`,
    [excludeId, limit]
  );
  return rows;
}

export async function getActiveListings(): Promise<Listing[]> {
  const { rows } = await pool.query(
    "SELECT * FROM marketplace_listings WHERE status='active' ORDER BY is_own DESC, created_at DESC"
  );
  return rows;
}

export async function getActiveSlots(): Promise<AdSlot[]> {
  const { rows } = await pool.query('SELECT * FROM ad_slots WHERE is_active = true ORDER BY id ASC');
  return rows;
}

export async function getAdQueue(): Promise<(AdSubmission & { slot_name: string })[]> {
  const { rows } = await pool.query(
    `SELECT a.*, s.name AS slot_name FROM ad_submissions a JOIN ad_slots s ON s.id=a.slot_id ORDER BY a.created_at DESC`
  );
  return rows;
}

export async function getMessages(): Promise<Message[]> {
  const { rows } = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return rows;
}

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  const { rows } = await pool.query(
    'SELECT * FROM social_accounts WHERE is_active = true ORDER BY order_index ASC, id ASC'
  );
  return rows;
}

export async function getAdPackages(): Promise<AdPackage[]> {
  const { rows } = await pool.query('SELECT * FROM ad_packages WHERE is_active = true ORDER BY id ASC');
  return rows;
}

export async function getListings(): Promise<Listing[]> {
  const { rows } = await pool.query('SELECT * FROM marketplace_listings ORDER BY created_at DESC');
  return rows;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const { rows } = await pool.query('SELECT * FROM blog_posts ORDER BY COALESCE(publish_at, created_at) DESC');
  return rows;
}

export async function getSettingsValue(key: string): Promise<string> {
  const { rows } = await pool.query('SELECT value FROM settings WHERE key=$1', [key]);
  return rows[0]?.value ?? '';
}
