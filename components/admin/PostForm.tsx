'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import type { BlogPost } from '@/lib/types';

export default function PostForm({ editing }: { editing?: BlogPost | null }) {
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState(String(editing?.content ?? ''));
  const p = editing as (BlogPost & Record<string, unknown>) | null;

  async function generateDraft() {
    if (!topic.trim()) return;
    setAiBusy(true);
    try {
      const res = await fetch('/api/admin/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      const excerpt = document.querySelector('textarea[name="excerpt"]') as HTMLTextAreaElement;
      if (excerpt) excerpt.value = data.excerpt;
      setContent(data.content);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'AI draft failed');
    }
    setAiBusy(false);
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const fd = new FormData(e.currentTarget);
          fd.set('content', content);
          if (p) fd.set('id', String(p.id));
          const res = await fetch('/api/admin/posts', { method: 'POST', body: fd });
          if (!res.ok) throw new Error();
          window.location.href = '/admin/blog';
        } catch {
          window.alert('Save failed');
          setBusy(false);
        }
      }}
      className="rounded-2xl bg-card ring-1 ring-line p-5 grid sm:grid-cols-2 gap-4"
    >
      <h3 className="sm:col-span-2 font-display font-bold uppercase text-lg">{p ? 'Edit post' : 'New post'}</h3>

      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Title *</span>
        <input name="title" required defaultValue={String(p?.title ?? '')} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Excerpt</span>
        <textarea name="excerpt" rows={2} defaultValue={String(p?.excerpt ?? '')} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <div className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Content</span>
        <RichTextEditor value={content} onChange={setContent} />
      </div>
      <div className="sm:col-span-2">
        <ImageUploader name="cover_image" label="Cover image" defaultValue={String(p?.cover_image ?? '')} folder="posts" />
      </div>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Tags (comma separated)</span>
        <input name="tags" defaultValue={String(p?.tags ?? '')} placeholder="tech, leadership" className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Status</span>
        <select name="status" defaultValue={String(p?.status ?? 'draft')} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Publish date (for scheduled)</span>
        <input name="publish_at" type="datetime-local" defaultValue={String(p?.publish_at_local ?? '')} className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
      </label>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <a href="/admin/blog" className="px-5 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line">Cancel</a>
        <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50">
          {busy ? 'Saving…' : 'Save post'}
        </button>
      </div>

      <div className="sm:col-span-2 border-t border-line pt-4 flex flex-wrap gap-2 items-center">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="AI draft — e.g. why I left WordPress for Next.js"
          className="flex-1 min-w-[220px] rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={generateDraft}
          disabled={aiBusy || !topic.trim()}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-accent/10 text-accent ring-1 ring-accent/30 disabled:opacity-50"
        >
          {aiBusy ? 'Writing…' : '✨ Generate draft'}
        </button>
      </div>
    </form>
  );
}
