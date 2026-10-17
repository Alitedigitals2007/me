'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Mode = 'login' | 'signup';
type SignupRole = 'student' | 'writer';

const SIGNUP_ROLES: { value: SignupRole; label: string; icon: string; blurb: string }[] = [
  { value: 'student', label: 'Student', icon: '🎓', blurb: 'Take courses, submit work, earn certificates' },
  { value: 'writer', label: 'Writer', icon: '✍️', blurb: 'Write and publish stories (admin approval required)' }
];

function UnifiedAuth() {
  const router = useRouter();
  const params = useSearchParams();

  const roleParam = params.get('role');
  const initialRole: SignupRole = roleParam === 'writer' ? 'writer' : 'student';
  const [mode, setMode] = useState<Mode>(
    params.get('mode') === 'signup' && (roleParam === 'student' || roleParam === 'writer') ? 'signup' : 'login'
  );
  const [signupRole, setSignupRole] = useState<SignupRole>(initialRole);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const res =
        mode === 'login'
          ? await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: email, password })
            })
          : await fetch('/api/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: signupRole, name, email, password })
            });

      const data = await res.json();

      if (!res.ok) {
        if (data.pending) {
          switchMode('login');
          setNotice(data.error);
          setEmail(email);
          setBusy(false);
          return;
        }
        throw new Error(data.error || (mode === 'login' ? 'Login failed' : 'Signup failed'));
      }

      if (data.pending) {
        switchMode('login');
        setNotice(data.message || 'Application submitted! You will be able to log in once an admin approves it.');
        setEmail(email);
        setBusy(false);
        return;
      }

      const next = params.get('next');
      const redirectTo = next && next.startsWith('/') ? next : data.redirect || '/';
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen grid place-items-center px-5 py-16 overflow-hidden">
      <span className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[36rem] rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 -right-24 h-64 w-64 rounded-full bg-cyan-accent/10 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-card ring-1 ring-line shadow-card p-8">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <span className="absolute -top-20 -right-14 h-40 w-40 rounded-full bg-accent/15 blur-3xl" aria-hidden />

          {/* Mode toggle */}
          <div className="relative grid grid-cols-2 gap-1 rounded-full bg-paper ring-1 ring-line p-1 mb-7 text-sm font-bold">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`rounded-full px-3 py-2.5 transition-all ${
                mode === 'login' ? 'bg-accent text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'text-muted hover:text-ink'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => switchMode('signup')}
              className={`rounded-full px-3 py-2.5 transition-all ${
                mode === 'signup' ? 'bg-accent text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'text-muted hover:text-ink'
              }`}
            >
              Create account
            </button>
          </div>

          <h1 className="relative font-display font-extrabold uppercase text-3xl text-center">
            {mode === 'login' ? 'Welcome back' : 'Join ALITE'}
            <span className="text-gradient">.</span>
          </h1>
          <p className="text-sm text-muted text-center mt-2 mb-7">
            {mode === 'login'
              ? 'Sign in with your email — or username if you are an admin.'
              : 'Tell us what you want to register for.'}
          </p>

          {error && (
            <p className="mb-4 rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm font-medium flex gap-2">
              <span aria-hidden>⚠</span>
              <span>{error}</span>
            </p>
          )}
          {notice && (
            <p className="mb-4 rounded-xl bg-emerald-500/10 text-emerald-700 px-4 py-3 text-sm font-medium flex gap-2">
              <span aria-hidden>✓</span>
              <span>{notice}</span>
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <span className="text-sm font-semibold text-ink-soft">I want to join as</span>
                <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
                  {SIGNUP_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      role="radio"
                      aria-checked={signupRole === r.value}
                      onClick={() => setSignupRole(r.value)}
                      className={`rounded-2xl px-4 py-3.5 text-left ring-1 transition-all ${
                        signupRole === r.value
                          ? 'bg-accent/10 ring-accent/50 shadow-[0_4px_12px_rgba(79,70,229,0.12)]'
                          : 'bg-paper ring-line hover:ring-accent/30'
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold text-sm">
                        <span aria-hidden>{r.icon}</span>
                        {r.label}
                      </span>
                      <span className="block mt-1 text-xs text-muted leading-snug">{r.blurb}</span>
                    </button>
                  ))}
                </div>
                {signupRole === 'writer' && (
                  <p className="mt-2 text-xs text-muted">
                    Writer accounts are reviewed by an admin before you can publish.
                  </p>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <label className="block">
                <span className="text-sm font-semibold text-ink-soft">Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
                  placeholder="Your name"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-ink-soft">
                {mode === 'login' ? 'Email or username' : 'Email'}
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                type={mode === 'login' ? 'text' : 'email'}
                autoComplete={mode === 'login' ? 'username' : 'email'}
                className="mt-1.5 w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 outline-none focus:ring-2 focus:ring-accent transition-shadow"
                placeholder={mode === 'login' ? 'you@example.com or username' : 'you@example.com'}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink-soft">Password</span>
              <span className="relative block mt-1.5">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 pr-16 outline-none focus:ring-2 focus:ring-accent transition-shadow"
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-1 my-1 px-3 rounded-lg text-xs font-semibold text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-cta text-white font-semibold py-3 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {busy
                ? mode === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'login'
                  ? 'Sign in'
                  : `Sign up as ${signupRole === 'writer' ? 'a writer' : 'a student'}`}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-xs text-muted text-center mt-5">
              New here?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="text-accent font-semibold">
                Create an account →
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p className="text-xs text-muted text-center mt-5">
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')} className="text-accent font-semibold">
                Sign in →
              </button>
            </p>
          )}
        </div>

        <p className="text-center mt-5">
          <Link href="/" className="text-xs font-semibold text-muted hover:text-accent transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <UnifiedAuth />
    </Suspense>
  );
}
