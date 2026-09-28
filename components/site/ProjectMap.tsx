'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { flatGraticule, greatCircle, projectFlat } from '@/lib/geo';
import type { GlobePin } from './ProjectGlobe';

const W = 1000;
const H = 500;
const GRID = flatGraticule(30);

export default function ProjectMap({
  pins,
  selected,
  onSelect
}: {
  pins: GlobePin[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const projected = useMemo(
    () => pins.map((p) => ({ ...p, ...projectFlat(p.position.lat, p.position.lon, W, H) })),
    [pins]
  );

  const focus = projected.find((p) => p.id === selected) ?? null;

  const arcs = useMemo(() => {
    if (!focus) return [];
    return projected
      .filter((p) => p.id !== selected)
      .map((p) => ({
        id: p.id,
        d: greatCircle(p.position, focus.position, 48)
          .map((pt) => projectFlat(pt.lat, pt.lon, W, H))
          .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
          .join('')
      }));
  }, [projected, focus, selected]);

  if (!pins.length) {
    return (
      <div className="rounded-3xl bg-card ring-1 ring-line p-12 text-center text-muted">
        Nothing to map yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl bg-card ring-1 ring-line shadow-card">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="World map of projects">
          <defs>
            <linearGradient id="map-ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7f9fc" />
              <stop offset="100%" stopColor="#eef2fb" />
            </linearGradient>
            <radialGradient id="map-pin" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={W} height={H} fill="url(#map-ocean)" />

          <g stroke="#33415c" strokeOpacity="0.13" strokeWidth="1" fill="none">
            {GRID.map((line, li) => (
              <path
                key={li}
                d={line
                  .map(([lat, lon], pi) => {
                    const pt = projectFlat(lat, lon, W, H);
                    return `${pi === 0 ? 'M' : 'L'}${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
                  })
                  .join('')}
              />
            ))}
          </g>

          {arcs.length > 0 && (
            <g stroke="#4f46e5" strokeOpacity="0.3" strokeWidth="1.2" fill="none" strokeDasharray="5 6">
              {arcs.map((a) => (
                <path key={a.id} d={a.d} />
              ))}
            </g>
          )}

          {projected.map((p) => {
            const isActive = p.id === selected;
            const isHover = p.id === hover;
            const r = isActive ? 9 : isHover ? 7 : 5;
            return (
              <g
                key={p.id}
                onClick={() => onSelect(isActive ? null : p.id)}
                onPointerEnter={() => setHover(p.id)}
                onPointerLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={p.x} cy={p.y} r={r * 3.4} fill="url(#map-pin)" opacity={isActive ? 0.9 : 0.45} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={isActive ? '#7c3aed' : '#4f46e5'}
                  stroke="#ffffff"
                  strokeWidth="2.2"
                />
                <text
                  x={p.x + 14}
                  y={p.y + 4}
                  fontSize="13"
                  fontWeight="700"
                  fill="#0e1526"
                  opacity={isActive || isHover ? 0.95 : 0.55}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {p.title.length > 22 ? `${p.title.slice(0, 21)}…` : p.title}
                </text>
              </g>
            );
          })}

          <rect width={W} height={H} fill="none" stroke="#e4e9f2" strokeWidth="2" />
        </svg>

        {focus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-4 left-4 right-4 rounded-2xl bg-card/95 p-4 shadow-lift ring-1 ring-line backdrop-blur sm:right-auto sm:w-80"
          >
            <p className="font-display font-bold text-ink">{focus.title}</p>
            {focus.stack && <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-accent">{focus.stack}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`/portfolio/${focus.slug}`}
                className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-2"
              >
                Open case study
              </a>
              {focus.liveUrl && (
                <a
                  href={focus.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink ring-1 ring-line transition-colors hover:ring-accent"
                >
                  Live site ↗
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-muted">Click a node to preview that work</p>
    </div>
  );
}
