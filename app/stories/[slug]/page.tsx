import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdSlot from '@/components/site/AdSlot';
import { SectionHead } from '@/components/site/Cards';
import { getStory } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  return {
    title: story?.title ?? 'Story',
    description: story?.excerpt || story?.content.replace(/<[^>]+>/g, '').slice(0, 160),
    openGraph: {
      title: story?.title ?? 'Story',
      description: story?.excerpt || story?.content.replace(/<[^>]+>/g, '').slice(0, 160),
      images: story?.cover_image ? [story.cover_image] : [],
      type: 'article',
      publishedTime: story?.published_at ?? undefined,
    }
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();
  const ads = await loadAds();

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
        <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-cyan-accent/15 blur-3xl" aria-hidden />
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
        <div className="relative">
          <Link href="/stories" className="text-sm font-semibold text-accent hover:text-accent-2 transition-colors inline-flex items-center gap-1.5">
            ← All stories
          </Link>
          <h1 className="mt-4 font-display font-extrabold uppercase tracking-tight text-[clamp(1.9rem,5vw,3rem)] leading-[1.05]">
            {story.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>{formatDate(story.published_at)}</span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <Link href={`/writer/${story.writer_id}`} className="hover:text-accent transition-colors">{story.writer_name}</Link>
            </span>
          </div>
        </div>
      </div>

      {story.cover_image && (
        <img src={story.cover_image} alt={story.title} className="mt-8 w-full rounded-2xl ring-1 ring-line shadow-card" />
      )}

      <article className="prose-alite mt-8" dangerouslySetInnerHTML={{ __html: story.content }} />

      <div className="mt-12">
        <AdSlot ads={ads} position="story_inline" />
      </div>

      {story.writer_name && (
        <div className="mt-16 border-t border-line pt-8">
          <div className="flex items-start gap-4">
            {story.writer_avatar ? (
              <img src={story.writer_avatar} alt={story.writer_name} className="w-12 h-12 rounded-full ring-1 ring-line object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-paper ring-1 ring-line grid place-items-center font-display font-bold text-xl text-line">✎</div>
            )}
            <div>
              <p className="font-semibold">{story.writer_name}</p>
              <p className="text-sm text-muted">Writer on ALITE</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <AdSlot ads={ads} position="story_bottom" />
      </div>
    </div>
  );
}