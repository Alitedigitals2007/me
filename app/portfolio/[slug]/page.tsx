import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AdSlot from '@/components/site/AdSlot';
import ProjectGallery from '@/components/site/ProjectGallery';
import { getProject } from '@/lib/data';
import { loadAds } from '@/lib/ads';

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

  let gallery: string[] = [];
  try {
    const arr = JSON.parse(project.gallery_images || '[]');
    if (Array.isArray(arr)) gallery = arr.filter((u): u is string => typeof u === 'string' && !!u);
  } catch {
    gallery = [];
  }
  const images = [project.image_url, ...gallery].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:py-20">
      <Link href="/portfolio" className="text-sm font-semibold text-accent hover:text-accent-2 transition-colors inline-flex items-center gap-1.5">
        ← Back to portfolio
      </Link>
      <h1 className="mt-4 font-display font-extrabold uppercase tracking-tight text-[clamp(2rem,5vw,3.4rem)] leading-none">
        {project.title}
      </h1>
      {project.stack && (
        <p className="mt-3 text-sm font-bold uppercase tracking-widest text-cyan-accent">{project.stack}</p>
      )}

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
