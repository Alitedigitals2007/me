'use client';

import { useState } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';
import type { AdPackage, AdSlot } from '@/lib/types';
import { formatMoney } from '@/lib/utils';

const DURATIONS = Array.from({ length: 14 }, (_, i) => i + 1);

function packageTotal(pkg: AdPackage, days: number): number {
  if (days === 3) return Number(pkg.bundle_3_rate);
  return Number(pkg.daily_rate) * days;
}

export default function AdvertiseForm({ packages, slots }: { packages: AdPackage[]; slots: AdSlot[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pkgId, setPkgId] = useState(packages[0]?.id ?? 0);
  const [days, setDays] = useState(1);
  const [slotId, setSlotId] = useState(slots[0]?.id ?? 0);

  const pkg = packages.find((p) => p.id === Number(pkgId));
  const needsSlot = pkg ? pkg.mediums.split(',').map((m) => m.trim()).includes('website') : false;
  const total = pkg ? packageTotal(pkg, days) : 0;

  const mediumLabels: Record<string, string> = {
    website: 'Website',
    channel: 'Channel',
    status: 'Status'
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/ads/submit', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6 md:p-8">
      <h2 className="font-display font-bold uppercase text-2xl">Book an ad</h2>
      <p className="text-muted mt-1 mb-6 text-sm">
        Pick where your ad runs, choose 1–14 days, and I approve it before it goes live.
      </p>
      {error && <p className="mb-4 rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm">{error}</p>}
      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-2.5">
          {packages.map((p) => (
            <label
              key={p.id}
              className={`flex items-start gap-3 rounded-2xl ring-1 p-4 cursor-pointer transition-all ${
                Number(pkgId) === p.id ? 'ring-accent bg-accent/5' : 'ring-line bg-paper hover:ring-accent/40'
              }`}
            >
              <input
                type="radio"
                name="package_id"
                value={p.id}
                checked={Number(pkgId) === p.id}
                onChange={() => setPkgId(p.id)}
                className="mt-1 accent-[var(--color-accent)]"
              />
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-sm">{p.name}</span>
                  <span className="font-display font-bold text-accent text-sm">
                    {formatMoney(p.daily_rate)}/day · {formatMoney(p.bundle_3_rate)}/3 days
                  </span>
                </span>
                <span className="block text-xs text-muted mt-1">{p.description}</span>
                <span className="flex flex-wrap gap-1.5 mt-2">
                  {p.mediums.split(',').map((m) => m.trim()).filter(Boolean).map((m) => (
                    <span key={m} className="text-[11px] font-bold uppercase tracking-widest bg-accent/8 text-accent px-2.5 py-0.5 rounded-full">
                      {mediumLabels[m] ?? m}
                    </span>
                  ))}
                </span>
              </span>
            </label>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-ink-soft">Duration *</span>
          <select
            name="duration_days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 focus:ring-2 focus:ring-accent outline-none transition-shadow"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}{d === 3 ? ' (bundle price)' : ''}</option>
            ))}
          </select>
        </label>
        {needsSlot ? (
          <label className="block">
            <span className="text-sm font-semibold text-ink-soft">Website placement *</span>
            <select
              name="slot_id"
              value={slotId}
              onChange={(e) => setSlotId(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 focus:ring-2 focus:ring-accent outline-none transition-shadow"
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="slot_id" value="" />
        )}
        <label className="block">
          <span className="text-sm font-semibold text-ink-soft">Your name / business *</span>
          <input name="advertiser_name" required className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 focus:ring-2 focus:ring-accent outline-none transition-shadow" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-soft">Email or phone *</span>
          <input name="contact" required className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 focus:ring-2 focus:ring-accent outline-none transition-shadow" />
        </label>
        <div className="sm:col-span-2">
          <ImageUploader name="image_url" label="Ad image *" folder="ads" />
        </div>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-ink-soft">Link your ad points to *</span>
          <input name="target_url" placeholder="https://..." required className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 focus:ring-2 focus:ring-accent outline-none transition-shadow" />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4 mt-2">
          <p className="font-display font-bold text-2xl text-accent">
            Total: <span className="text-gradient">{formatMoney(total)}</span>
            <span className="block text-xs text-muted font-normal mt-1">for {days} day{days > 1 ? 's' : ''}</span>
          </p>
          <button
            type="submit"
            disabled={busy || !pkg}
            className="bg-gradient-cta text-white font-semibold px-8 py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 transition-all"
          >
            {busy ? 'Taking you to payment…' : 'Continue to payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
