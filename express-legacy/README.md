# Alite Platform

Personal portfolio + blog + marketplace + ad platform + admin dashboard, all in one site.

## Stack
- Node.js + Express, EJS views, PostgreSQL (Neon), session auth (bcrypt)
- Paystack payments, Cloudinary uploads (optional), Telegram notifications, optional Claude AI blog drafts
- Runs locally or on Vercel (serverless-ready)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in (your existing `.env` already carries `DATABASE_URL` + Cloudinary keys):
   - `DATABASE_URL` — Neon connection string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — admin login (seed only; email or username both work)
   - `SESSION_SECRET` — random string
   - `SITE_URL` — `http://localhost:3000` locally, your domain in production
   - `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` — for ads + marketplace fees
   - `TELEGRAM_BOT_TOKEN` — optional, admin notifications (set chat ID in Admin → Settings)
   - `ANTHROPIC_API_KEY` — optional, AI blog drafts
3. `npm run seed` — creates/migrates tables, seeds ad slots + settings + admin
4. `npm run dev` — http://localhost:3000, login at `/admin`

## Vercel deploy
- `vercel.json` routes everything through `server.js` and defines an hourly cron (`/api/cron`) for scheduled posts + ad expiry
- Add all `.env` values as Vercel environment variables (including `CRON_SECRET`; Vercel sends it as a bearer token to `/api/cron`)
- Hobby-plan cron limits (~2 executions/day) mean scheduled publishing may be delayed — set `CRON_SECRET` and consider Pro, or rely on the lazy scheduler that also runs during normal traffic

## Ads flow
Public `/advertise` → pick slot + duration → Paystack → webhook marks `paid` → Telegram alert → approve in dashboard → auto-expires on end date. Reject → notify + manual refund.

## Marketplace
Option A + B: your own listings (live instantly) and public listings (₦5,000 fee, pending approval). Toggle/change the fee in Admin → Settings.
