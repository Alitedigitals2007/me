import Link from 'next/link';
import pool from '@/lib/db';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Admin' };

export default async function AdminDashboard() {
  const [ads, listings, messages, scheduled, viewsToday, viewsWeek, clicksWeek, recentMsgs] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS c FROM ad_submissions WHERE status='paid'"),
    pool.query("SELECT COUNT(*)::int AS c FROM marketplace_listings WHERE status='pending'"),
    pool.query("SELECT COUNT(*)::int AS c FROM contact_messages WHERE is_read=false"),
    pool.query("SELECT COUNT(*)::int AS c FROM blog_posts WHERE status='scheduled'"),
    pool.query("SELECT COUNT(*)::int AS c FROM page_views WHERE viewed_at > now() - interval '1 day'"),
    pool.query("SELECT COUNT(*)::int AS c FROM page_views WHERE viewed_at > now() - interval '7 days'"),
    pool.query("SELECT COUNT(*)::int AS c FROM ad_clicks WHERE clicked_at > now() - interval '7 days'"),
    pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 5')
  ]);

  const stats = [
    { label: 'Views today', value: viewsToday.rows[0].c, href: '/admin/analytics' },
    { label: 'Views 7 days', value: viewsWeek.rows[0].c, href: '/admin/analytics' },
    { label: 'Ad clicks 7 days', value: clicksWeek.rows[0].c, href: '/admin/ads' },
    { label: 'Paid ads to review', value: ads.rows[0].c, href: '/admin/ads', alert: ads.rows[0].c > 0 },
    { label: 'Pending listings', value: listings.rows[0].c, href: '/admin/marketplace', alert: listings.rows[0].c > 0 },
    { label: 'Unread messages', value: messages.rows[0].c, href: '/admin/messages', alert: messages.rows[0].c > 0 },
    { label: 'Scheduled posts', value: scheduled.rows[0].c, href: '/admin/blog' }
  ];

  return (
    <div>
      <h1 className="font-display font-extrabold uppercase text-3xl">Dashboard</h1>
      <p className="text-sm text-muted mt-1">Everything running on one screen.</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl bg-card ring-1 ring-line shadow-card p-5 hover:-translate-y-0.5 transition-transform"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{s.label}</p>
            <p className={`font-display font-extrabold text-3xl mt-2 ${s.alert ? 'text-danger' : 'text-ink'}`}>
              {s.value}
            </p>
            {s.alert && <p className="text-[11px] font-bold text-danger mt-1">Needs attention</p>}
          </Link>
        ))}
      </div>

      <h2 className="font-display font-bold uppercase text-xl mt-12 mb-4">Latest messages</h2>
      <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
        {recentMsgs.rows.length ? (
          recentMsgs.rows.map((m) => (
            <div key={m.id} className="px-5 py-4 border-b border-line last:border-0">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-sm">
                  {m.name} <span className="text-muted font-normal">· {m.email}</span>
                </p>
                <span className="text-xs text-muted shrink-0">{formatDateTime(m.created_at)}</span>
              </div>
              <p className="text-sm text-ink-soft mt-1 line-clamp-2">{m.message}</p>
            </div>
          ))
        ) : (
          <p className="p-6 text-sm text-muted">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
