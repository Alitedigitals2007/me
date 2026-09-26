'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Session = { kind: 'student' | 'admin'; name: string } | null;

export default function SessionNav() {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([
          fetch('/api/student/me').then((r) => r.json()),
          fetch('/api/admin/me').then((r) => r.json())
        ]);
        if (!alive) return;
        if (s?.student) setSession({ kind: 'student', name: s.student.name });
        else if (a?.admin) setSession({ kind: 'admin', name: a.admin.username });
        else setSession(null);
      } catch {
        if (alive) setSession(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    if (busy || !session) return;
    setBusy(true);
    try {
      await fetch(session.kind === 'admin' ? '/api/admin/logout' : '/api/student/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setSession(null);
    setBusy(false);
    window.location.href = '/';
  }

  if (session === undefined) return <span className="w-16" aria-hidden />;

  if (session === null) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-full ring-1 ring-line px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink hover:ring-accent/50 transition-all"
      >
        Login
      </Link>
    );
  }

  const href = session.kind === 'admin' ? '/admin' : '/dashboard';
  const label = session.kind === 'admin' ? 'Admin' : 'Dashboard';
  return (
    <div className="flex items-center gap-2">
      <Link
        href={href}
        title={`${session.name} — ${label.toLowerCase()}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3.5 py-2 text-sm font-semibold ring-1 ring-accent/30 hover:bg-accent/15 transition-all"
      >
        <span aria-hidden>{session.kind === 'admin' ? '⚙️' : '🎓'}</span>
        <span className="hidden sm:inline">{label}</span>
      </Link>
      <button
        onClick={logout}
        disabled={busy}
        className="inline-flex items-center rounded-full ring-1 ring-line px-3.5 py-2 text-sm font-semibold text-muted hover:text-danger hover:ring-danger/40 transition-all disabled:opacity-60"
      >
        {busy ? '…' : 'Logout'}
      </button>
    </div>
  );
}
