'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-5 py-16">
      <form
        onSubmit={onSubmit}
        className="relative overflow-hidden w-full max-w-sm rounded-3xl bg-card ring-1 ring-line shadow-card p-8"
      >
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
        <span className="absolute -top-20 -right-14 h-40 w-40 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <h1 className="relative font-display font-extrabold uppercase text-3xl text-center">
          Admin<span className="text-gradient">.</span>
        </h1>
        <p className="text-sm text-muted text-center mt-1 mb-6">Sign in to manage alite.site</p>
        {error && <p className="mb-4 rounded-xl bg-danger/10 text-danger px-4 py-2.5 text-sm">{error}</p>}
        <label className="block mb-4">
          <span className="text-sm font-semibold text-ink-soft">Email or username</span>
          <input
            name="email"
            required
            autoFocus
            className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
          />
        </label>
        <label className="block mb-6">
          <span className="text-sm font-semibold text-ink-soft">Password</span>
          <input
            name="password"
            type="password"
            required
            className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-cta text-white font-semibold py-3 rounded-full disabled:opacity-50 transition-all"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
