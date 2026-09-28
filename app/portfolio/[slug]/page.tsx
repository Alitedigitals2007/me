import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AdSlot from '@/components/site/AdSlot';
import ProjectGallery from '@/components/site/ProjectGallery';
import { getAllProjects, getProject } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { excerpt, formatDate, parseGallery, parseTags } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: 'Project not found' };
  return {
    title: project.title,
    description: excerpt(project.description, 160),
    openGraph: {
      title: project.title,
      description: excerpt(project.description, 160),
      images: project.image_url ? [project.image_url] : undefined
    }
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const [ads, all] = await Promise.all([loadAds(), getAllProjects()]);

  const gallery = parseGallery(project.gallery_images);
  // the cover is usually also the first gallery shot — don't show it twice
  const images = [...new Set([project.image_url, ...gallery].filter(Boolean))];
  const tags = parseTags(project.stack);

  const index = all.findIndex((p) => p.id === project.id);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:py-20">
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-2"
      >
        ← All work
      </Link>

      <header className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] p-7 ring-1 ring-line md:p-9">
        <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />

        <div className="relative">
          <h1 className="font-display text-[clamp(2rem,5vw,3.2rem)] font-extrabold uppercase leading-none tracking-tight">
            {project.title}
          </h1>

          {excerpt(project.description, 190) && (
            <p className="text-ink-soft mt-4 max-w-2xl leading-relaxed">
              {excerpt(project.description, 190)}
            </p>
          )}

          {tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <li key={t} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {t}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
            {project.created_at && (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-muted">Shipped</dt>
                <dd className="text-sm font-semibold text-ink">{formatDate(project.created_at)}</dd>
              </div>
            )}
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-muted">Stack</dt>
              <dd className="text-sm font-semibold text-ink">{tags.length} tools</dd>
            </div>
            {images.length > 1 && (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-muted">Gallery</dt>
                <dd className="text-sm font-semibold text-ink">{images.length} screenshots</dd>
              </div>
            )}
          </dl>

          {(project.live_url || project.repo_url) && (
            <div className="mt-7 flex flex-wrap gap-3">
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-cta inline-flex items-center gap-2 rounded-full px-7 py-3 font-semibold text-white shadow-[0_8px_24px_rgba(79,70,229,0.35)] transition-all hover:-translate-y-0.5"
                >
                  Visit live site
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              )}
              {project.repo_url && (
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-ink ring-1 ring-line transition-all hover:-translate-y-0.5 hover:ring-accent"
                >
                  View source
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {images.length > 0 && <ProjectGallery images={images} alt={project.title} />}

      {project.description && (
        <div className="prose-alite mt-10" dangerouslySetInnerHTML={{ __html: project.description }} />
      )}

      {(prev || next) && (
        <nav className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/portfolio/${prev.slug}`}
              className="group rounded-2xl bg-card p-4 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:ring-accent/40"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">← Previous</span>
              <p className="font-display mt-1 font-bold text-ink transition-colors group-hover:text-accent">
                {prev.title}
              </p>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/portfolio/${next.slug}`}
              className="group rounded-2xl bg-card p-4 text-right ring-1 ring-line transition-all hover:-translate-y-0.5 hover:ring-accent/40 sm:col-start-2"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Next →</span>
              <p className="font-display mt-1 font-bold text-ink transition-colors group-hover:text-accent">
                {next.title}
              </p>
            </Link>
          )}
        </nav>
      )}

      <div className="mt-16">
        <AdSlot ads={ads} position="sidebar" />
      </div>
    </div>
  );
}
