# Writer/Story Platform Design Spec

## Overview
Add a writer/story publishing platform to ALITE where:
- Writers can create accounts (admin approval required)
- Approved writers can create, edit, publish, delete their own stories (no further approval needed for publishing)
- Stories support rich text + images
- Admin gets Telegram notifications on: writer signup, story publish/edit/delete
- Admin sees writer activity log and story activity log
- Public story listing and detail pages with ad slots
- Stories are distinct from blog posts (separate URL `/stories`, separate tables, different content type)

## Data Model

### writer_users
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE NOT NULL |
| password_hash | TEXT | NOT NULL |
| status | TEXT | NOT NULL DEFAULT 'pending' ('pending' | 'approved' | 'rejected') |
| bio | TEXT | DEFAULT '' |
| avatar_url | TEXT | DEFAULT '' |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| approved_at | TIMESTAMPTZ | NULL |
| approved_by | INT | REFERENCES users(id) |

### stories
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| writer_id | INT | NOT NULL REFERENCES writer_users(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| slug | TEXT | UNIQUE NOT NULL |
| excerpt | TEXT | DEFAULT '' |
| content | TEXT | NOT NULL DEFAULT '' |
| cover_image | TEXT | DEFAULT '' |
| status | TEXT | NOT NULL DEFAULT 'draft' ('draft' | 'published') |
| published_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

### story_activity (audit log)
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| story_id | INT | NOT NULL REFERENCES stories(id) ON DELETE CASCADE |
| writer_id | INT | NOT NULL REFERENCES writer_users(id) ON DELETE CASCADE |
| action | TEXT | NOT NULL ('created' | 'updated' | 'published' | 'deleted' | 'approved' | 'rejected') |
| meta | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

## Auth & Sessions

### Writer Session
- Separate cookie: `alite_writer`
- 30-day expiry (like student sessions)
- Payload: `{ id, name, email }`
- Middleware protects `/writer/:path*` and `/api/writer/:path*`

### Admin Session
- Existing `alite_session` (30 min)
- Unchanged

## Routes

### Public
- `GET /stories` — paginated list of published stories
- `GET /stories/[slug]` — story detail with ads
- `GET /stories/tag/[tag]` — tag filter (future)

### Writer (auth required)
- `GET /writer/signup` — signup form
- `GET /writer/login` — login form
- `GET /writer/dashboard` — list own stories, create new
- `GET /writer/stories/new` — new story editor
- `GET /writer/stories/[id]/edit` — edit story

### Writer API
- `POST /api/writer/signup` — create account (status: pending)
- `POST /api/writer/login` — login, set cookie
- `POST /api/writer/logout` — clear cookie
- `POST /api/writer/stories` — create story (draft)
- `POST /api/writer/stories/[action]/[id]` — actions: publish, unpublish, delete, save-draft
- `GET /api/writer/me` — current writer session

### Admin
- `GET /admin/writers` — list all writers, approve/reject
- `GET /admin/stories` — all stories with writer info, activity log

### Admin API
- `POST /api/admin/writers/[action]/[id]` — approve, reject, delete
- `POST /api/admin/stories/[action]/[id]` — force-publish, unpublish, delete
- `GET /api/admin/stories/activity` — activity feed

## Telegram Notifications

### New events to notify admin:
1. **Writer signup** — "📝 New writer application: Name (email)"
2. **Story published** — "📖 Story published: Title by Writer\n🔗 URL"
3. **Story updated** — "✏️ Story updated: Title by Writer"
4. **Story deleted** — "🗑️ Story deleted: Title by Writer"

### New bot commands:
- `/writers` — pending writer applications
- `/stories` — recent story activity

## Admin UI

### /admin/writers
- Table: name, email, status, created_at, actions (approve/reject/delete)
- Filter by status

### /admin/stories
- Table: title, writer, status, published_at, actions
- Activity log sidebar or separate tab

## Ad Integration

- Story detail page (`/stories/[slug]`) uses existing `AdSlot` component
- Ad positions: `story_sidebar`, `story_inline` (between paragraphs), `story_bottom`
- Same ad loading logic as blog posts (`loadAds()`)

## Story vs Blog Distinction

| Aspect | Blog Posts | Stories |
|--------|-----------|---------|
| URL | `/blog/[slug]` | `/stories/[slug]` |
| Table | `blog_posts` | `stories` |
| Author | Admin only | Writers (after approval) |
| Approval for publish | Admin only | Writer self-publishes |
| Comments | Yes (blog_comments) | No (future) |
| Likes | Yes (blog_likes) | No (future) |
| Tags | Yes | Yes (same tags column) |
| Rich text | Yes | Yes (same editor) |
| Cover image | Yes | Yes |

## Implementation Order

1. DB schema (schema.sql + types.ts)
2. Writer auth lib (session, middleware)
3. Writer API routes (signup, login, logout, me)
4. Writer pages (signup, login, dashboard, editor)
5. Story API routes (CRUD)
6. Public story pages (list, detail)
7. Admin pages (writers, stories)
8. Telegram bot updates
8. Ad integration on story pages
9. Activity logging

## Non-Goals
- Writer profiles/public pages
- Story comments/likes
- Story series/collections
- Writer payouts
- Email notifications (Telegram only)
- Story scheduling (draft/published only)