import getPool from './db';
import type {
  Project, EducationItem, RoleItem, Course, BlogPost, Listing, AdSlot, AdPackage, AdSubmission, Message, SocialAccount, Story, WriterUser
} from './types';

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  try {
    const { rows } = await getPool().query(
      'SELECT * FROM projects ORDER BY featured DESC, order_index ASC, created_at DESC LIMIT $1',
      [limit]
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM projects ORDER BY order_index ASC, created_at DESC');
    return rows;
  } catch {
    return [];
  }
}

export async function getProject(slug: string): Promise<Project | null> {
  try {
    const { rows } = await getPool().query('SELECT * FROM projects WHERE slug=$1', [slug]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getEducation(): Promise<EducationItem[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM education ORDER BY order_index ASC');
    return rows;
  } catch {
    return [];
  }
}

export async function getRoles(): Promise<RoleItem[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM roles ORDER BY order_index ASC');
    return rows;
  } catch {
    return [];
  }
}

export async function getCourses(): Promise<Course[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM courses ORDER BY order_index ASC');
    return rows;
  } catch {
    return [];
  }
}

export async function getPublishedPosts(tag?: string): Promise<BlogPost[]> {
  try {
    const { rows } = await getPool().query(
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
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const { rows } = await getPool().query(
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
  } catch {
    return null;
  }
}

export async function getRelatedPosts(excludeId: number, limit = 3): Promise<BlogPost[]> {
  try {
    const { rows } = await getPool().query(
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
  } catch {
    return [];
  }
}

export async function getActiveListings(): Promise<Listing[]> {
  try {
    const { rows } = await getPool().query(
      "SELECT id, title, description, price, image_url, category, link, is_own, owner_name, owner_contact, listing_fee, fee_paid, paystack_ref, status, delivery_type, created_at FROM marketplace_listings WHERE status='active' ORDER BY is_own DESC, created_at DESC"
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getActiveSlots(): Promise<AdSlot[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM ad_slots WHERE is_active = true ORDER BY id ASC');
    return rows;
  } catch {
    return [];
  }
}

export async function getAdQueue(): Promise<(AdSubmission & { slot_name: string })[]> {
  try {
    const { rows } = await getPool().query(
      `SELECT a.*, s.name AS slot_name FROM ad_submissions a JOIN ad_slots s ON s.id=a.slot_id ORDER BY a.created_at DESC`
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getMessages(): Promise<Message[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return rows;
  } catch {
    return [];
  }
}

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  try {
    const { rows } = await getPool().query(
      'SELECT * FROM social_accounts WHERE is_active = true ORDER BY order_index ASC, id ASC'
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getAdPackages(): Promise<AdPackage[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM ad_packages WHERE is_active = true ORDER BY id ASC');
    return rows;
  } catch {
    return [];
  }
}

export async function getListings(): Promise<Listing[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM marketplace_listings ORDER BY created_at DESC');
    return rows;
  } catch {
    return [];
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const { rows } = await getPool().query('SELECT * FROM blog_posts ORDER BY COALESCE(publish_at, created_at) DESC');
    return rows;
  } catch {
    return [];
  }
}

export async function getSettingsValue(key: string): Promise<string> {
  try {
    const { rows } = await getPool().query('SELECT value FROM settings WHERE key=$1', [key]);
    return rows[0]?.value ?? '';
  } catch {
    return '';
  }
}

export async function getPublishedStories(): Promise<Story[]> {
  try {
    const { rows } = await getPool().query(
      `SELECT s.*, w.name as writer_name, w.avatar_url as writer_avatar
       FROM stories s
       JOIN writer_users w ON w.id = s.writer_id
       WHERE s.status='published' AND w.status='approved'
       ORDER BY s.published_at DESC`
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getStory(slug: string): Promise<(Story & { writer_name: string; writer_avatar: string }) | null> {
  try {
    const { rows } = await getPool().query(
      `SELECT s.*, w.name as writer_name, w.avatar_url as writer_avatar
       FROM stories s
       JOIN writer_users w ON w.id = s.writer_id
       WHERE s.slug=$1 AND s.status='published' AND w.status='approved'`,
      [slug]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getWriterStories(writerId: number): Promise<Story[]> {
  try {
    const { rows } = await getPool().query(
      'SELECT * FROM stories WHERE writer_id=$1 ORDER BY updated_at DESC',
      [writerId]
    );
    return rows;
  } catch {
    return [];
  }
}
