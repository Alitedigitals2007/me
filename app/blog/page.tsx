import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import AdSlot from '@/components/site/AdSlot';
import { BlogCard, SectionHead } from '@/components/site/Cards';
import { getPublishedPosts } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Blog' };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const posts = await getPublishedPosts(tag);
  const ads = await loadAds();

  const allTags = [...new Set(
    posts.flatMap((p) => p.tags.split(',').map((t) => t.trim()).filter(Boolean))
  )];

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <SectionHead title="The blog" sub="Writing on technology, student leadership and building in public." />
      </Reveal>

      {allTags.length > 0 && (
        <Reveal>
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/blog"
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-semibold ring-1 transition-all',
                !tag ? 'bg-accent text-white ring-accent' : 'bg-card ring-line text-muted hover:text-ink'
              )}
            >
              All
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-semibold ring-1 transition-all',
                  tag === t ? 'bg-accent text-white ring-accent' : 'bg-card ring-line text-muted hover:text-ink'
                )}
              >
                #{t}
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.08}>
            <BlogCard p={p} />
          </Reveal>
        ))}
      </div>
      {!posts.length && (
        <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-10 text-center">No posts here yet.</p>
      )}

      <div className="mt-14">
        <AdSlot ads={ads} position="sidebar" />
      </div>
    </div>
  );
}
