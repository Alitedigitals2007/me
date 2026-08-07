'use client';

import { useState } from 'react';

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login';
      }}
      className={
        compact
          ? 'shrink-0 text-sm font-semibold text-danger disabled:opacity-50'
          : 'w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-danger hover:bg-danger/10 transition-colors disabled:opacity-50'
      }
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
