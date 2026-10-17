import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import AdSlot from '@/components/site/AdSlot';
import StoryCard from '@/components/site/StoryCard';
import { SectionHead } from '@/components/site/Cards';
import { searchPublishedStories, getStoryCategories } from '@/lib/data';
import { loadAds } from '@/lib/ads';

export const metadata: Metadata = { title: 'Stories' };

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  category?: string;
  tag?: string;
  author?: string;
}

export default async function StoriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filters = {
    q: String(sp.q || '').trim(),
    category: String(sp.category || '').trim(),
    tag: String(sp.tag || '').trim(),
    author: String(sp.author || '').trim()
  };
  const hasFilters = Object.values(filters).some(Boolean);

  const [stories, categories, ads] = await Promise.all([
    searchPublishedStories(filters),
    getStoryCategories(),
    loadAds()
  ]);

  const buildQuery = (patch: Partial<typeof filters>) => {
    const merged = { ...filters, ...patch };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/stories?${qs}` : '/stories';
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-cyan-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <SectionHead asPage className="mb-0 relative" title="Stories" sub="Fiction, personal essays, and creative writing from our community." />

          <form method="GET" action="/stories" className="relative mt-7 flex flex-col sm:flex-row gap-2">
            {filters.category && <input type="hidden" name="category" value={filters.category} />}
            {filters.author && <input type="hidden" name="author" value={filters.author} />}
            {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
            <label className="relative flex-1">
              <span className="sr-only">Search stories</span>
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder="Search by title, author, category or tag…"
                className="w-full rounded-full bg-card ring-1 ring-line pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent transition-shadow"
              />
            </label>
            <button type="submit" className="rounded-full bg-gradient-cta text-white text-sm font-semibold px-6 py-3 shadow-[0_8px_24px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all">
              Search
            </button>
          </form>
        </div>
      </Reveal>

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted mr-1">Categories</span>
          <Link
            href={buildQuery({ category: '' })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ring-1 transition-all ${
              !filters.category ? 'bg-accent text-white ring-accent' : 'bg-card ring-line text-muted hover:text-ink hover:ring-accent/40'
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={buildQuery({ category: c })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ring-1 transition-all ${
                filters.category.toLowerCase() === c.toLowerCase()
                  ? 'bg-accent text-white ring-accent'
                  : 'bg-card ring-line text-muted hover:text-ink hover:ring-accent/40'
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {hasFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} found
          </span>
          {filters.q && <FilterPill label={`“${filters.q}”`} clearHref={buildQuery({ q: '' })} />}
          {filters.author && <FilterPill label={`Author: ${filters.author}`} clearHref={buildQuery({ author: '' })} />}
          {filters.tag && <FilterPill label={`#${filters.tag}`} clearHref={buildQuery({ tag: '' })} />}
          <Link href="/stories" className="text-accent font-semibold hover:text-accent-2 transition-colors">
            Clear all
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {stories.map((s, i) => (
          <Reveal key={s.id} delay={(i % 3) * 0.08}>
            <StoryCard s={s} />
          </Reveal>
        ))}
      </div>
      {!stories.length && (
        <div className="rounded-2xl bg-card ring-1 ring-line p-10 text-center mt-8">
          <p className="text-muted">
            {hasFilters ? 'No stories match your search.' : 'No stories published yet.'}
          </p>
          {hasFilters && (
            <Link href="/stories" className="inline-block mt-3 text-sm font-semibold text-accent hover:text-accent-2 transition-colors">
              Browse all stories →
            </Link>
          )}
        </div>
      )}

      <div className="mt-14">
        <AdSlot ads={ads} position="sidebar" />
      </div>
    </div>
  );
}

function FilterPill({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold ring-1 ring-accent/20">
      {label}
      <Link href={clearHref} aria-label={`Clear ${label}`} className="hover:text-accent-2 transition-colors">
        ✕
      </Link>
    </span>
  );
}
