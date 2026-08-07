import Link from 'next/link';
import ActionButton from '@/components/admin/ActionButton';
import SlotForm from '@/components/admin/SlotForm';
import PackageForm from '@/components/admin/PackageForm';
import pool from '@/lib/db';
import { formatDate, formatMoney } from '@/lib/utils';

export const metadata = { title: 'Ads' };

const FILTERS = ['pending', 'paid', 'approved', 'rejected', 'expired', 'all'];

export default async function AdsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const status = FILTERS.includes(filter || '') ? filter! : 'pending';
  const where = status === 'all' ? 'TRUE' : `a.status = '${status}'`;
  const [subs, counts, slots, packages] = await Promise.all([
    pool.query(
      `SELECT a.*, s.name AS slot_name, s.position, p.name AS package_name, p.mediums AS package_mediums
       FROM ad_submissions a
       LEFT JOIN ad_slots s ON s.id = a.slot_id
       LEFT JOIN ad_packages p ON p.id = a.package_id
       WHERE ${where} ORDER BY a.created_at DESC`
    ),
    pool.query('SELECT status, COUNT(*)::int AS c FROM ad_submissions GROUP BY status'),
    pool.query('SELECT * FROM ad_slots ORDER BY id ASC'),
    pool.query('SELECT * FROM ad_packages ORDER BY id ASC')
  ]);
  const countMap = Object.fromEntries(counts.rows.map((r) => [r.status, r.c]));

  return (
    <div>
      <h1 className="font-display font-extrabold uppercase text-3xl">Ads</h1>

      <div className="flex flex-wrap gap-2 mt-6">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/ads?filter=${f}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-all ${
              status === f ? 'bg-accent text-white ring-accent' : 'bg-card ring-line text-muted hover:text-ink'
            }`}
          >
            {f} {f !== 'all' ? countMap[f] ?? 0 : ''}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {subs.rows.length ? (
          subs.rows.map((a) => (
            <div key={a.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  {a.image_url && (
                    <img src={a.image_url} alt="" className="w-16 h-12 rounded-lg object-cover ring-1 ring-line" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{a.advertiser_name}</p>
                    <p className="text-xs text-muted">
                      {a.package_name || '—'} {a.slot_name ? `· ${a.slot_name}` : ''} · {a.duration_days} days · {formatMoney(a.amount_paid)} · {formatDate(a.start_date)} → {formatDate(a.end_date)}
                    </p>
                    {a.target_url && <p className="text-xs text-accent break-all">{a.target_url}</p>}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  a.status === 'approved' ? 'bg-success/10 text-success' :
                  a.status === 'rejected' ? 'bg-danger/10 text-danger' :
                  a.status === 'paid' ? 'bg-warning/15 text-warning-strong' :
                  'bg-paper ring-1 ring-line text-muted'
                }`}>
                  {a.status}{a.paystack_ref ? ' · paid' : ''}
                </span>
              </div>
              <p className="text-xs text-muted mt-2">Contact: {a.contact}</p>
              {a.mediums && !a.mediums.includes('website') && (
                <p className="text-xs font-bold text-warning-strong mt-1.5 rounded-lg bg-warning/10 px-3 py-2 inline-block">
                  Off-site ad — post the image on your {a.mediums.split(',').join(' and ')} for {a.duration_days} day{a.duration_days > 1 ? 's' : ''} (download it above).
                </p>
              )}
              <div className="flex gap-2 mt-3">
                {(a.status === 'paid' || a.status === 'pending_payment') && (
                  <>
                    <ActionButton url={`/api/admin/ads/approve/${a.id}`} label="Approve & go live" tone="success" />
                    <ActionButton url={`/api/admin/ads/reject/${a.id}`} label="Reject" tone="danger" confirmText="Reject this ad?" />
                  </>
                )}
                <ActionButton url={`/api/admin/ads/delete/${a.id}`} label="Delete" tone="danger" confirmText="Delete this submission?" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">No submissions in this filter.</p>
        )}
      </div>

      <h2 className="font-display font-bold uppercase text-xl mt-12 mb-4">Ad packages</h2>
      <div className="grid md:grid-cols-[1fr_1.4fr] gap-6 items-start">
        <PackageForm />
        <div className="space-y-2">
          {packages.rows.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-card ring-1 ring-line px-4 py-3 text-sm">
              <span className="text-ink-soft">
                {p.name} <span className="text-muted">· {p.mediums} · {formatMoney(p.daily_rate)}/day · {formatMoney(p.bundle_3_rate)}/3d</span>
              </span>
              <div className="flex gap-2">
                <ActionButton url={`/api/admin/packages/toggle/${p.id}`} label={p.is_active ? 'Pause' : 'Activate'} />
                <ActionButton url={`/api/admin/packages/delete/${p.id}`} label="Delete" tone="danger" confirmText="Delete this package?" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="font-display font-bold uppercase text-xl mt-12 mb-4">Website placements</h2>
      <div className="grid md:grid-cols-[1fr_1.4fr] gap-6 items-start">
        <SlotForm />
        <div className="space-y-2">
          {slots.rows.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl bg-card ring-1 ring-line px-4 py-3 text-sm">
              <span className="text-ink-soft">
                {s.name} <span className="text-muted">· {s.position} · max {s.max_active}</span>
              </span>
              <div className="flex gap-2">
                <ActionButton url={`/api/admin/slots/toggle/${s.id}`} label={s.is_active ? 'Pause' : 'Activate'} />
                <ActionButton url={`/api/admin/slots/delete/${s.id}`} label="Delete" tone="danger" confirmText="Delete this slot?" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
