'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;
const SLATS = 6;

// Persists across template remounts so we only wipe on real navigations,
// never on first load of a page.
let lastPath: string | null = null;

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(lastPath);

  useEffect(() => {
    lastPath = pathname;
  }, [pathname]);

  const wipe =
    prevPath.current !== null &&
    prevPath.current !== pathname &&
    !prefersReduced() &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/login');

  if (!wipe) return <>{children}</>;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
        {Array.from({ length: SLATS }, (_, i) => {
          const dist = Math.abs(i - (SLATS - 1) / 2);
          const up = i % 2 === 0;
          return (
            <motion.div
              key={i}
              className="absolute top-0 h-full bg-ink"
              style={{ left: `${(i * 100) / SLATS}%`, width: `${100 / SLATS + 0.15}%` }}
              initial={{ y: 0 }}
              animate={{ y: up ? '-102%' : '102%' }}
              transition={{ duration: 0.55, delay: 0.1 + (dist - 0.5) * 0.06, ease: EASE }}
            >
              <span
                className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/45 to-transparent"
                aria-hidden
              />
            </motion.div>
          );
        })}
        <motion.div
          className="absolute inset-x-0 top-1/2 h-px origin-center bg-gradient-to-r from-transparent via-accent to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, times: [0, 0.3, 0.55, 1], ease: 'easeOut' }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
      >
        {children}
      </motion.div>
    </>
  );
}
