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
    const timer = setTimeout(finish, 3700);
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
          {/* doors */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-ink animate-intro-door-t">
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-white/70 to-transparent animate-intro-edge" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-ink animate-intro-door-b">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/70 to-transparent animate-intro-edge" />
          </div>

          {/* light bloom — lives in the opening gap */}
          <div
            className="absolute left-1/2 top-1/2 h-[45vh] w-[85vw] rounded-full bg-accent/35 blur-[80px] animate-intro-bloom"
            aria-hidden
          />

          {/* title card */}
          <div className="absolute inset-0 animate-intro-out">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(2,4,10,0.55))]" aria-hidden />

            <div className="absolute inset-0 grid grid-rows-[1fr_auto_1fr]">
              <div className="flex items-end justify-center pb-5 px-4">
                <div className="relative animate-intro-settle">
                  <h1 className="font-display font-extrabold uppercase text-white leading-none tracking-[-0.03em] text-[clamp(2.8rem,9vw,6rem)] flex">
                    {letters.map((ch, i) => (
                      <span key={i} className="inline-block overflow-hidden">
                        <span
                          className="inline-block animate-intro-rise"
                          style={{ animationDelay: `${0.6 + i * step}s` }}
                        >
                          {ch === ' ' ? '\u00A0' : ch}
                        </span>
                      </span>
                    ))}
                    <span className="inline-block animate-intro-blink text-gradient">_</span>
                  </h1>
                  <span className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    <span className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-transparent via-white/55 to-transparent animate-intro-shine" />
                  </span>
                </div>
              </div>

              <div className="relative flex justify-center">
                <span
                  className="block h-px w-[74vw] max-w-xl bg-gradient-to-r from-transparent via-white to-transparent animate-intro-beam"
                  aria-hidden
                />
                <span
                  className="absolute left-1/2 top-1/2 h-[3px] w-[74vw] max-w-xl -translate-x-1/2 -translate-y-1/2 bg-white blur-[3px] animate-intro-beam-hot"
                  aria-hidden
                />
              </div>

              <div className="flex justify-center pt-5 px-6">
                {tagline && (
                  <p className="animate-intro-tag text-white/70 text-[11px] sm:text-xs uppercase text-center pl-[0.35em]">
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
