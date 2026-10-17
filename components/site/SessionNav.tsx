'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Session = { kind: 'student' | 'admin' | 'writer'; name: string } | null;

export default function SessionNav() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, a, w] = await Promise.all([
          fetch('/api/student/me').then((r) => r.json()),
          fetch('/api/admin/me').then((r) => r.json()),
          fetch('/api/writer/me').then((r) => r.json())
        ]);
        if (!alive) return;
        if (a?.admin) setSession({ kind: 'admin', name: a.admin.username });
        else if (s?.student) setSession({ kind: 'student', name: s.student.name });
        else if (w?.writer) setSession({ kind: 'writer', name: w.writer.name });
        else setSession(null);
      } catch {
        if (alive) setSession(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname]);

  async function logout() {
    if (busy || !session) return;
    setBusy(true);
    try {
      if (session.kind === 'admin') await fetch('/api/admin/logout', { method: 'POST' });
      else if (session.kind === 'student') await fetch('/api/student/logout', { method: 'POST' });
      else if (session.kind === 'writer') await fetch('/api/writer/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setSession(null);
    setBusy(false);
    window.location.href = '/';
  }

  if (session === null) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="inline-flex items-center rounded-full ring-1 ring-line px-3.5 sm:px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink hover:ring-accent/50 transition-all"
        >
          Log in
        </Link>
        <Link
          href="/login?mode=signup"
          className="inline-flex items-center rounded-full bg-gradient-cta text-white text-sm font-semibold px-3.5 sm:px-4 py-2 shadow-[0_8px_24px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const routes = {
    admin: { href: '/admin', label: 'Admin' },
    student: { href: '/dashboard', label: 'Dashboard' },
    writer: { href: '/writer/dashboard', label: 'Writer' }
  };
  const route = routes[session.kind];
  const initial = (session.name || route.label).trim().charAt(0).toUpperCase() || 'A';
  return (
    <div className="flex items-center gap-2">
      <Link
        href={route.href}
        title={`${session.name} — ${route.label.toLowerCase()}`}
        className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent px-2 sm:px-2.5 sm:pr-3.5 py-1.5 text-sm font-semibold ring-1 ring-accent/30 hover:bg-accent/15 transition-all"
      >
        <span className="grid place-items-center w-7 h-7 rounded-full bg-gradient-cta text-white text-xs font-bold" aria-hidden>
          {initial}
        </span>
        <span className="hidden sm:inline">{route.label}</span>
      </Link>
      <button
        onClick={logout}
        disabled={busy}
        className="inline-flex items-center rounded-full ring-1 ring-line px-3.5 py-2 text-sm font-semibold text-muted hover:text-danger hover:ring-danger/40 transition-all disabled:opacity-60"
      >
        {busy ? '…' : 'Log out'}
      </button>
    </div>
  );
}
