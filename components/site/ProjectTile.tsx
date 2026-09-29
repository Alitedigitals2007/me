import Link from 'next/link';
import type { ProjectSummary } from '@/lib/types';

export default function ProjectTile({
  p,
  index = 0,
  eager = false
}: {
  p: ProjectSummary;
  index?: number;
  eager?: boolean;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-line transition-all duration-500 hover:-translate-y-2 hover:shadow-lift hover:ring-accent/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.title}
            loading={eager ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-4xl font-bold text-line">◆</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />

        {/* editorial index numeral, sitting on the gradient */}
        <span
          aria-hidden
          className="absolute -bottom-2 right-2 select-none font-display text-[4.5rem] font-extrabold leading-none text-white/25"
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {p.featured && (
            <span className="rounded-full bg-gradient-cta px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              Featured
            </span>
          )}
          {p.imageCount > 1 && (
            <span className="rounded-full bg-ink/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
              {p.imageCount} shots
            </span>
          )}
        </div>

        {p.liveUrl && (
          <a
            href={p.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink shadow-card backdrop-blur transition-all duration-300 hover:bg-white hover:text-accent group-hover:scale-105"
          >
            Live ↗
          </a>
        )}
      </div>

      {/* accent rule that fills on hover */}
      <span
        aria-hidden
        className="h-0.5 w-0 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent transition-all duration-500 group-hover:w-full"
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-xl font-bold leading-tight text-ink transition-colors group-hover:text-accent">
          <Link
            href={`/portfolio/${p.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {p.title}
          </Link>
        </h3>

        {p.summary && <p className="line-clamp-2 text-sm leading-relaxed text-muted">{p.summary}</p>}

        {p.tags.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {p.tags.slice(0, 3).map((t) => (
              <li
                key={t}
                className="rounded-md border border-line px-2 py-0.5 text-[11px] font-semibold text-ink-soft transition-colors group-hover:border-accent/40 group-hover:text-accent"
              >
                {t}
              </li>
            ))}
            {p.tags.length > 3 && (
              <li className="px-1 py-0.5 text-[11px] font-semibold text-muted">+{p.tags.length - 3}</li>
            )}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-line pt-3 text-xs font-semibold">
          <span className="text-muted">Case study</span>
          <span className="inline-flex items-center gap-1.5 text-ink-soft transition-all duration-300 group-hover:gap-2.5 group-hover:text-accent">
            View
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}
