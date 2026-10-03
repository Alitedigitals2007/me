import Link from 'next/link';
import ActionButton from '@/components/admin/ActionButton';
import AdminHeader from '@/components/admin/AdminHeader';
import getPool from '@/lib/db';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Stories' };

const FILTERS = ['published', 'draft', 'all'];

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const status = FILTERS.includes(filter || '') ? filter! : 'all';
  const where = status === 'all' ? 'TRUE' : `s.status = '${status}'`;
  const [stories, counts, activity] = await Promise.all([
    safeQuery(
      `SELECT s.*, w.name as writer_name, w.email as writer_email
       FROM stories s
       JOIN writer_users w ON w.id = s.writer_id
       WHERE ${where} ORDER BY s.updated_at DESC`
    ),
    safeQuery('SELECT status, COUNT(*)::int AS c FROM stories GROUP BY status'),
    safeQuery(
      `SELECT sa.*, s.title as story_title, w.name as writer_name
       FROM story_activity sa
       JOIN stories s ON s.id = sa.story_id
       JOIN writer_users w ON w.id = sa.writer_id
       ORDER BY sa.created_at DESC LIMIT 50`
    )
  ]);
  const countMap = Object.fromEntries(counts.map((r) => [r.status, r.c]));

  return (
    <div>
      <AdminHeader title="Stories" sub="All writer stories and activity log." />

      <div className="flex flex-wrap gap-2 mt-6">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/stories?filter=${f}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-all ${
              status === f ? 'bg-accent text-white ring-accent' : 'bg-card ring-line text-muted hover:text-ink'
            }`}
          >
            {f} {f !== 'all' ? countMap[f] ?? 0 : ''}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {stories.rows.length ? (
          stories.rows.map((s) => (
            <div key={s.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  {s.cover_image && (
                    <img src={s.cover_image} alt="" className="w-16 h-12 rounded-lg object-cover ring-1 ring-line shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{s.title}</p>
                    <p className="text-xs text-muted truncate">
                      by {s.writer_name} ({s.writer_email}) · {formatDate(s.updated_at)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  s.status === 'published' ? 'bg-success/10 text-success' :
                  'bg-paper ring-1 ring-line text-muted'
                }`}>
                  {s.status}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {s.status === 'draft' && (
                  <ActionButton url={`/api/admin/stories/publish/${s.id}`} label="Publish" tone="success" />
                )}
                {s.status === 'published' && (
                  <ActionButton url={`/api/admin/stories/unpublish/${s.id}`} label="Unpublish" tone="normal" />
                )}
                <ActionButton url={`/api/admin/stories/delete/${s.id}`} label="Delete" tone="danger" confirmText="Delete this story?" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">No stories in this filter.</p>
        )}
      </div>

      <div className="mt-12">
        <h2 className="font-display font-bold uppercase text-xl mb-4">Activity Log</h2>
        <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
          {activity.rows.length ? (
            activity.rows.map((a) => (
              <div key={a.id} className="px-5 py-4 border-b border-line last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      a.action === 'published' ? 'bg-success/10 text-success' :
                      a.action === 'deleted' ? 'bg-danger/10 text-danger' :
                      'bg-paper ring-1 ring-line text-muted'
                    }`}>
                      {a.action}
                    </span>
                    <span className="font-semibold text-sm">{a.story_title}</span>
                    <span className="text-xs text-muted">by {a.writer_name}</span>
                  </div>
                  <span className="text-xs text-muted shrink-0">{formatDate(a.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="p-6 text-sm text-muted">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
