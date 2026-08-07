'use client';

import { useEffect, useState } from 'react';
import ActionButton from '@/components/admin/ActionButton';
import SocialIcon, { SOCIAL_PLATFORMS } from '@/components/site/SocialIcon';
import type { SocialAccount } from '@/lib/types';

export default function SocialManager() {
  const [items, setItems] = useState<SocialAccount[]>([]);
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState(SOCIAL_PLATFORMS[0]);
  const [url, setUrl] = useState('');

  async function refresh() {
    const res = await fetch('/api/admin/socials');
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!platform.trim() || !url.trim()) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('platform', platform);
      fd.set('url', url);
      const res = await fetch('/api/admin/socials', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      setUrl('');
      await refresh();
    } catch {
      window.alert('Save failed');
    }
    setBusy(false);
  }

  return (
    <div className="mt-10">
      <h2 className="font-display font-bold uppercase text-xl mb-4">Social media accounts</h2>
      <div className="grid md:grid-cols-[1fr_1.4fr] gap-6 items-start">
        <form onSubmit={add} className="rounded-2xl bg-card ring-1 ring-line p-5 grid gap-3">
          <h3 className="font-display font-bold uppercase">Add account</h3>
          <label>
            <span className="text-xs font-semibold text-ink-soft">Platform *</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold text-ink-soft">Profile URL *</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50">
            {busy ? 'Saving…' : 'Add account'}
          </button>
        </form>

        <div className="space-y-2">
          {items.length ? (
            items.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-card ring-1 ring-line px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${s.is_active ? 'bg-accent/10 text-accent' : 'bg-paper text-muted'}`}>
                    <SocialIcon platform={s.platform} size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{s.platform}</p>
                    <p className="text-xs text-muted truncate">{s.url}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <ActionButton url={`/api/admin/socials/toggle/${s.id}`} label={s.is_active ? 'Hide' : 'Show'} />
                  <ActionButton url={`/api/admin/socials/delete/${s.id}`} label="Delete" tone="danger" confirmText="Delete this account?" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">No social accounts yet — add your first one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
