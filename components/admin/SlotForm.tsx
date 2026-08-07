'use client';

import { useState } from 'react';

export default function SlotForm() {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const res = await fetch('/api/admin/slots', { method: 'POST', body: new FormData(e.currentTarget) });
          if (!res.ok) throw new Error();
          window.location.reload();
        } catch {
          window.alert('Save failed');
          setBusy(false);
        }
      }}
      className="rounded-2xl bg-card ring-1 ring-line p-5 grid gap-3"
    >
      <h3 className="font-display font-bold uppercase">Add / update slot</h3>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Name</span>
        <input name="name" required className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Position (unique key)</span>
        <input name="position" required placeholder="home_banner / sidebar / blog_inline" className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="text-xs font-semibold text-ink-soft">Price / day (₦)</span>
          <input name="price_per_day" type="number" required className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <label>
          <span className="text-xs font-semibold text-ink-soft">Max active ads</span>
          <input name="max_active" type="number" defaultValue={1} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
        </label>
      </div>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Description</span>
        <input name="description" className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <button type="submit" disabled={busy} className="mt-1 px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50">
        {busy ? 'Saving…' : 'Save slot'}
      </button>
    </form>
  );
}
