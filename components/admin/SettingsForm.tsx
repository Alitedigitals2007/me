'use client';

import { useEffect, useState } from 'react';

const FIELDS: { key: string; label: string; type?: string; textarea?: boolean; image?: boolean }[] = [
  { key: 'site_name', label: 'Site name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'hero_name', label: 'Hero name' },
  { key: 'hero_title', label: 'Hero title' },
  { key: 'hero_bio', label: 'Hero bio', textarea: true },
  { key: 'hero_photo', label: 'Hero photo', image: true },
  { key: 'about_bio', label: 'About bio', textarea: true },
  { key: 'social_twitter', label: 'Twitter URL' },
  { key: 'social_github', label: 'GitHub URL' },
  { key: 'social_linkedin', label: 'LinkedIn URL' },
  { key: 'social_instagram', label: 'Instagram URL' },
  { key: 'contact_email', label: 'Contact email' },
  { key: 'contact_whatsapp', label: 'WhatsApp number (with country code)' },
  { key: 'telegram_chat_id', label: 'Telegram chat ID (for alerts)' },
  { key: 'og_image', label: 'OG image', image: true },
  { key: 'marketplace_listing_fee', label: 'Marketplace listing fee (₦)' }
];

export default function SettingsForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings').then((r) => r.json()).then((s) => {
      setValues(Object.fromEntries(FIELDS.map((f) => [f.key, String(s[f.key] ?? '')])));
    }).catch(() => {});
  }, []);

  async function uploadImage(key: string, file: File) {
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'settings');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setValues((v) => ({ ...v, [key]: data.url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Upload failed');
    }
    setUploading(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      window.alert('Save failed');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
      {FIELDS.map((f) => (
        <label key={f.key} className={f.textarea || f.image ? 'sm:col-span-2' : ''}>
          <span className="text-xs font-semibold text-ink-soft">{f.label}</span>
          {f.image ? (
            <span className="mt-1 flex flex-wrap items-center gap-3">
              {values[f.key] && (
                <img src={values[f.key]} alt="" className="w-20 h-14 rounded-lg object-cover ring-1 ring-line" />
              )}
              <label className="px-4 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line text-ink-soft hover:ring-accent/50 cursor-pointer">
                {uploading === f.key ? 'Uploading…' : values[f.key] ? 'Change' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(f.key, file);
                    e.target.value = '';
                  }}
                />
              </label>
              {values[f.key] && (
                <button
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, [f.key]: '' }))}
                  className="text-xs font-semibold text-danger"
                >
                  Remove
                </button>
              )}
            </span>
          ) : f.textarea ? (
            <textarea
              rows={3}
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          ) : (
            <input
              type={f.type || 'text'}
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          )}
        </label>
      ))}
      <div className="sm:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="px-8 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="text-sm font-semibold text-success">Saved ✓</span>}
      </div>
    </form>
  );
}
