'use client';

import { useState } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';

export default function ListingForm() {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const res = await fetch('/api/admin/listings', { method: 'POST', body: new FormData(e.currentTarget) });
          if (!res.ok) throw new Error();
          window.location.reload();
        } catch {
          window.alert('Save failed');
          setBusy(false);
        }
      }}
      className="rounded-2xl bg-card ring-1 ring-line p-5 grid sm:grid-cols-2 gap-3"
    >
      <h3 className="sm:col-span-2 font-display font-bold uppercase text-lg">Add a product (goes live immediately)</h3>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Title *</span>
        <input name="title" required className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Description</span>
        <textarea name="description" rows={3} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Price (₦)</span>
        <input name="price" type="number" className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Category</span>
        <input name="category" placeholder="e.g. Course, Design, Service" className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Buy / detail link (optional)</span>
        <input name="link" placeholder="https://..." className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <div className="sm:col-span-2">
        <ImageUploader name="image_url" label="Image" folder="marketplace" />
      </div>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Contact</span>
        <input name="owner_contact" className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <div className="flex items-end justify-end">
        <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50">
          {busy ? 'Saving…' : 'Add product'}
        </button>
      </div>
    </form>
  );
}
