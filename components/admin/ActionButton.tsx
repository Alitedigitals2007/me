'use client';

import { useState } from 'react';

export default function ActionButton({
  url,
  label,
  tone = 'normal',
  confirmText
}: {
  url: string;
  label: string;
  tone?: 'normal' | 'danger' | 'success';
  confirmText?: string;
}) {
  const [busy, setBusy] = useState(false);
  const tones = {
    normal: 'bg-paper ring-1 ring-line text-ink-soft hover:ring-accent/50',
    danger: 'bg-danger/10 text-danger ring-1 ring-danger/30 hover:bg-danger/15',
    success: 'bg-success/10 text-success ring-1 ring-success/30 hover:bg-success/15'
  };
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (confirmText && !window.confirm(confirmText)) return;
        setBusy(true);
        try {
          const res = await fetch(url, { method: 'POST' });
          if (res.status === 401) {
            setBusy(false);
            window.alert('Session expired — please log in again.');
            window.location.href = '/login?next=/admin';
            return;
          }
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            setBusy(false);
            window.alert(data?.error || 'Action failed');
            return;
          }
          window.location.reload();
        } catch {
          setBusy(false);
          window.alert('Action failed');
        }
      }}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${tones[tone]}`}
    >
      {busy ? '…' : label}
    </button>
  );
}
