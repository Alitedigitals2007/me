'use client';

import { useEffect, useRef, useState } from 'react';

const BTN =
  'px-2.5 py-1.5 rounded-lg text-sm font-bold bg-paper ring-1 ring-line hover:ring-accent/50 transition-all disabled:opacity-50';

export default function RichTextEditor({
  value,
  onChange
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function run(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? '');
  }

  function link() {
    const url = window.prompt('Link URL (https://...)');
    if (url) run('createLink', url);
  }

  async function uploadImage(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'posts');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      run('insertImage', data.url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Upload failed');
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-1.5 mb-2">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('bold')} className={BTN} title="Bold">B</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('italic')} className={`${BTN} italic`} title="Italic">I</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('underline')} className={`${BTN} underline`} title="Underline">U</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'h2')} className={BTN} title="Heading 2">H2</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'h3')} className={BTN} title="Heading 3">H3</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'p')} className={BTN} title="Paragraph">¶</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertUnorderedList')} className={BTN} title="Bullet list">• List</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertOrderedList')} className={BTN} title="Numbered list">1. List</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'blockquote')} className={BTN} title="Quote">❝</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={link} className={BTN} title="Insert link">Link</button>
        <label className={`${BTN} cursor-pointer`} title="Insert image">
          {busy ? 'Uploading…' : 'Image'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage(f);
            }}
          />
        </label>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        className="prose-alite min-h-[280px] w-full rounded-lg bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
        data-placeholder="Write your post here…"
      />
    </div>
  );
}
