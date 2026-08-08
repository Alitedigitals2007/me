'use client';

import { useRef, useState } from 'react';

interface FileUploaderProps {
  name: string;
  label?: string;
  defaultValue?: string;
  folder?: string;
  accept?: string;
}

export default function FileUploader({
  name,
  label,
  defaultValue = '',
  folder = 'general',
  accept = '*/*'
}: FileUploaderProps) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setFileName(file.name);
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
      setFileName('');
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  const isImage = url && url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  return (
    <div>
      {label && <span className="text-xs font-semibold text-ink-soft">{label}</span>}
      <input type="hidden" name={name} value={url} />
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {url ? (
          <div className="flex items-center gap-2">
            {isImage ? (
              <img src={url} alt="" className="w-20 h-14 rounded-lg object-cover ring-1 ring-line" />
            ) : (
              <div className="w-20 h-14 rounded-lg bg-paper ring-1 ring-line grid place-items-center text-xs text-muted font-mono">
                📄
              </div>
            )}
            <span className="text-sm text-ink-soft truncate max-w-xs">{fileName || url.split('/').pop()}</span>
          </div>
        ) : (
          <span className="w-20 h-14 rounded-lg bg-paper ring-1 ring-line grid place-items-center text-xs text-muted">
            no file
          </span>
        )}
        <label className="px-4 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line text-ink-soft hover:ring-accent/50 cursor-pointer">
          {busy ? 'Uploading…' : url ? 'Change' : 'Upload file'}
          <input ref={inputRef} type="file" accept={accept} onChange={onFile} className="hidden" />
        </label>
        {url && (
          <button type="button" onClick={() => { setUrl(''); setFileName(''); }} className="text-xs font-semibold text-danger">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}