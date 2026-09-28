'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  clampRotation,
  createVectorProjector,
  DEG,
  greatCircle,
  graticule,
  polylineToPath,
  toVectors,
  type LatLon,
  type Projected
} from '@/lib/geo';

export interface GlobePin {
  id: number;
  slug: string;
  title: string;
  stack: string;
  imageUrl: string;
  liveUrl: string;
  position: LatLon;
}

const SIZE = 520;
const R = 214;
const CX = SIZE / 2;
const CY = SIZE / 2;

// Unit vectors are rotation-independent, so build them once at module load and
// keep the per-frame projection to plain arithmetic.
const GRID_VECTORS = graticule(30).map((line) => toVectors(line));

export default function ProjectGlobe({
  pins,
  selected,
  onSelect
}: {
  pins: GlobePin[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}) {
  const router = useRouter();
  const [yaw, setYaw] = useState(-20 * DEG);
  const [pitch, setPitch] = useState(12 * DEG);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const moved = useRef(false);

  // Idle spin until the visitor grabs the globe.
  useEffect(() => {
    if (dragging) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      setYaw((y) => y + dt * 0.00006);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragging]);

  const pointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
    moved.current = false;
    setDragging(true);
  };

  const pointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
    const next = clampRotation(d.yaw + dx * 0.006, d.pitch + dy * 0.006);
    setYaw(next.yaw);
    setPitch(next.pitch);
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const gridPaths = useMemo(() => {
    const project = createVectorProjector(yaw, pitch, CX, CY, R);
    return GRID_VECTORS.map((line) => polylineToPath(line.map(project)));
  }, [yaw, pitch]);

  const equator = useMemo(() => {
    const project = createVectorProjector(yaw, pitch, CX, CY, R);
    const line: Array<[number, number]> = Array.from({ length: 121 }, (_, i) => [
      -90 + i * 1.5,
      -180 + i * 3
    ]);
    return polylineToPath(toVectors(line).map(project));
  }, [yaw, pitch]);

  const pinVectors = useMemo(
    () => toVectors(pins.map((p) => p.position)),
    [pins]
  );

  const projected = useMemo(() => {
    const project = createVectorProjector(yaw, pitch, CX, CY, R);
    return pins.map((p, i) => ({ ...p, ...project(pinVectors[i]) }));
  }, [pins, pinVectors, yaw, pitch]);

  // Arc geometry depends only on which pin is selected, so sample it once and
  // re-project the samples each frame instead of re-solving great circles.
  const arcSamples = useMemo(() => {
    const focus = pins.find((p) => p.id === selected);
    if (!focus) return [];
    return pins
      .filter((p) => p.id !== selected)
      .map((p) => ({
        id: p.id,
        points: toVectors(greatCircle(p.position, focus.position, 36))
      }));
  }, [pins, selected]);

  const arcs = useMemo(() => {
    if (!arcSamples.length) return [];
    const project = createVectorProjector(yaw, pitch, CX, CY, R);
    return arcSamples.map((a) => ({ id: a.id, d: polylineToPath(a.points.map(project)) }));
  }, [arcSamples, yaw, pitch]);

  const active = projected.find((p) => p.id === selected) ?? null;

  const onKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') return onSelect(null);
      const visible = projected.filter((p) => p.visible);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!visible.length) return;
        const i = visible.findIndex((p) => p.id === selected);
        const step = e.key === 'ArrowRight' ? 1 : -1;
        onSelect(visible[(i + step + visible.length) % visible.length].id);
      }
      if (e.key === 'Enter' && active) {
        e.preventDefault();
        router.push(`/portfolio/${active.slug}`);
      }
    },
    [projected, selected, active, onSelect, router]
  );

  return (
    <div className="relative">
      <div className="relative mx-auto w-full max-w-[520px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full touch-none select-none"
          style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={() => {
            if (!moved.current) onSelect(null);
          }}
          onKeyDown={onKeyNav}
          role="application"
          tabIndex={0}
          aria-label="Interactive globe of projects. Drag to spin, arrow keys to move between projects, Enter to open the selected one."
        >
          <defs>
            <radialGradient id="globe-sphere" cx="35%" cy="30%" r="78%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="52%" stopColor="#eef2fb" />
              <stop offset="100%" stopColor="#cbd5ec" />
            </radialGradient>
            <radialGradient id="globe-shade" cx="35%" cy="30%" r="72%">
              <stop offset="55%" stopColor="#0e1526" stopOpacity="0" />
              <stop offset="100%" stopColor="#0e1526" stopOpacity="0.4" />
            </radialGradient>
            <radialGradient id="globe-pin" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={CX} cy={CY} r={R + 26} fill="#4f46e5" opacity="0.06" />
          <circle cx={CX} cy={CY} r={R + 12} fill="none" stroke="#4f46e5" strokeOpacity="0.14" strokeWidth="1" />

          <circle cx={CX} cy={CY} r={R} fill="url(#globe-sphere)" />
          <g stroke="#33415c" strokeOpacity="0.16" strokeWidth="0.7" fill="none">
            {gridPaths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <circle cx={CX} cy={CY} r={R} fill="url(#globe-shade)" />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#0e1526" strokeOpacity="0.14" strokeWidth="1" />

          <path d={equator} fill="none" stroke="#4f46e5" strokeOpacity="0.35" strokeWidth="1.1" strokeDasharray="4 5" />

          {arcs.length > 0 && (
            <g stroke="#4f46e5" strokeOpacity="0.4" strokeWidth="1.1" fill="none">
              {arcs.map((a) => (
                <path key={a.id} d={a.d} />
              ))}
            </g>
          )}

          {projected.map((p) => {
            if (!p.visible) return null;
            const isActive = p.id === selected;
            const opacity = 0.35 + p.depth * 0.65;
            return (
              <g
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (moved.current) return;
                  onSelect(isActive ? null : p.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 22 : 14}
                  fill="url(#globe-pin)"
                  opacity={isActive ? 0.9 : 0.55}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 6.5 : 4.5}
                  fill={isActive ? '#7c3aed' : '#4f46e5'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity={opacity}
                />
                {isActive && (
                  <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.7">
                    <animate attributeName="r" values="10;20" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                {p.depth > 0.55 && (
                  <text
                    x={p.x + 12}
                    y={p.y + 4}
                    fontSize="11"
                    fontWeight="700"
                    fill="#0e1526"
                    opacity={isActive ? 0.95 : 0.6}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {p.title.length > 18 ? `${p.title.slice(0, 17)}…` : p.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {active && <PinPreview pin={active} />}
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Drag to spin · click a node to preview · arrow keys to move between works
      </p>
    </div>
  );
}

function PinPreview({ pin }: { pin: GlobePin & Projected }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-1/2 top-2 z-10 w-[min(21rem,92%)] -translate-x-1/2 rounded-2xl bg-card/95 p-4 shadow-lift ring-1 ring-line backdrop-blur"
    >
      <div className="flex gap-3">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
          {pin.imageUrl && <img src={pin.imageUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display font-bold text-ink">{pin.title}</p>
          {pin.stack && (
            <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-cyan-accent">
              {pin.stack}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`/portfolio/${pin.slug}`}
          className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-2"
        >
          Open case study
        </a>
        {pin.liveUrl && (
          <a
            href={pin.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink ring-1 ring-line transition-colors hover:ring-accent"
          >
            Live site ↗
          </a>
        )}
      </div>
    </motion.div>
  );
}
