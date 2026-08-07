import ActionButton from '@/components/admin/ActionButton';
import ListingForm from '@/components/admin/ListingForm';
import pool from '@/lib/db';
import { formatMoney } from '@/lib/utils';

export const metadata = { title: 'Marketplace' };

export default async function MarketplacePage() {
  const { rows } = await pool.query('SELECT * FROM marketplace_listings ORDER BY created_at DESC');
  return (
    <div>
      <h1 className="font-display font-extrabold uppercase text-3xl">Marketplace</h1>
      <div className="mt-6 grid md:grid-cols-[1fr_1.6fr] gap-6 items-start">
        <ListingForm />
        <div className="space-y-2">
          {rows.length ? (
            rows.map((l) => (
              <div key={l.id} className="rounded-xl bg-card ring-1 ring-line px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-sm truncate">
                    {l.title} <span className="text-muted font-normal">· {formatMoney(l.price)}</span>
                    {l.category && <span className="text-xs text-accent font-bold"> ({l.category})</span>}
                    {l.is_own && <span className="text-xs text-accent font-bold"> (mine)</span>}
                  </p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    l.status === 'active' ? 'bg-success/10 text-success' :
                    l.status === 'sold' ? 'bg-paper ring-1 ring-line text-muted' :
                    l.status === 'rejected' ? 'bg-danger/10 text-danger' :
                    'bg-warning/15 text-warning-strong'
                  }`}>
                    {l.status}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1 truncate">
                  {l.owner_name || l.owner_contact || 'you'}{l.paystack_ref ? ` · ref ${l.paystack_ref}` : ''}
                </p>
                <div className="flex gap-2 mt-2.5">
                  {(l.status === 'pending' || l.status === 'rejected') && (
                    <>
                      <ActionButton url={`/api/admin/listings/approve/${l.id}`} label="Approve" tone="success" />
                      <ActionButton url={`/api/admin/listings/reject/${l.id}`} label="Reject" tone="danger" />
                    </>
                  )}
                  {l.status === 'active' && (
                    <ActionButton url={`/api/admin/listings/sold/${l.id}`} label="Mark sold" />
                  )}
                  <ActionButton url={`/api/admin/listings/delete/${l.id}`} label="Delete" tone="danger" confirmText="Delete this listing?" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">No listings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
