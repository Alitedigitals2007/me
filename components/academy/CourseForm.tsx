'use client';

import { useState } from 'react';

export default function CourseForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('0');
  const [status, setStatus] = useState('published');
  const [delivery, setDelivery] = useState('internal');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/academy/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, price: Number(price) || 0, status, delivery, level, duration, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      window.location.href = `/admin/courses/${data.item.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white shadow-[0_6px_16px_rgba(79,70,229,0.3)]">
        + New course
      </button>
    );
  }

  return (
    <form onSubmit={create} className="rounded-2xl bg-card ring-1 ring-line p-5 space-y-3 w-full max-w-2xl">
      <p className="text-xs font-black uppercase tracking-widest text-accent">New course</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Course title" className="rounded-xl bg-paper ring-1 ring-line px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} step="100" placeholder="Price (0 = free)" className="rounded-xl bg-paper ring-1 ring-line px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl bg-paper ring-1 ring-line px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent">
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className="rounded-xl bg-paper ring-1 ring-line px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent">
          <option value="internal">Hosted here (lessons + certificates)</option>
          <option value="external">External link only</option>
        </select>
        <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Level (e.g. Beginner)" className="rounded-xl bg-paper ring-1 ring-line px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent" />
        <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (e.g. 6 weeks)" className="rounded-xl bg-paper ring-1 ring-line px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description" className="w-full rounded-xl bg-paper ring-1 ring-line px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent" />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-60">
          {loading ? 'Creating…' : 'Create & open studio'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold ring-1 ring-line">Cancel</button>
      </div>
    </form>
  );
}
