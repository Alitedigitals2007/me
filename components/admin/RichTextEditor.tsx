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
  const savedRange = useRef<Range | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function rememberSelection() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !ref.current) return;
    if (ref.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function focusEditor() {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || !savedRange.current) return;
    try {
      if (el.contains(savedRange.current.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
    } catch {
      savedRange.current = null;
    }
  }

  function run(cmd: string, arg?: string) {
    focusEditor();
    document.execCommand(cmd, false, arg);
    rememberSelection();
    onChange(ref.current?.innerHTML ?? '');
  }

  function link() {
    const url = window.prompt('Link URL (https://...)');
    if (url) run('createLink', url);
  }

  function insertImageBlock(url: string) {
    const root = ref.current;
    if (!root) return;
    focusEditor();

    const id = `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const html = `<figure class="editor-figure" data-editor-image="${id}"><img src="${url.replace(
      /"/g,
      '&quot;'
    )}" alt=""></figure><p><br></p>`;

    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel?.rangeCount && root.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0);
    } else if (savedRange.current && root.contains(savedRange.current.commonAncestorContainer)) {
      range = savedRange.current.cloneRange();
    }

    let anchorBlock: Element | null = null;
    let insertAfter = false;

    if (!range) {
      root.insertAdjacentHTML('beforeend', html);
    } else {
      let block: Node | null = range.startContainer === root ? null : range.startContainer;
      while (block && block.parentNode !== root) block = block.parentNode;

      if (block instanceof Element && sel) {
        anchorBlock = block;
        const probe = range.cloneRange();
        probe.selectNodeContents(block);
        probe.setEnd(range.startContainer, range.startOffset);
        insertAfter = probe.toString().trim().length > 0;

        const boundary = document.createRange();
        if (insertAfter) boundary.setStartAfter(block);
        else boundary.setStartBefore(block);
        boundary.collapse(true);
        sel.removeAllRanges();
        sel.addRange(boundary);
      }

      document.execCommand('insertHTML', false, html);
    }

    let figure = root.querySelector(`figure[data-editor-image="${id}"]`);
    if (!figure) {
      const fig = document.createElement('figure');
      fig.className = 'editor-figure';
      fig.setAttribute('data-editor-image', id);
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      fig.appendChild(img);
      const p = document.createElement('p');
      p.appendChild(document.createElement('br'));
      if (anchorBlock && anchorBlock.parentNode === root) {
        if (insertAfter) anchorBlock.after(fig, p);
        else anchorBlock.before(fig, p);
      } else {
        root.append(fig, p);
      }
      figure = fig;
    }

    if (figure) {
      let caretTarget = figure.nextElementSibling;
      if (!(caretTarget instanceof HTMLParagraphElement)) {
        const p = document.createElement('p');
        p.appendChild(document.createElement('br'));
        figure.after(p);
        caretTarget = p;
      }
      if (caretTarget instanceof HTMLParagraphElement && sel) {
        const caret = document.createRange();
        caret.selectNodeContents(caretTarget);
        caret.collapse(true);
        sel.removeAllRanges();
        sel.addRange(caret);
        savedRange.current = caret.cloneRange();
      }
      figure.removeAttribute('data-editor-image');
    }

    onChange(root.innerHTML);
  }

  async function uploadImage(file: File) {
    rememberSelection();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'posts');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      insertImageBlock(data.url);
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
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            rememberSelection();
            fileRef.current?.click();
          }}
          disabled={busy}
          className={BTN}
          title="Insert a picture between paragraphs"
        >
          {busy ? 'Uploading…' : 'Insert image'}
        </button>
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
      </div>
      <p className="text-[11px] text-muted mb-2">
        Tip: click between two paragraphs, then <strong>Insert image</strong> — the picture is placed right there.
      </p>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          rememberSelection();
          onChange(ref.current?.innerHTML ?? '');
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onFocus={rememberSelection}
        className="prose-alite min-h-[280px] w-full rounded-lg bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
        data-placeholder="Write your post here…"
      />
    </div>
  );
}
