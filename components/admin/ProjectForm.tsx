'use client';

import { useState } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';
import GalleryUploader from '@/components/admin/GalleryUploader';
import type { Project } from '@/lib/types';

export default function ProjectForm({ editing }: { editing?: Project | null }) {
  const [busy, setBusy] = useState(false);
  const p = editing as (Project & Record<string, unknown>) | null;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const fd = new FormData(e.currentTarget);
          if (p) fd.set('id', String(p.id));
          const res = await fetch('/api/admin/projects', { method: 'POST', body: fd });
          const data = await res.json().catch(() => null);
          if (!res.ok) throw new Error(data?.error || 'Save failed');
          window.location.href = '/admin/projects';
        } catch {
          window.alert('Save failed');
          setBusy(false);
        }
      }}
      className="rounded-2xl bg-card ring-1 ring-line p-5 grid sm:grid-cols-2 gap-4"
    >
      <h3 className="sm:col-span-2 font-display font-bold uppercase text-lg">{p ? 'Edit project' : 'New project'}</h3>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Title *</span>
        <input name="title" required defaultValue={String(p?.title ?? '')} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Description</span>
        <textarea name="description" rows={3} defaultValue={String(p?.description ?? '')} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Stack (comma separated)</span>
        <input name="stack" defaultValue={String(p?.stack ?? '')} placeholder="Next.js, Tailwind, Postgres" className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <div className="sm:col-span-2">
        <ImageUploader name="image_url" label="Cover image" defaultValue={String(p?.image_url ?? '')} folder="projects" />
      </div>
      <div className="sm:col-span-2">
        <GalleryUploader name="gallery_images" label="Gallery images" defaultValue={String(p?.gallery_images ?? '[]')} folder="projects" />
      </div>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Live URL</span>
        <input name="live_url" defaultValue={String(p?.live_url ?? '')} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Repo URL</span>
        <input name="repo_url" defaultValue={String(p?.repo_url ?? '')} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Order</span>
        <input name="order_index" type="number" defaultValue={String(p?.order_index ?? 0)} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label className="flex items-end gap-2 pb-2">
        <input name="featured" type="checkbox" defaultChecked={!!p?.featured} className="w-4 h-4 accent-accent" />
        <span className="text-xs font-semibold text-ink-soft">Featured</span>
      </label>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <a href="/admin/projects" className="px-5 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line">Cancel</a>
        <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50">
          {busy ? 'Saving…' : 'Save project'}
        </button>
      </div>
    </form>
  );
}
