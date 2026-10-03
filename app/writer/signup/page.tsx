'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/writer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fd.get('name'), email: fd.get('email'), password: fd.get('password') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      setSuccess(true);
      if (data.pending) {
        setTimeout(() => router.push('/writer/login?pending=1'), 2000);
      } else {
        router.push('/writer/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
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
          Writer<span className="text-gradient">.</span>
        </h1>
        <p className="text-sm text-muted text-center mt-1 mb-6">Create your writer account</p>

        {success && (
          <div className="mb-4 rounded-xl bg-success/10 text-success px-4 py-2.5 text-sm">
            Account created! Your application is pending admin approval.
          </div>
        )}
        {error && <p className="mb-4 rounded-xl bg-danger/10 text-danger px-4 py-2.5 text-sm">{error}</p>}

        <label className="block mb-4">
          <span className="text-sm font-semibold text-ink-soft">Name</span>
          <input
            name="name"
            required
            autoFocus
            className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-semibold text-ink-soft">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
          />
        </label>
        <label className="block mb-6">
          <span className="text-sm font-semibold text-ink-soft">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
          />
        </label>
        <button
          type="submit"
          disabled={busy || success}
          className="w-full bg-gradient-cta text-white font-semibold py-3 rounded-full disabled:opacity-50 transition-all"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-xs text-muted text-center mt-5">
          Already have an account?{' '}
          <button type="button" onClick={() => router.push('/writer/login')} className="text-accent font-semibold">
            Log in →
          </button>
        </p>
      </form>
    </div>
  );
}

export default function WriterSignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}