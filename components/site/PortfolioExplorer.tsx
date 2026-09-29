'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProjectSummary } from '@/lib/types';
import { placeProjects, type LatLon } from '@/lib/geo';
import ProjectGlobe, { type GlobePin } from './ProjectGlobe';
import ProjectMap from './ProjectMap';
import ProjectTile from './ProjectTile';

type View = 'grid' | 'globe' | 'map';
type Sort = 'featured' | 'newest' | 'oldest' | 'az';

const VIEWS: Array<{ id: View; label: string; icon: React.ReactNode }> = [
  {
    id: 'grid',
    label: 'Grid',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  },
  {
    id: 'globe',
    label: 'Globe',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
      </svg>
    )
  },
  {
    id: 'map',
    label: 'Map',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" />
      </svg>
    )
  }
];

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: 'featured', label: 'Featured first' },
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'az', label: 'A – Z' }
];

export default function PortfolioExplorer({ projects }: { projects: ProjectSummary[] }) {
  const [view, setView] = useState<View>('grid');
  const [sort, setSort] = useState<Sort>('featured');
  const [tag, setTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12);
  }, [projects]);

  const visible = useMemo(() => {
    const list = tag ? projects.filter((p) => p.tags.includes(tag)) : [...projects];
    const byDate = (a: ProjectSummary, b: ProjectSummary) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    switch (sort) {
      case 'newest':
        return list.sort(byDate);
      case 'oldest':
        return list.sort((a, b) => -byDate(a, b));
      case 'az':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return list.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            a.orderIndex - b.orderIndex ||
            byDate(a, b)
        );
    }
  }, [projects, tag, sort]);

  const pins = useMemo<GlobePin[]>(() => {
    const spots: Map<string, LatLon> = placeProjects(visible.map((p) => p.slug));
    return visible.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      stack: p.tags.join(' · '),
      imageUrl: p.imageUrl,
      liveUrl: p.liveUrl,
      position: spots.get(p.slug) ?? { lat: 0, lon: 0 }
    }));
  }, [visible]);

  // A selected work can drop out of the filtered set.
  const activeId = visible.some((p) => p.id === selected) ? selected : null;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-line md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Portfolio view"
            className="flex gap-1 rounded-xl bg-paper p-1 ring-1 ring-line"
          >
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  view === v.id ? 'text-white' : 'text-ink-soft hover:text-accent'
                }`}
              >
                {view === v.id && (
                  <motion.span
                    layoutId="portfolio-view-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-cta"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative inline-flex items-center gap-1.5">
                  {v.icon}
                  {v.label}
                </span>
              </button>
            ))}
          </div>
          <span className="hidden text-xs font-semibold text-muted sm:inline">
            {visible.length} {visible.length === 1 ? 'work' : 'works'}
          </span>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg bg-paper px-3 py-2 text-xs font-semibold outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTag(null)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              tag === null ? 'bg-ink text-white' : 'bg-card text-ink-soft ring-1 ring-line hover:ring-accent'
            }`}
          >
            All
          </button>
          {tags.map(([t, count]) => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? null : t)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                tag === t ? 'bg-accent text-white' : 'bg-card text-ink-soft ring-1 ring-line hover:ring-accent'
              }`}
            >
              {t}
              <span className={`ml-1.5 ${tag === t ? 'text-white/70' : 'text-muted'}`}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {!visible.length ? (
        <p className="rounded-2xl bg-card p-12 text-center text-muted ring-1 ring-line">
          No work tagged “{tag}” yet.
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {view === 'globe' && (
              <ProjectGlobe pins={pins} selected={activeId} onSelect={setSelected} />
            )}
            {view === 'map' && <ProjectMap pins={pins} selected={activeId} onSelect={setSelected} />}
            {view === 'grid' && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProjectTile p={p} index={i} eager={i < 3} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
