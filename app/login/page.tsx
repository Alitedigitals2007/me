'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Role = 'admin' | 'student' | 'writer';
type Mode = 'login' | 'signup';

const ROLES: { value: Role; label: string; icon: string; description: string }[] = [
  { value: 'admin', label: 'Admin', icon: '⚙️', description: 'Manage site, blog, ads, marketplace' },
  { value: 'writer', label: 'Writer', icon: '✍️', description: 'Write and publish stories' },
  { value: 'student', label: 'Student', icon: '🎓', description: 'Access courses and certificates' },
];

const roleEndpoints = {
  admin: { login: '/api/admin/login', signup: null, redirect: '/admin' },
  student: { login: '/api/student/login', signup: '/api/student/signup', redirect: '/dashboard' },
  writer: { login: '/api/writer/login', signup: '/api/writer/signup', redirect: '/writer/dashboard' },
};

function UnifiedAuth() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState<Role>((params.get('role') as Role) || 'admin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  const endpoints = roleEndpoints[role];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const body: Record<string, string> = {
        email: fd.get('email') as string,
        password: fd.get('password') as string,
      };
      if (mode === 'signup') {
        body.name = fd.get('name') as string;
      }
      const res = await fetch(endpoints[mode === 'login' ? 'login' : 'signup']!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (mode === 'login' ? 'Login failed' : 'Signup failed'));
      
      const next = params.get('next');
      const redirectTo = next && next.startsWith('/') ? next : endpoints.redirect;
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : (mode === 'login' ? 'Login failed' : 'Signup failed'));
      setBusy(false);
    }
  }

  const selectedRole = ROLES.find(r => r.value === role)!;
  const canSignup = !!endpoints.signup;

  return (
    <div className="min-h-screen grid place-items-center px-5 py-16">
      <div className="relative overflow-hidden w-full max-w-md rounded-3xl bg-card ring-1 ring-line shadow-card p-8">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
        <span className="absolute -top-20 -right-14 h-40 w-40 rounded-full bg-accent/15 blur-3xl" aria-hidden />

        {/* Role Tabs */}
        <div className="flex gap-1 mb-6" role="tablist">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="tab"
              aria-selected={role === r.value}
              onClick={() => { setRole(r.value); setError(''); }}
              className={`flex-1 flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                role === r.value
                  ? 'bg-accent text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]'
                  : 'text-muted hover:text-ink hover:bg-ink/5'
              }`}
            >
              <span aria-hidden>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Mode Toggle (Login/Signup) */}
        {canSignup && (
          <div className="relative grid grid-cols-2 gap-1 rounded-full bg-paper ring-1 ring-line p-1 mb-6 text-sm font-bold">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => { setMode('login'); setError(''); }}
              className={`rounded-full px-3 py-2 transition-all ${
                mode === 'login' ? 'bg-accent text-white' : 'text-muted hover:text-ink'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => { setMode('signup'); setError(''); }}
              className={`rounded-full px-3 py-2 transition-all ${
                mode === 'signup' ? 'bg-accent text-white' : 'text-muted hover:text-ink'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <h1 className="relative font-display font-extrabold uppercase text-3xl text-center">
          {selectedRole.label}<span className="text-gradient">.</span>
        </h1>
        <p className="text-sm text-muted text-center mt-1 mb-6">{selectedRole.description}</p>

        {error && <p className="mb-4 rounded-xl bg-danger/10 text-danger px-4 py-2.5 text-sm">{error}</p>}

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="text-sm font-semibold text-ink-soft">Name</span>
              <input
                name="name"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
                placeholder="Your name"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-ink-soft">Email</span>
            <input
              name="email"
              type="email"
              required
              autoFocus={mode === 'login'}
              className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-soft">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gradient-cta text-white font-semibold py-3 rounded-full disabled:opacity-50 transition-all"
          >
            {busy ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <p className="text-xs text-muted text-center mt-5">
          {mode === 'login' ? (
            canSignup ? (
              <>
                New {selectedRole.label.toLowerCase()}?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-accent font-semibold">
                  Create an account →
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setRole('student')} className="text-accent font-semibold">
                  Student? Log in to Academy →
                </button>
                {' | '}
                <button type="button" onClick={() => setRole('writer')} className="text-accent font-semibold">
                  Writer? Join as Writer →
                </button>
              </>
            )
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-accent font-semibold">
                Sign in →
              </button>
            </>
          )}
        </p>

        <div className="mt-4 pt-4 border-t border-line flex gap-2 justify-center text-xs">
          {ROLES.filter(r => r.value !== role).map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => { setRole(r.value); setError(''); }}
              className="text-muted hover:text-accent font-semibold"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><UnifiedAuth /></Suspense>;
}