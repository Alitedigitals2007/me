'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import { normalizeTags, slugify, plainText } from '@/lib/utils';
import type { Story } from '@/lib/types';

const CATEGORY_SUGGESTIONS = [
  'Fiction',
  'Poetry',
  'Essay',
  'Non-fiction',
  'Romance',
  'Thriller',
  'Mystery',
  'Sci-Fi',
  'Fantasy',
  'Adventure',
  'Campus Life',
  'Technology',
  'Business',
  'Motivation'
];

const TOPIC_SUGGESTIONS = [
  'Coming of age',
  'Love & relationships',
  'Campus & student life',
  'Faith & purpose',
  'Money & hustle',
  'Tech & the future',
  'Family',
  'Lagos life',
  'Hard lessons',
  'Small wins'
];

type StoryStatus = 'draft' | 'published' | 'scheduled';

/** "2026-11-05T14:30" style value for <input type="datetime-local"> in local time. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [category, setCategory] = useState(initialData?.category || '');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [tags, setTags] = useState(initialData?.tags || '');
  const [status, setStatus] = useState<StoryStatus>(initialData?.status || 'draft');
  const [publishAt, setPublishAt] = useState(toLocalInput(initialData?.publish_at));
  const [slug, setSlug] = useState(initialData?.slug || '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setExcerpt(initialData.excerpt);
      setContent(initialData.content);
      setCoverImage(initialData.cover_image);
      setCategory(initialData.category || '');
      setTopic(initialData.topic || '');
      setTags(initialData.tags || '');
      setStatus(initialData.status);
      setPublishAt(toLocalInput(initialData.publish_at));
      setSlug(initialData.slug);
    }
  }, [initialData]);

  const words = plainText(content).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  async function save(targetStatus: StoryStatus) {
    setBusy(true);
    setError('');
    try {
      if (targetStatus === 'scheduled' && !publishAt) {
        throw new Error('Pick a date and time to schedule this story.');
      }
      const finalSlug = slug || slugify(title);
      const fd = new FormData();
      fd.set('title', title);
      fd.set('slug', finalSlug);
      fd.set('excerpt', excerpt);
      fd.set('content', content);
      fd.set('cover_image', coverImage);
      fd.set('category', category);
      fd.set('topic', topic);
      fd.set('tags', tags);
      fd.set('status', targetStatus);
      if (publishAt) fd.set('publish_at', new Date(publishAt).toISOString());
      if (isEditing) fd.set('id', params.id as string);

      const res = await fetch('/api/writer/stories', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      router.push('/writer/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save(status);
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

      <label>
        <span className="text-xs font-semibold text-ink-soft">Category</span>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list="story-category-suggestions"
          maxLength={60}
          placeholder="Pick one or type your own"
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <datalist id="story-category-suggestions">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <span className="block mt-1 text-[11px] text-muted">Readers browse stories by category.</span>
      </label>

      <label>
        <span className="text-xs font-semibold text-ink-soft">Topic</span>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          list="story-topic-suggestions"
          maxLength={60}
          placeholder="Pick one or type your own"
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <datalist id="story-topic-suggestions">
          {TOPIC_SUGGESTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <span className="block mt-1 text-[11px] text-muted">Themes readers can browse by.</span>
      </label>

      <div className="sm:col-span-2">
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Tags</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. campus, leadership, tech"
            className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <span className="block mt-1 text-[11px] text-muted">Separate tags with commas (max 8).</span>
        {normalizeTags(tags).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {normalizeTags(tags).map((t) => (
              <span key={t} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent ring-1 ring-accent/20">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-ink-soft">Content</span>
          <span className="text-[11px] text-muted">
            {words.toLocaleString()} words · ~{minutes} min read
          </span>
        </div>
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
          onChange={(e) => setStatus(e.target.value as StoryStatus)}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </label>

      {status === 'scheduled' && (
        <label>
          <span className="text-xs font-semibold text-ink-soft">Publish at</span>
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <span className="block mt-1 text-[11px] text-muted">Goes live automatically at this time.</span>
        </label>
      )}

      <div className="sm:col-span-2 flex flex-wrap justify-end gap-2">
        <Link href="/writer/dashboard" className="px-5 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line">
          Cancel
        </Link>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-danger/10 text-danger ring-1 ring-danger/30 disabled:opacity-50"
          >
            Delete
          </button>
        )}
        {status === 'published' ? (
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-success/10 text-success ring-1 ring-success/30 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save & Publish'}
          </button>
        ) : status === 'scheduled' ? (
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-warning/15 text-warning-strong ring-1 ring-warning/30 disabled:opacity-50"
          >
            {busy ? 'Scheduling…' : 'Schedule'}
          </button>
        ) : (
          <>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => { setStatus('published'); save('published'); }}
              disabled={busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
            >
              {busy ? 'Publishing…' : 'Publish'}
            </button>
          </>
        )}
      </div>
    </form>
  );
}