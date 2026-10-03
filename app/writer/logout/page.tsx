'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WriterLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/writer/logout', { method: 'POST' }).finally(() => {
      router.push('/writer/login');
      router.refresh();
    });
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-card ring-1 ring-line shadow-card p-8 text-center">
        <p className="text-sm text-muted">Logging out…</p>
      </div>
    </div>
  );
}