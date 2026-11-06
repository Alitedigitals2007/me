'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteStoryButton({
  id,
  title,
  compact = false
}: {
  id: number;
  title: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${title}" permanently? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/writer/stories/delete/${id}`, { method: 'POST' });
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

  if (compact) {
    return (
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        title="Delete story"
        aria-label="Delete story"
        className="text-xs font-semibold text-danger hover:text-danger/80 disabled:opacity-50"
      >
        {busy ? '…' : 'Delete'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="px-5 py-2 rounded-lg text-sm font-semibold bg-danger/10 text-danger ring-1 ring-danger/30 hover:bg-danger/15 disabled:opacity-50"
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}
