import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import AdSlot from '@/components/site/AdSlot';
import { SectionHead } from '@/components/site/Cards';
import { getPublishedStories } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Stories' };

export const dynamic = 'force-dynamic';

export default async function StoriesPage() {
  const [stories, ads] = await Promise.all([getPublishedStories(), loadAds()]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-cyan-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <SectionHead asPage className="mb-0 relative" title="Stories" sub="Fiction, personal essays, and creative writing from our community." />
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stories.map((s, i) => (
          <Reveal key={s.id} delay={(i % 3) * 0.08}>
            <StoryCard s={s} />
          </Reveal>
        ))}
      </div>
      {!stories.length && (
        <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-10 text-center">No stories published yet.</p>
      )}

      <div className="mt-14">
        <AdSlot ads={ads} position="sidebar" />
      </div>
    </div>
  );
}

function StoryCard({ s }: { s: any }) {
  return (
    <Link
      href={`/stories/${s.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-line hover:ring-accent/40 shadow-card hover:shadow-lift hover:-translate-y-1.5 transition-all duration-300"
    >
      <div className="relative overflow-hidden aspect-[16/9] bg-paper">
        {s.cover_image ? (
          <img src={s.cover_image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center font-display font-bold text-3xl text-line">✎</div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <p className="text-xs text-muted">{formatDate(s.published_at)}</p>
        <h3 className="font-display font-bold text-lg leading-snug group-hover:text-accent transition-colors">{s.title}</h3>
        <p className="text-sm text-muted line-clamp-2 flex-1">{s.excerpt || (s.content?.replace(/<[^>]+>/g, '') ?? '').slice(0, 120)}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {s.writer_name}
          </span>
        </div>
      </div>
    </Link>
  );
}