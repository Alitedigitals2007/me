'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteCommentButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm('Delete this comment?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/writer/story-comments/${id}`, { method: 'POST' });
      if (res.status === 401) {
        window.location.href = '/writer/login';
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        window.alert(data?.error || 'Delete failed');
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      window.alert('Delete failed');
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-danger/10 text-danger ring-1 ring-danger/30 hover:bg-danger/15 disabled:opacity-50"
    >
      {busy ? '…' : 'Delete'}
    </button>
  );
}
