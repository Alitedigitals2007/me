'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

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
        <motion.div
          className="absolute inset-x-0 top-0 h-1/2 bg-ink"
          initial={{ y: 0 }}
          animate={{ y: '-101%' }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
          initial={{ y: 0 }}
          animate={{ y: '101%' }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
        />
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
