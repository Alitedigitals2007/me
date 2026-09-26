import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AdSlot from '@/components/site/AdSlot';
import ProjectGallery from '@/components/site/ProjectGallery';
import { getProject } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { parseGallery } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  return { title: project?.title ?? 'Project', description: project?.description.replace(/<[^>]+>/g, '').slice(0, 160) };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const ads = await loadAds();

  const gallery = parseGallery(project.gallery_images);
  const images = [project.image_url, ...gallery].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
        <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
        <div className="relative">
          <Link href="/portfolio" className="text-sm font-semibold text-accent hover:text-accent-2 transition-colors inline-flex items-center gap-1.5">
            ← Back to portfolio
          </Link>
          <h1 className="mt-4 font-display font-extrabold uppercase tracking-tight text-[clamp(2rem,5vw,3.4rem)] leading-none">
            {project.title}
          </h1>
          {project.stack && (
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-cyan-accent">{project.stack}</p>
          )}
        </div>
      </div>

      <ProjectGallery images={images} alt={project.title} />

      <div className="prose-alite mt-8" dangerouslySetInnerHTML={{ __html: project.description }} />

      {(project.live_url || project.repo_url) && (
        <div className="mt-10 flex flex-wrap gap-3">
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="bg-gradient-cta text-white font-semibold px-7 py-3 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all">
              Visit live site ↗
            </a>
          )}
          {project.repo_url && (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="font-semibold px-7 py-3 rounded-full bg-white ring-1 ring-line text-ink hover:ring-accent hover:-translate-y-0.5 transition-all">
              View source ↗
            </a>
          )}
        </div>
      )}

      <div className="mt-14">
        <AdSlot ads={ads} position="sidebar" />
      </div>
    </div>
  );
}
