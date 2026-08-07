# Alite Personal Platform — Full Spec (v1)

**Working name:** aliteHQ (placeholder — swap for whatever domain you pick)
**Purpose:** Personal portfolio + blog + marketplace + ad platform + admin dashboard, all in one site, run by you as admin.

---

## 1. Tech Stack

Matching what you already know so you're not learning a new stack mid build.

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js + Express | Same as Prepium/Classmate |
| Views | EJS | Fast to ship, SSR, good for SEO on portfolio/blog pages |
| Database | PostgreSQL (Neon) | Same as Prepium |
| Auth | Session based (`req.session.user`), bcrypt | Reuse your hardened auth pattern |
| Payments | Paystack | Already integrated in your other projects |
| File/image storage | Cloudinary (free tier) | For project images, ad creatives, blog cover images |
| Bot | Telegram Bot API (`node-telegram-bot-api` or raw `fetch`) | For admin notifications |
| Blog auto-post | Internal scheduler (`node-cron`) + optional AI draft generation via Claude API | You write or generate, it publishes on schedule |
| Hosting | Render / Railway (backend) + Neon (DB) | Free/cheap tier friendly, same pattern as Prepium |

---

## 2. Public Site — Pages

1. **Home** — hero (name, tagline, photo), quick nav to portfolio/blog/marketplace, socials
2. **About** — bio, education, roles/experience timeline
3. **Portfolio** — project grid (Prepium, Classmate, client work), each with case study page (problem, stack, outcome, link)
4. **Courses** — list of courses you offer or curate, links out or in-platform
5. **Blog** — list + single post page, tags, auto-published posts show here
6. **Marketplace** — listings (could be your own products/services, or a listing board)
7. **Advertise** — public page explaining ad placement: pricing tiers, ad slots available, submission form
8. **Contact** — form + socials

## 3. Admin Dashboard (`/admin`)

Protected route, session auth, only you (and maybe future team) can access.

- **Content manager**: CRUD for portfolio projects, education entries, roles, courses
- **Blog manager**: write/edit posts, schedule publish date, AI-assist draft (optional), auto-publish via cron
- **Marketplace manager**: CRUD listings
- **Ad manager**:
  - Pending ad submissions queue (with payment status)
  - Approve → ad goes live in the slot, on the schedule paid for
  - Reject → refund flow or notify submitter
- **Analytics** (basic): page views, ad clicks, blog reads — can start simple (just counters in DB), upgrade to real analytics later
- **Settings**: social links, Telegram chat ID, site meta info

## 4. Telegram Integration

A Telegram bot (create via @BotFather) posts to your personal chat/channel on:
- New ad submission (with payment ref)
- New marketplace order
- New contact form message
- Blog post auto-published (confirmation)

Flow: your server calls Telegram's `sendMessage` API on these trigger events — no polling needed for one-way notifications.

## 5. Ad Placement System (the trickiest part)

**Flow:**
1. Advertiser visits `/advertise`, picks a slot (e.g. homepage banner, sidebar, blog inline) and duration (7/14/30 days)
2. Fills form: ad image/link, contact info
3. Pays via Paystack (amount depends on slot + duration)
4. Payment webhook marks submission as `paid, pending_review`
5. Telegram notifies you
6. You review in dashboard → **approve** (ad goes live, scheduled end date auto-expires it) or **reject** (mark for manual refund, or auto-refund via Paystack refund API)
7. Cron job auto-expires ads past their end date

**DB tables needed:** `ad_slots`, `ad_submissions` (status: pending_payment, paid, approved, rejected, expired)

## 6. Marketplace

Keep v1 simple — decide which model fits:
- **Option A**: Just YOUR products/services listed (simplest, no multi-vendor complexity)
- **Option B**: Others can list too (like the ad system — submit, pay a listing fee, you approve)

Given you said "full spec," I'd build the schema to support Option B (so it's future-proof) but ship Option A first — dashboard toggle to open it up later.

## 7. Database Schema (core tables)

```
users (id, email, password_hash, role[admin/user], created_at)
projects (id, title, slug, description, stack, image_url, live_url, repo_url, featured, order_index)
education (id, institution, program, start_date, end_date, description)
roles (id, title, org, start_date, end_date, description)
courses (id, title, description, link, price, is_own_product)
blog_posts (id, title, slug, content, cover_image, status[draft/scheduled/published], publish_at, created_at)
marketplace_listings (id, title, description, price, image_url, owner_id, status[active/sold/pending])
ad_slots (id, name, position, price_per_day, max_active)
ad_submissions (id, slot_id, advertiser_name, contact, image_url, target_url, start_date, end_date, amount_paid, paystack_ref, status)
settings (key, value)  -- for socials, telegram chat id, etc
page_views (id, path, viewed_at)  -- basic analytics
```

## 8. Build Order (phased, since you chose "full spec, build in order")

**Phase 1 — Core site**
1. Project scaffold (Express + EJS + Postgres, reuse your Prepium boilerplate/auth)
2. Home, About, Portfolio, Contact pages (static-ish, content from DB)
3. Admin auth + dashboard shell
4. Content manager: projects, education, roles (CRUD)

**Phase 2 — Blog**
5. Blog schema + public blog pages
6. Dashboard blog editor (draft/schedule/publish)
7. Cron job for scheduled auto-publish
8. Telegram bot setup + publish notification

**Phase 3 — Payments + Ads**
9. Paystack integration (reuse Prepium pattern)
10. Ad slots + submission flow (public form → payment → pending)
11. Dashboard ad approval queue
12. Telegram notification on new ad/payment
13. Cron job to auto-expire ads

**Phase 4 — Marketplace**
14. Listings schema + public marketplace page
15. Dashboard listing manager
16. (If Option B) public submission + approval flow, same pattern as ads

**Phase 5 — Courses + polish**
17. Courses page + management
18. Basic analytics (page views)
19. Social links + settings panel
20. SEO pass (meta tags, sitemap, OG images)

---

## Next steps
Tell me which piece to start coding first — I'd suggest Phase 1 (scaffold + portfolio + dashboard shell), since everything else plugs into it. I can generate the Express boilerplate, folder structure, and first migration/schema file whenever you're ready.
