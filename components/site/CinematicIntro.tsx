'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CinematicIntro({ siteName, tagline }: { siteName: string; tagline?: string }) {
  const [show, setShow] = useState(true);

  const finish = useCallback(() => {
    document.documentElement.classList.remove('intro-armed');
    window.dispatchEvent(new Event('alite:intro-reveal'));
    setShow(false);
  }, []);

  useEffect(() => {
    if (!document.documentElement.classList.contains('intro-armed')) {
      setShow(false);
      return;
    }
    const timer = setTimeout(finish, 3400);
    window.addEventListener('pointerdown', finish);
    window.addEventListener('keydown', finish);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
    };
  }, [finish]);

  const letters = Array.from(siteName.toUpperCase()).slice(0, 16);
  const step = Math.min(0.055, 0.6 / Math.max(letters.length, 1));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="intro animate-intro-done"
          role="presentation"
          aria-hidden="true"
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          onClick={finish}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-ink animate-intro-door-t" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-ink animate-intro-door-b" aria-hidden />

          <div className="absolute inset-0 animate-intro-out">
            <div className="absolute inset-0 grid grid-rows-[1fr_auto_1fr]">
              <div className="flex items-end justify-center pb-5">
                <h1 className="font-display font-extrabold uppercase text-white leading-none tracking-[-0.03em] text-[clamp(2.8rem,9vw,6rem)] flex">
                  {letters.map((ch, i) => (
                    <span key={i} className="inline-block overflow-hidden">
                      <span
                        className="inline-block animate-intro-rise"
                        style={{ animationDelay: `${0.45 + i * step}s` }}
                      >
                        {ch === ' ' ? '\u00A0' : ch}
                      </span>
                    </span>
                  ))}
                  <span className="inline-block animate-intro-blink text-gradient">_</span>
                </h1>
              </div>

              <div className="relative flex justify-center">
                <span
                  className="relative z-10 block h-px w-[62vw] max-w-md bg-gradient-to-r from-transparent via-white to-transparent animate-intro-seam"
                  aria-hidden
                />
                <span
                  className="absolute -inset-x-10 -inset-y-5 rounded-full bg-accent/40 blur-2xl animate-intro-glow"
                  aria-hidden
                />
              </div>

              <div className="flex justify-center pt-5 px-6">
                {tagline && (
                  <p className="animate-intro-fadeup text-white/70 text-[11px] sm:text-xs uppercase tracking-[0.35em] text-center pl-[0.35em]">
                    {tagline}
                  </p>
                )}
              </div>
            </div>

            <p className="absolute bottom-8 inset-x-0 text-center text-white/60 text-[11px] tracking-wider animate-intro-hint">
              Click to skip
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
