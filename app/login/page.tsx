'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<'admin' | 'student'>(params.get('role') === 'student' ? 'student' : 'admin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(role === 'admin' ? '/api/admin/login' : '/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const next = params.get('next');
      router.push(next && next.startsWith('/') ? next : role === 'admin' ? '/admin' : '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setBusy(false);
    }
  }

  const isAdmin = role === 'admin';
  const active = 'rounded-full bg-card shadow-card text-ink';
  const idle = 'rounded-full text-muted hover:text-ink';

  return (
    <div className="min-h-screen grid place-items-center px-5 py-16">
      <form
        onSubmit={onSubmit}
        className="relative overflow-hidden w-full max-w-sm rounded-3xl bg-card ring-1 ring-line shadow-card p-8"
      >
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
        <span className="absolute -top-20 -right-14 h-40 w-40 rounded-full bg-accent/15 blur-3xl" aria-hidden />

        <div className="relative grid grid-cols-2 gap-1 rounded-full bg-paper ring-1 ring-line p-1 mb-6 text-sm font-bold">
          <button type="button" onClick={() => setRole('admin')} className={isAdmin ? active : idle}>
            Admin
          </button>
          <button type="button" onClick={() => setRole('student')} className={!isAdmin ? active : idle}>
            Student
          </button>
        </div>

        <h1 className="relative font-display font-extrabold uppercase text-3xl text-center">
          {isAdmin ? 'Admin' : 'Academy'}<span className="text-gradient">.</span>
        </h1>
        <p className="text-sm text-muted text-center mt-1 mb-6">
          {isAdmin ? 'Sign in to manage alite.site' : 'Access your courses and certificates'}
        </p>
        {error && <p className="mb-4 rounded-xl bg-danger/10 text-danger px-4 py-2.5 text-sm">{error}</p>}
        <label className="block mb-4">
          <span className="text-sm font-semibold text-ink-soft">{isAdmin ? 'Email or username' : 'Email'}</span>
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
          {busy ? 'Signing in…' : isAdmin ? 'Sign in' : 'Enter dashboard'}
        </button>
        <p className="text-xs text-muted text-center mt-5">
          {isAdmin ? (
            <>
              Student?{' '}
              <button type="button" onClick={() => setRole('student')} className="text-accent font-semibold">
                Log in to the Academy →
              </button>
            </>
          ) : (
            <>
              New student?{' '}
              <a href="/academy/signup" className="text-accent font-semibold">
                Create an account →
              </a>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
