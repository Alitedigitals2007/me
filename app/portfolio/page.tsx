import type { Metadata } from 'next';
import Reveal from '@/components/site/Reveal';
import AdSlot from '@/components/site/AdSlot';
import PortfolioExplorer from '@/components/site/PortfolioExplorer';
import { getAllProjects } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { excerpt, parseGallery, parseTags } from '@/lib/utils';
import type { ProjectSummary } from '@/lib/types';

export const metadata: Metadata = { title: 'Portfolio' };

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  const [projects, ads] = await Promise.all([getAllProjects(), loadAds()]);

  const summaries: ProjectSummary[] = projects.map((p) => {
    // the cover is usually also the first gallery shot, so dedupe before counting
    const images = [...new Set([p.image_url, ...parseGallery(p.gallery_images)].filter(Boolean))];
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      summary: excerpt(p.description, 150),
      tags: parseTags(p.stack),
      imageUrl: p.image_url || '',
      liveUrl: p.live_url || '',
      repoUrl: p.repo_url || '',
      featured: !!p.featured,
      orderIndex: p.order_index ?? 0,
      createdAt: p.created_at,
      imageCount: images.length
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] p-7 ring-1 ring-line md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <div className="relative">
            <h1 className="font-display text-4xl font-bold uppercase leading-[1.02] tracking-tight md:text-[2.75rem]">
              <span className="text-gradient">Selected</span> work
            </h1>
            <p className="text-muted mt-2 max-w-lg">
              Spin the globe or flip to the map — every project is an exercise in engineering, designed to
              work in the real world.
            </p>
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-muted">Works</dt>
                <dd className="font-display text-2xl font-bold text-ink">{summaries.length}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-muted">Live sites</dt>
                <dd className="font-display text-2xl font-bold text-accent">
                  {summaries.filter((p) => p.liveUrl).length}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-muted">Tools used</dt>
                <dd className="font-display text-2xl font-bold text-cyan-accent">
                  {new Set(summaries.flatMap((p) => p.tags)).size}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Reveal>

      <PortfolioExplorer projects={summaries} />

      {ads && (
        <div className="mt-16">
          <AdSlot ads={ads} position="sidebar" />
        </div>
      )}
    </div>
  );
}
