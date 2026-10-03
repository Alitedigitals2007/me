'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Session = { kind: 'student' | 'admin' | 'writer'; name: string } | null;

export default function SessionNav() {
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
        if (s?.student) setSession({ kind: 'student', name: s.student.name });
        else if (a?.admin) setSession({ kind: 'admin', name: a.admin.username });
        else if (w?.writer) setSession({ kind: 'writer', name: w.writer.name });
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
          href="/login?role=writer"
          className="inline-flex items-center rounded-full ring-1 ring-line px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink hover:ring-accent/50 transition-all"
        >
          Writer
        </Link>
        <Link
          href="/login?role=writer&mode=signup"
          className="inline-flex items-center rounded-full bg-gradient-cta text-white text-sm font-semibold px-4 py-2"
        >
          Join
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center rounded-full ring-1 ring-line px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink hover:ring-accent/50 transition-all"
        >
          Admin
        </Link>
        <Link
          href="/login?role=student"
          className="inline-flex items-center rounded-full ring-1 ring-line px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink hover:ring-accent/50 transition-all"
        >
          Student
        </Link>
      </div>
    );
  }

  const routes = {
    admin: { href: '/admin', label: 'Admin', icon: '⚙️' },
    student: { href: '/dashboard', label: 'Dashboard', icon: '🎓' },
    writer: { href: '/writer/dashboard', label: 'Writer', icon: '✍️' }
  };
  const route = routes[session.kind];
  return (
    <div className="flex items-center gap-2">
      <Link
        href={route.href}
        title={`${session.name} — ${route.label.toLowerCase()}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3.5 py-2 text-sm font-semibold ring-1 ring-accent/30 hover:bg-accent/15 transition-all"
      >
        <span aria-hidden>{route.icon}</span>
        <span className="hidden sm:inline">{route.label}</span>
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
