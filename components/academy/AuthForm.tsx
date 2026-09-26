'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function FormInner({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/student/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signup' ? { name, email, password } : { email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === 'signup' && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            className="w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your name"
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-cta text-white font-semibold py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-60"
      >
        {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
      </button>
      <p className="text-sm text-muted text-center">
        {mode === 'signup' ? (
          <>Already have an account? <Link href={`/academy/login?next=${encodeURIComponent(next)}`} className="text-accent font-semibold">Log in</Link></>
        ) : (
          <>New to the Academy? <Link href={`/academy/signup?next=${encodeURIComponent(next)}`} className="text-accent font-semibold">Create an account</Link></>
        )}
      </p>
    </form>
  );
}

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  return (
    <Suspense>
      <FormInner mode={mode} />
    </Suspense>
  );
}
