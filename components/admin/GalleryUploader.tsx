'use client';

import { useRef, useState } from 'react';

export default function GalleryUploader({
  name,
  label,
  defaultValue = '[]',
  folder = 'projects'
}: {
  name: string;
  label?: string;
  defaultValue?: string;
  folder?: string;
}) {
  const [images, setImages] = useState<string[]>(() => {
    try {
      const arr = JSON.parse(defaultValue);
      return Array.isArray(arr) ? arr.filter((u) => typeof u === 'string') : [];
    } catch {
      return [];
    }
  });
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', folder);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        uploaded.push(data.url);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Upload failed');
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-2.5">
        {images.map((url, i) => (
          <div key={`${url}-${i}`} className="relative">
            <img src={url} alt="" className="w-24 h-16 rounded-lg object-cover ring-1 ring-line" />
            <button
              type="button"
              onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-danger text-white text-xs font-bold grid place-items-center shadow"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
        <label className="w-24 h-16 rounded-lg bg-paper ring-1 ring-line grid place-items-center text-xs font-semibold text-muted hover:ring-accent/50 cursor-pointer">
          {busy ? '…' : '+ Add'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFiles}
          />
        </label>
      </div>
      <p className="text-xs text-muted mt-1.5">Click an image to remove it. Shown as a gallery on the project page.</p>
    </div>
  );
}
