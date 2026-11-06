import getPool from './db';
import { ensureWriterSchema } from './writer-schema';
import { parseTags } from './utils';
import type {
  Project, EducationItem, RoleItem, Course, BlogPost, Listing, AdSlot, AdPackage, AdSubmission, Message, SocialAccount, Story, StoryComment, WriterUser
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
    await ensureWriterSchema();
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

export interface StoryFilters {
  q?: string;
  category?: string;
  topic?: string;
  tag?: string;
  author?: string;
}

/** Published stories filtered by free-text (title/excerpt/author/category/topic/tags), category, topic, tag or author. */
export async function searchPublishedStories(filters: StoryFilters = {}): Promise<Story[]> {
  try {
    await ensureWriterSchema();
    const conds = ["s.status='published'", "w.status='approved'"];
    const params: string[] = [];

    const q = String(filters.q || '').trim();
    if (q) {
      params.push(`%${q}%`);
      const p = `$${params.length}`;
      conds.push(
        `(s.title ILIKE ${p} OR s.excerpt ILIKE ${p} OR s.category ILIKE ${p} OR s.topic ILIKE ${p} OR s.tags ILIKE ${p} OR w.name ILIKE ${p})`
      );
    }
    const category = String(filters.category || '').trim();
    if (category) {
      params.push(category);
      conds.push(`LOWER(s.category) = LOWER($${params.length})`);
    }
    const topic = String(filters.topic || '').trim();
    if (topic) {
      params.push(topic);
      conds.push(`LOWER(s.topic) = LOWER($${params.length})`);
    }
    const author = String(filters.author || '').trim();
    if (author) {
      params.push(`%${author}%`);
      conds.push(`w.name ILIKE $${params.length}`);
    }
    const tag = String(filters.tag || '').trim();
    if (tag) {
      params.push(`%,${tag.toLowerCase().replace(/\s+/g, '')},%`);
      conds.push(`(',' || LOWER(REPLACE(s.tags, ' ', '')) || ',') LIKE $${params.length}`);
    }

    const { rows } = await getPool().query(
      `SELECT s.*, w.name as writer_name, w.avatar_url as writer_avatar
       FROM stories s
       JOIN writer_users w ON w.id = s.writer_id
       WHERE ${conds.join(' AND ')}
       ORDER BY s.published_at DESC NULLS LAST
       LIMIT 60`,
      params
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getStoryCategories(): Promise<string[]> {
  try {
    await ensureWriterSchema();
    const { rows } = await getPool().query(
      `SELECT DISTINCT s.category
       FROM stories s
       JOIN writer_users w ON w.id = s.writer_id
       WHERE s.status='published' AND w.status='approved' AND s.category <> ''
       ORDER BY s.category ASC`
    );
    return rows.map((r) => r.category as string);
  } catch {
    return [];
  }
}

export async function getStoryTopics(): Promise<string[]> {
  try {
    await ensureWriterSchema();
    const { rows } = await getPool().query(
      `SELECT DISTINCT s.topic
       FROM stories s
       JOIN writer_users w ON w.id = s.writer_id
       WHERE s.status='published' AND w.status='approved' AND s.topic <> ''
       ORDER BY s.topic ASC`
    );
    return rows.map((r) => r.topic as string);
  } catch {
    return [];
  }
}

export async function getStoryTags(): Promise<string[]> {
  try {
    await ensureWriterSchema();
    const { rows } = await getPool().query(
      `SELECT s.tags
       FROM stories s
       JOIN writer_users w ON w.id = s.writer_id
       WHERE s.status='published' AND w.status='approved' AND s.tags <> ''`
    );
    const set = new Set<string>();
    for (const r of rows) for (const t of parseTags(r.tags)) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/** Related stories: same category (strong), shared tags, same author — newest first as tiebreaker. */
export async function getRelatedStories(story: Story, limit = 3): Promise<Story[]> {
  try {
    await ensureWriterSchema();
    const tags = parseTags(story.tags).map((t) => t.toLowerCase());
    const patterns = tags.map((t) => `%${t}%`);
    const { rows } = await getPool().query(
      `SELECT s.*, w.name as writer_name, w.avatar_url as writer_avatar
       FROM stories s
       JOIN writer_users w ON w.id = s.writer_id
       WHERE s.status='published' AND w.status='approved' AND s.id <> $1
         AND (
           (s.category <> '' AND LOWER(s.category) = LOWER($2))
           OR s.writer_id = $3
           OR s.tags ILIKE ANY($4::text[])
         )
       ORDER BY s.published_at DESC NULLS LAST
       LIMIT 24`,
      [story.id, story.category || '', story.writer_id, patterns]
    );

    const category = (story.category || '').toLowerCase();
    const scored = rows.map((r) => {
      let score = 0;
      if (category && String(r.category || '').toLowerCase() === category) score += 3;
      if (r.writer_id === story.writer_id) score += 1;
      const rowTags = new Set(parseTags(r.tags).map((t) => t.toLowerCase()));
      for (const t of tags) if (rowTags.has(t)) score += 2;
      return { r, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.r);
  } catch {
    return [];
  }
}

export async function getStory(slug: string): Promise<(Story & { writer_name: string; writer_avatar: string }) | null> {
  try {
    await ensureWriterSchema();
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

/** Count a unique view (per ip_hash) and bump the denormalised counter. Returns the new total. */
export async function recordStoryView(storyId: number, ipHash: string): Promise<number> {
  try {
    const { rowCount } = await getPool().query(
      `INSERT INTO story_views (story_id, ip_hash) VALUES ($1, $2) ON CONFLICT (story_id, ip_hash) DO NOTHING`,
      [storyId, ipHash]
    );
    if (rowCount) {
      await getPool().query(`UPDATE stories SET views = views + 1 WHERE id=$1`, [storyId]);
    }
    const { rows } = await getPool().query(`SELECT views FROM stories WHERE id=$1`, [storyId]);
    return rows[0]?.views ?? 0;
  } catch {
    return 0;
  }
}

export async function getStoryComments(storyId: number): Promise<StoryComment[]> {
  try {
    const { rows } = await getPool().query(
      `SELECT id, story_id, name, content, created_at FROM story_comments
       WHERE story_id=$1 AND is_approved=true ORDER BY created_at DESC`,
      [storyId]
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getWriterProfile(
  writerId: number
): Promise<(WriterUser & { story_count: number }) | null> {
  try {
    await ensureWriterSchema();
    const { rows } = await getPool().query(
      `SELECT w.id, w.name, w.bio, w.avatar_url, w.status, w.created_at,
              (SELECT COUNT(*)::int FROM stories s WHERE s.writer_id = w.id AND s.status='published') AS story_count
       FROM writer_users w
       WHERE w.id=$1 AND w.status='approved'`,
      [writerId]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getPublishedStoriesByWriter(writerId: number): Promise<Story[]> {
  try {
    await ensureWriterSchema();
    const { rows } = await getPool().query(
      `SELECT * FROM stories WHERE writer_id=$1 AND status='published' ORDER BY published_at DESC NULLS LAST`,
      [writerId]
    );
    return rows;
  } catch {
    return [];
  }
}

/** Publish any scheduled stories whose time has arrived. Returns the ones just published. */
export async function publishDueStories(): Promise<{ title: string; slug: string }[]> {
  try {
    await ensureWriterSchema();
    const { rows } = await getPool().query(
      `UPDATE stories SET status='published', published_at=COALESCE(publish_at, now()), updated_at=now()
       WHERE status='scheduled' AND publish_at IS NOT NULL AND publish_at <= now()
       RETURNING title, slug`
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getWriterStories(writerId: number): Promise<Story[]> {
  try {
    await ensureWriterSchema();
    const { rows } = await getPool().query(
      'SELECT * FROM stories WHERE writer_id=$1 ORDER BY updated_at DESC',
      [writerId]
    );
    return rows;
  } catch {
    return [];
  }
}
