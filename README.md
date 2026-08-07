# ALITE Platform

Personal portfolio, blog, marketplace, and ad platform for Atilola Israel Ayomide — built with Next.js 15, TypeScript, Tailwind CSS v4, and PostgreSQL (Neon).

## Features
- Portfolio with projects, gallery + lightbox, CV/education, roles
- Blog with rich-text editor (bold, headings, lists, quotes, inline images)
- Marketplace with categories (admin-managed)
- Ad platform: 6 packages (website / channel / status combos), 1–14 day pricing, website placements
- Admin dashboard at `/admin` (password-guarded) — fully mobile responsive
- Telegram bot control: approve/reject ads & listings, publish posts, view stats from your phone
- Analytics (page views, ad clicks), sitemap + robots, SEO

## Local dev
```bash
npm install
npm run dev -- -p 3100
```
Copy `.env.example` values into `.env` (or export in Vercel):

| Env var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon Postgres URL |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | yes | Admin login (`/login`) |
| `SESSION_SECRET` | yes | Session signing |
| `SITE_URL` | yes | Canonical URL |
| `TELEGRAM_BOT_TOKEN` | no | Telegram bot (notifications + control) |
| `TELEGRAM_WEBHOOK_SECRET` | no | Webhook secret for the bot |
| `PAYSTACK_SECRET_KEY` | no | Real payments (auto-approve without it) |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | no | Persistent image uploads on Vercel |
| `ANTHROPIC_API_KEY` | no | AI features |
| `CRON_SECRET` | no | Scheduled publish endpoint |

## Telegram bot control
1. Create a bot with @BotFather → set `TELEGRAM_BOT_TOKEN` in `.env`
2. Get your chat ID (message @userinfobot) → set `telegram_chat_id` in admin → Settings
3. Local: `npm run tg:dev` (polling). Production (Vercel): `npm run tg:setup set https://your-site.vercel.app/api/telegram/webhook`

Commands: `/ads`, `/listings`, `/posts`, `/publish <id>`, `/stats`, `/help` — approve/reject with inline buttons.

## Deploy (Vercel)
Push to GitHub → import repo in Vercel → add env vars above → deploy. Note: without Cloudinary keys, uploaded images are stored locally and lost on redeploy.
