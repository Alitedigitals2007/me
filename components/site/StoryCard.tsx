import Link from 'next/link';
import { formatDate, parseTags, excerpt } from '@/lib/utils';
import type { Story } from '@/lib/types';

export type StoryCardData = Story & { writer_name?: string; writer_avatar?: string };

export default function StoryCard({ s }: { s: StoryCardData }) {
  const tags = parseTags(s.tags, 3);
  return (
    <Link
      href={`/stories/${s.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-line hover:ring-accent/40 shadow-card hover:shadow-lift hover:-translate-y-1.5 transition-all duration-300 h-full"
    >
      <div className="relative overflow-hidden aspect-[16/9] bg-paper">
        {s.cover_image ? (
          <img src={s.cover_image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center font-display font-bold text-3xl text-line">✎</div>
        )}
        {s.category && (
          <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-ink/75 text-white backdrop-blur-sm">
            {s.category}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <p className="text-xs text-muted">{formatDate(s.published_at)}</p>
        <h3 className="font-display font-bold text-lg leading-snug group-hover:text-accent transition-colors">{s.title}</h3>
        <p className="text-sm text-muted line-clamp-2 flex-1">{excerpt(s.excerpt || s.content, 120)}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-paper ring-1 ring-line text-muted">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {s.writer_name}
          </span>
        </div>
      </div>
    </Link>
  );
}
