'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/contact', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="rounded-3xl bg-success/8 ring-1 ring-success/30 p-8 text-center">
        <p className="text-3xl mb-2">✓</p>
        <p className="font-display font-bold text-lg">Message sent!</p>
        <p className="text-sm text-muted mt-1">I&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6 md:p-8 grid sm:grid-cols-2 gap-4">
      {error && <p className="sm:col-span-2 rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm">{error}</p>}
      <label className="block">
        <span className="text-sm font-semibold text-ink-soft">Name *</span>
        <input name="name" required className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 focus:ring-2 focus:ring-accent outline-none transition-shadow" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink-soft">Email *</span>
        <input name="email" type="email" required className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 focus:ring-2 focus:ring-accent outline-none transition-shadow" />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold text-ink-soft">Message *</span>
        <textarea name="message" rows={5} required className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 focus:ring-2 focus:ring-accent outline-none transition-shadow" />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-gradient-cta text-white font-semibold px-8 py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 disabled:opacity-60 transition-all"
        >
          {busy ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  );
}
