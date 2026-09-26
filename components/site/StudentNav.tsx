'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function StudentNav() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/student/me')
      .then((r) => r.json())
      .then((d) => setName(d.student?.name ?? null))
      .catch(() => {});
  }, []);

  if (!name) return null;

  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3.5 py-2 text-sm font-semibold ring-1 ring-accent/30 hover:bg-accent/15 transition-all"
      title={`${name} — student dashboard`}
    >
      <span aria-hidden>🎓</span>
      <span className="hidden sm:inline">Dashboard</span>
    </Link>
  );
}
