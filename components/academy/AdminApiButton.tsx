'use client';

import { useState } from 'react';

export default function AdminApiButton({
  url,
  method = 'POST',
  body,
  label,
  tone = 'normal',
  confirmText
}: {
  url: string;
  method?: 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
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
          const res = await fetch(url, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
          });
          if (res.status === 401) {
            window.location.href = '/login?next=/admin';
            return;
          }
          const data = await res.json().catch(() => null);
          if (!res.ok) {
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
