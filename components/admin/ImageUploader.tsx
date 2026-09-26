'use client';

import { useRef, useState } from 'react';

export default function ImageUploader({
  name,
  label,
  defaultValue = '',
  folder = 'general',
  value,
  onChange
}: {
  name?: string;
  label?: string;
  defaultValue?: string;
  folder?: string;
  value?: string;
  onChange?: (url: string) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const url = value !== undefined ? value : internal;
  const setUrl = (u: string) => {
    setInternal(u);
    onChange?.(u);
  };
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUrl(data.url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Upload failed');
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      {label && <span className="text-xs font-semibold text-ink-soft">{label}</span>}
      {name && <input type="hidden" name={name} value={url} />}
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {url ? (
          <img src={url} alt="" className="w-20 h-14 rounded-lg object-cover ring-1 ring-line" />
        ) : (
          <span className="w-20 h-14 rounded-lg bg-paper ring-1 ring-line grid place-items-center text-xs text-muted">
            no image
          </span>
        )}
        <label className="px-4 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line text-ink-soft hover:ring-accent/50 cursor-pointer">
          {busy ? 'Uploading…' : url ? 'Change' : 'Upload image'}
          <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
        {url && (
          <button type="button" onClick={() => setUrl('')} className="text-xs font-semibold text-danger">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
