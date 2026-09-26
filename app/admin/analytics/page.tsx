import AdminHeader from '@/components/admin/AdminHeader';
import pool from '@/lib/db';

export const metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const [daily, topPaths, clicks, slots] = await Promise.all([
    pool.query(`SELECT to_char(date_trunc('day', viewed_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS views
                FROM page_views WHERE viewed_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1`),
    pool.query('SELECT path, COUNT(*)::int AS views FROM page_views GROUP BY path ORDER BY views DESC LIMIT 20'),
    pool.query(`SELECT a.advertiser_name, s.name AS slot, COUNT(c.id)::int AS clicks
                FROM ad_clicks c JOIN ad_submissions a ON a.id=c.ad_id JOIN ad_slots s ON s.id=a.slot_id
                GROUP BY a.advertiser_name, s.name ORDER BY clicks DESC`),
    pool.query('SELECT * FROM ad_slots ORDER BY id ASC')
  ]);

  const max = Math.max(...daily.rows.map((r) => r.views), 1);

  return (
    <div>
      <AdminHeader title="Analytics" sub="Traffic, top pages and ad clicks." />

      <h2 className="font-display font-bold uppercase text-xl mt-10 mb-4">Views — last 14 days</h2>
      <div className="rounded-2xl bg-card ring-1 ring-line p-5">
        {daily.rows.length ? (
          <div className="flex items-end gap-1.5 h-40">
            {daily.rows.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${d.views}`}>
                <span className="text-[10px] text-muted">{d.views}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-accent to-accent-2 transition-all"
                  style={{ height: `${Math.max((d.views / max) * 100, 2)}%` }}
                />
                <span className="text-[10px] text-muted">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No views recorded yet.</p>
        )}
      </div>

      <h2 className="font-display font-bold uppercase text-xl mt-10 mb-4">Top pages</h2>
      <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
        {topPaths.rows.map((p, i) => (
          <div key={p.path} className="flex items-center justify-between px-5 py-3 border-b border-line last:border-0 text-sm">
            <span className="text-ink-soft font-mono">{p.path}</span>
            <span className="font-bold">{p.views}</span>
          </div>
        ))}
      </div>

      <h2 className="font-display font-bold uppercase text-xl mt-10 mb-4">Ad performance</h2>
      <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
        {clicks.rows.length ? (
          clicks.rows.map((c) => (
            <div key={c.advertiser_name + c.slot} className="flex items-center justify-between px-5 py-3 border-b border-line last:border-0 text-sm">
              <span className="text-ink-soft">{c.advertiser_name} <span className="text-muted">· {c.slot}</span></span>
              <span className="font-bold">{c.clicks} clicks</span>
            </div>
          ))
        ) : (
          <p className="p-6 text-sm text-muted">No clicks yet.</p>
        )}
      </div>

      <h2 className="font-display font-bold uppercase text-xl mt-10 mb-4">Slots</h2>
      <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
        {slots.rows.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-5 py-3 border-b border-line last:border-0 text-sm">
            <span className="text-ink-soft">{s.name} <span className="text-muted">· {s.position} · ₦{s.price_per_day}/day</span></span>
            <span className={`font-bold text-xs px-2.5 py-1 rounded-full ${s.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {s.is_active ? 'active' : 'paused'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
