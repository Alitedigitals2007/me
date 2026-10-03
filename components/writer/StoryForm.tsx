'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import type { Story } from '@/lib/types';

export default function StoryForm({ initialData }: { initialData?: Story | null }) {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params.id;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState(initialData?.title || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || '');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [slug, setSlug] = useState(initialData?.slug || '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setExcerpt(initialData.excerpt);
      setContent(initialData.content);
      setCoverImage(initialData.cover_image);
      setStatus(initialData.status);
      setSlug(initialData.slug);
    }
  }, [initialData]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled';
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const finalSlug = slug || generateSlug(title);
      const fd = new FormData();
      fd.set('title', title);
      fd.set('slug', finalSlug);
      fd.set('excerpt', excerpt);
      fd.set('content', content);
      fd.set('cover_image', coverImage);
      fd.set('status', status);
      if (isEditing) fd.set('id', params.id as string);

      const res = await fetch('/api/writer/stories', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      if (status === 'published' && (!initialData || initialData.status !== 'published')) {
        router.push('/writer/dashboard');
      } else {
        router.push('/writer/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setBusy(false);
    }
  }

  async function handlePublish() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/writer/stories/publish/${params.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      router.push('/writer/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this story permanently?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/writer/stories/delete/${params.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      router.push('/writer/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-card ring-1 ring-line p-5 grid sm:grid-cols-2 gap-4"
    >
      <h3 className="sm:col-span-2 font-display font-bold uppercase text-lg">
        {isEditing ? 'Edit Story' : 'New Story'}
      </h3>

      {error && (
        <div className="sm:col-span-2 mb-4 rounded-xl bg-danger/10 text-danger px-4 py-2.5 text-sm">
          {error}
        </div>
      )}

      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Title *</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Slug</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Auto-generated from title"
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Excerpt</span>
        <textarea
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Content</span>
        <RichTextEditor value={content} onChange={setContent} />
      </div>

      <div className="sm:col-span-2">
        <ImageUploader
          label="Cover image"
          defaultValue={coverImage}
          folder="stories"
          value={coverImage}
          onChange={setCoverImage}
        />
      </div>

      <label>
        <span className="text-xs font-semibold text-ink-soft">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <div className="sm:col-span-2 flex justify-end gap-2">
        <Link href="/writer/dashboard" className="px-5 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line">
          Cancel
        </Link>
        {isEditing && initialData?.status === 'published' ? (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-danger/10 text-danger ring-1 ring-danger/30 disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        ) : isEditing ? (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-danger/10 text-danger ring-1 ring-danger/30 disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={busy || status !== 'published'}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-success/10 text-success ring-1 ring-success/30 disabled:opacity-50"
            >
              {busy ? 'Publishing…' : 'Publish'}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save Draft'}
            </button>
          </>
        ) : (
          <>
            {status === 'published' && (
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-success/10 text-success ring-1 ring-success/30 disabled:opacity-50"
              >
                {busy ? 'Publishing…' : 'Publish Now'}
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : status === 'published' ? 'Save & Publish' : 'Save Draft'}
            </button>
          </>
        )}
      </div>
    </form>
  );
}