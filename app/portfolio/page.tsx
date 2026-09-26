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
        <SectionHead asPage title="Selected work" sub="Every project is an exercise in engineering — designed to work in the real world." />
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
