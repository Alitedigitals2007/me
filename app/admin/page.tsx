import Link from 'next/link';
import pool from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import { getAdmin } from '@/lib/admin-auth';
import { ensureAcademySchema } from '@/lib/academy-schema';

export const metadata = { title: 'Admin' };

export default async function AdminDashboard() {
  const admin = await getAdmin();
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

  let academy = { students: 0, pending: 0, enrolled: 0 };
  try {
    await ensureAcademySchema();
    const [st, ps, en] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM students'),
      pool.query(`SELECT COUNT(*)::int AS c FROM submissions WHERE status='pending'`),
      pool.query(`SELECT COUNT(*)::int AS c FROM enrollments WHERE status IN ('active','completed')`)
    ]);
    academy = { students: st.rows[0].c, pending: ps.rows[0].c, enrolled: en.rows[0].c };
  } catch {
    // academy schema not ready — stats show as 0
  }

  const stats = [
    { label: 'Views today', value: viewsToday.rows[0].c, href: '/admin/analytics' },
    { label: 'Views 7 days', value: viewsWeek.rows[0].c, href: '/admin/analytics' },
    { label: 'Ad clicks 7 days', value: clicksWeek.rows[0].c, href: '/admin/ads' },
    { label: 'Paid ads to review', value: ads.rows[0].c, href: '/admin/ads', alert: ads.rows[0].c > 0 },
    { label: 'Pending listings', value: listings.rows[0].c, href: '/admin/marketplace', alert: listings.rows[0].c > 0 },
    { label: 'Unread messages', value: messages.rows[0].c, href: '/admin/messages', alert: messages.rows[0].c > 0 },
    { label: 'Scheduled posts', value: scheduled.rows[0].c, href: '/admin/blog' },
    { label: 'Academy students', value: academy.students, href: '/admin/students' },
    { label: 'Submissions to grade', value: academy.pending, href: '/admin/submissions', alert: academy.pending > 0 },
    { label: 'Active enrollments', value: academy.enrolled, href: '/admin/academy' }
  ];

  const academyNav = [
    { label: 'Course studio', desc: 'Courses, lessons & quizzes', href: '/admin/academy' },
    { label: 'Grade submissions', desc: `${academy.pending} waiting`, href: '/admin/submissions', alert: academy.pending > 0 },
    { label: 'Students', desc: `${academy.students} registered`, href: '/admin/students' },
    { label: 'Certificates', desc: 'Issue & revoke', href: '/admin/certificates' }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-accent">ALITE Admin</p>
          <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl mt-1 tracking-[-0.02em]">
            Hi, <span className="text-gradient">{admin?.username ?? 'Admin'}</span>
          </h1>
          <p className="text-sm text-muted mt-1">Everything running on one screen.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-full ring-1 ring-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:ring-accent/50 transition-all"
          >
            View site
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-accent/10 text-accent px-4 py-2 text-xs font-semibold ring-1 ring-accent/30 hover:bg-accent/15 transition-all"
          >
            Student view
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
        <a href="#overview" className="rounded-full bg-accent/10 text-accent px-4 py-2.5">Overview</a>
        <a href="#academy" className="rounded-full bg-card ring-1 ring-line px-4 py-2.5">Academy ({academy.pending > 0 ? `${academy.pending} to grade` : 'ok'})</a>
        <a href="#messages" className="rounded-full bg-card ring-1 ring-line px-4 py-2.5">Messages ({messages.rows[0].c})</a>
      </div>

      <section id="overview" className="mt-8">
        <h2 className="font-display font-bold uppercase text-xl mb-4">At a glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={`relative overflow-hidden rounded-2xl bg-card ring-1 shadow-card p-5 hover:-translate-y-0.5 hover:shadow-lift transition-all ${
                s.alert ? 'ring-danger/40' : 'ring-line hover:ring-accent/40'
              }`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 ${
                  s.alert ? 'bg-danger' : 'bg-gradient-to-r from-accent via-accent-2 to-cyan-accent'
                }`}
                aria-hidden
              />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{s.label}</p>
              <p className={`font-display font-extrabold text-3xl mt-2 ${s.alert ? 'text-danger' : 'text-accent'}`}>
                {s.value}
              </p>
              {s.alert && <p className="text-[11px] font-bold text-danger mt-1">Needs attention</p>}
            </Link>
          ))}
        </div>
      </section>

      <section id="academy" className="mt-12">
        <h2 className="font-display font-bold uppercase text-xl mb-4">Academy</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {academyNav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`rounded-2xl bg-card ring-1 shadow-card p-5 hover:-translate-y-0.5 hover:shadow-lift transition-all ${
                n.alert ? 'ring-danger/40' : 'ring-line hover:ring-accent/40'
              }`}
            >
              <p className="font-display font-bold group-hover:text-accent">{n.label}</p>
              <p className="text-xs text-muted mt-1">{n.desc}</p>
              <span className="inline-block text-xs font-semibold text-accent mt-3">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="messages" className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold uppercase text-xl">Latest messages</h2>
          <Link href="/admin/messages" className="text-xs font-semibold text-accent">View all →</Link>
        </div>
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
      </section>
    </div>
  );
}
