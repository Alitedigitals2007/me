import type { Metadata } from 'next';
import Reveal from '@/components/site/Reveal';
import AdSlot from '@/components/site/AdSlot';
import { ProjectCard, SectionHead } from '@/components/site/Cards';
import { getAllProjects } from '@/lib/data';
import { loadAds } from '@/lib/ads';

export const metadata: Metadata = { title: 'Portfolio' };

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  const [projects, ads] = await Promise.all([getAllProjects(), loadAds()]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <SectionHead asPage className="mb-0 relative" title="Selected work" sub="Every project is an exercise in engineering — designed to work in the real world." />
        </div>
      </Reveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.08}>
            <ProjectCard p={p} />
          </Reveal>
        ))}
      </div>
      {!projects.length && (
        <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-10 text-center">Projects coming soon.</p>
      )}
      <div className="mt-14">
        <AdSlot ads={ads} position="sidebar" />
      </div>
    </div>
  );
}
