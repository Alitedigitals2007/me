'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/admin/ImageUploader';

interface Props {
  initialName: string;
  initialBio: string;
  initialAvatar: string;
  email: string;
  status: string;
}

export default function ProfileForm({ initialName, initialBio, initialAvatar, email, status }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const fd = new FormData();
      fd.set('name', name);
      fd.set('bio', bio);
      fd.set('avatar_url', avatar);
      const res = await fetch('/api/writer/profile', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-card ring-1 ring-line p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-4">
        {avatar ? (
          <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-1 ring-line" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-paper ring-1 ring-line grid place-items-center font-display font-bold text-2xl text-line">
            {name.charAt(0).toUpperCase() || '✎'}
          </div>
        )}
        <div>
          <p className="font-semibold">{name || 'Your name'}</p>
          <p className="text-xs text-muted">{email} · <span className="capitalize">{status}</span></p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-danger/10 text-danger px-4 py-2.5 text-sm">{error}</p>}
      {saved && <p className="rounded-xl bg-success/10 text-success px-4 py-2.5 text-sm">Profile updated.</p>}

      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">Display name *</span>
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">Bio</span>
        <textarea
          rows={4}
          maxLength={600}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short introduction readers will see on your stories."
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="block mt-1 text-[11px] text-muted">{bio.length}/600</span>
      </label>

      <ImageUploader label="Avatar" folder="writers" value={avatar} onChange={setAvatar} />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}
