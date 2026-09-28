import Link from 'next/link';
import type { ProjectSummary } from '@/lib/types';

export default function ProjectTile({ p, eager = false }: { p: ProjectSummary; eager?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift hover:ring-accent/40">
      <div className="relative aspect-[16/10] overflow-hidden bg-paper">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.title}
            loading={eager ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-4xl font-bold text-line">◆</div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 flex gap-1.5">
          {p.featured && (
            <span className="rounded-full bg-gradient-cta px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              Featured
            </span>
          )}
          {p.imageCount > 1 && (
            <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
              {p.imageCount} shots
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-accent">
            <Link
              href={`/portfolio/${p.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {p.title}
            </Link>
          </h3>
          {p.summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{p.summary}</p>}
        </div>

        {p.tags.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1.5">
            {p.tags.slice(0, 4).map((t) => (
              <li
                key={t}
                className="rounded-full bg-accent/8 px-2.5 py-0.5 text-[11px] font-semibold text-accent"
              >
                {t}
              </li>
            ))}
            {p.tags.length > 4 && (
              <li className="px-1 py-0.5 text-[11px] font-semibold text-muted">+{p.tags.length - 4}</li>
            )}
          </ul>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-3 text-xs font-semibold">
          <span className="text-ink-soft transition-colors group-hover:text-accent">View case study →</span>
          {p.liveUrl && (
            <a
              href={p.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 ml-auto rounded-lg bg-paper px-2.5 py-1 text-[11px] text-ink-soft ring-1 ring-line transition-colors hover:text-accent hover:ring-accent"
            >
              Live ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
