import Link from 'next/link';
import ActionButton from '@/components/admin/ActionButton';
import AdminHeader from '@/components/admin/AdminHeader';
import getPool from '@/lib/db';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Writers' };

const FILTERS = ['pending', 'approved', 'rejected', 'all'];

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

export default async function WritersPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const status = FILTERS.includes(filter || '') ? filter! : 'pending';
  const where = status === 'all' ? 'TRUE' : `status = '${status}'`;
  const [writers, counts] = await Promise.all([
    safeQuery(`SELECT * FROM writer_users WHERE ${where} ORDER BY created_at DESC`),
    safeQuery('SELECT status, COUNT(*)::int AS c FROM writer_users GROUP BY status')
  ]);
  const countMap = Object.fromEntries(counts.map((r) => [r.status, r.c]));

  return (
    <div>
      <AdminHeader title="Writers" sub="Writer applications and accounts." />

      <div className="flex flex-wrap gap-2 mt-6">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/writers?filter=${f}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-all ${
              status === f ? 'bg-accent text-white ring-accent' : 'bg-card ring-line text-muted hover:text-ink'
            }`}
          >
            {f} {f !== 'all' ? countMap[f] ?? 0 : ''}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {writers.length ? (
          writers.map((w) => (
            <div key={w.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  {w.avatar_url ? (
                    <img src={w.avatar_url} alt={w.name} className="w-12 h-12 rounded-full ring-1 ring-line object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-paper ring-1 ring-line grid place-items-center font-display font-bold text-xl text-line">✍</div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{w.name}</p>
                    <p className="text-xs text-muted">{w.email}</p>
                    {w.bio && <p className="text-xs text-muted line-clamp-1 mt-1">{w.bio}</p>}
                    <p className="text-[11px] text-muted mt-1">Applied {formatDate(w.created_at)}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  w.status === 'approved' ? 'bg-success/10 text-success' :
                  w.status === 'rejected' ? 'bg-danger/10 text-danger' :
                  'bg-warning/15 text-warning-strong'
                }`}>
                  {w.status}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {w.status === 'pending' && (
                  <>
                    <ActionButton url={`/api/admin/writers/approve/${w.id}`} label="Approve" tone="success" />
                    <ActionButton url={`/api/admin/writers/reject/${w.id}`} label="Reject" tone="danger" confirmText="Reject this writer?" />
                  </>
                )}
                {w.status === 'approved' && (
                  <ActionButton url={`/api/admin/writers/reject/${w.id}`} label="Revoke Approval" tone="danger" confirmText="Revoke this writer's approval?" />
                )}
                <ActionButton url={`/api/admin/writers/delete/${w.id}`} label="Delete" tone="danger" confirmText="Delete this writer and all their stories?" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">No writers in this filter.</p>
        )}
      </div>
    </div>
  );
}
