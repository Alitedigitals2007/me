'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';
import type { AdPackage, AdSlot } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';

const STATUSES: { value: string; label: string }[] = [
  { value: 'approved', label: 'Approved — go live now' },
  { value: 'paid', label: 'Paid — awaiting approval' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' }
];

export type EditingAd = {
  id: number;
  advertiser_name: string;
  contact: string;
  image_url: string;
  target_url: string;
  caption?: string;
  package_id: number | null;
  slot_id: number | null;
  mediums: string;
  duration_days: number;
  start_date: string | Date;
  amount_paid: string | number;
  paystack_ref: string;
  status: string;
};

function toDateInput(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  const s = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

export default function AdForm({
  slots,
  packages,
  editing
}: {
  slots: AdSlot[];
  packages: AdPackage[];
  editing?: EditingAd | null;
}) {
  const [busy, setBusy] = useState(false);
  const [packageId, setPackageId] = useState(editing?.package_id ? String(editing.package_id) : '');
  const [days, setDays] = useState(editing?.duration_days ?? 7);
  const [startDate, setStartDate] = useState(() =>
    editing ? toDateInput(editing.start_date) : new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = useState(() => String(editing?.amount_paid ?? '0'));
  const autoAmount = useRef(false);

  const pkg = packages.find((p) => String(p.id) === packageId);
  const suggestedAmount = useMemo(() => {
    if (!pkg) return 0;
    return days === 3 ? Number(pkg.bundle_3_rate) : Number(pkg.daily_rate) * days;
  }, [pkg, days]);

  useEffect(() => {
    if (!autoAmount.current) return;
    setAmount(String(suggestedAmount));
  }, [suggestedAmount]);

  const endDate = useMemo(() => {
    const d = new Date(`${startDate}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return '';
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }, [startDate, days]);

  const mediums = pkg?.mediums
    ? pkg.mediums.split(',').map((m) => m.trim()).filter(Boolean)
    : [];

  const isEdit = Boolean(editing?.id);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const fd = new FormData(e.currentTarget);
          if (isEdit) fd.set('id', String(editing!.id));
          const res = await fetch('/api/admin/ads', {
            method: isEdit ? 'PUT' : 'POST',
            body: fd
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Save failed');
          window.location.href = '/admin/ads?filter=all';
        } catch (err) {
          window.alert(err instanceof Error ? err.message : 'Save failed');
          setBusy(false);
        }
      }}
      className="rounded-2xl bg-card ring-1 ring-line p-5 grid sm:grid-cols-2 gap-4"
    >
      <div className="sm:col-span-2">
        <h3 className="font-display font-bold uppercase text-lg">
          {isEdit ? `Edit advert #${editing!.id}` : 'Add advert manually'}
        </h3>
        <p className="text-xs text-muted mt-1">
          {isEdit
            ? 'Update the advert — changes go live as soon as they are saved.'
            : 'Create a complete advert — image, destination link, placement, dates and payment status — without the advertiser going through checkout.'}
        </p>
      </div>

      <label>
        <span className="text-xs font-semibold text-ink-soft">Advertiser name *</span>
        <input
          name="advertiser_name"
          required
          defaultValue={editing?.advertiser_name ?? ''}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Email or phone *</span>
        <input
          name="contact"
          required
          defaultValue={editing?.contact ?? ''}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="sm:col-span-2">
        <ImageUploader name="image_url" label="Ad image *" folder="ads" defaultValue={editing?.image_url ?? ''} />
      </div>

      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Link the ad points to *</span>
        <input
          name="target_url"
          type="url"
          required
          defaultValue={editing?.target_url ?? ''}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Brief message (shown with the advert)</span>
        <textarea
          name="caption"
          rows={2}
          maxLength={200}
          defaultValue={editing?.caption ?? ''}
          placeholder="e.g. 50% off all courses — this weekend only"
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="mt-1 block text-[11px] text-muted">
          Appears under the ad image with a “Promotion” badge. Max 200 characters.
        </span>
      </label>

      <label>
        <span className="text-xs font-semibold text-ink-soft">Package</span>
        <select
          name="package_id"
          value={packageId}
          onChange={(e) => {
            autoAmount.current = true;
            setPackageId(e.target.value);
          }}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Custom — no package</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {formatMoney(p.daily_rate)}/day
            </option>
          ))}
        </select>
        {mediums.length > 0 && (
          <span className="mt-1 block text-[11px] text-muted">Runs on: {mediums.join(', ')}</span>
        )}
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Website placement</span>
        <select
          name="slot_id"
          defaultValue={editing?.slot_id ? String(editing.slot_id) : ''}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">No website placement (off-site / custom)</option>
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.position}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Mediums (optional)</span>
        <input
          name="mediums"
          defaultValue={editing?.mediums ?? ''}
          placeholder="website, channel, status — ignored when a package is selected"
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label>
        <span className="text-xs font-semibold text-ink-soft">Duration (days)</span>
        <input
          name="duration_days"
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => {
            autoAmount.current = true;
            setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)));
          }}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Start date</span>
        <input
          name="start_date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <p className="sm:col-span-2 rounded-lg bg-accent/5 ring-1 ring-accent/15 px-3 py-2 text-xs text-ink-soft">
        Runs {formatDate(startDate)} → {formatDate(endDate)} ({days} day{days > 1 ? 's' : ''})
        {pkg ? <> · suggested price <strong>{formatMoney(suggestedAmount)}</strong></> : null}
      </p>

      <label>
        <span className="text-xs font-semibold text-ink-soft">Amount paid (₦)</span>
        <input
          name="amount_paid"
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Status</span>
        <select
          name="status"
          defaultValue={editing?.status ?? 'approved'}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Payment reference (optional)</span>
        <input
          name="paystack_ref"
          defaultValue={editing?.paystack_ref ?? ''}
          placeholder="e.g. ad_abc123 — leave blank for manual / cash payment"
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted">
          Approved ads with a website placement and today&apos;s dates appear on the site immediately.
        </p>
        <div className="flex gap-2">
          <a href="/admin/ads" className="px-5 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line">
            Cancel
          </a>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : isEdit ? 'Update advert' : 'Save advert'}
          </button>
        </div>
      </div>
    </form>
  );
}
