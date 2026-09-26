'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SLATS = 6;

export default function CinematicIntro({ siteName, tagline }: { siteName: string; tagline?: string }) {
  const [show, setShow] = useState(true);
  const [typed, setTyped] = useState(0);
  const typedRef = useRef(0);

  const letters = Array.from(siteName.toUpperCase()).slice(0, 16);
  const typingDone = typed >= letters.length;

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

    // terminal-style typing
    let interval: ReturnType<typeof setInterval> | null = null;
    const startTyping = setTimeout(() => {
      interval = setInterval(() => {
        typedRef.current += 1;
        setTyped(typedRef.current);
        if (typedRef.current >= letters.length && interval) {
          clearInterval(interval);
          interval = null;
        }
      }, Math.max(38, Math.min(70, Math.round(780 / Math.max(letters.length, 1)))));
    }, 380);

    return () => {
      clearTimeout(timer);
      clearTimeout(startTyping);
      if (interval) clearInterval(interval);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
    };
  }, [finish, letters.length]);

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
          {/* shutter slats — center-out staggered open, glowing seams */}
          {Array.from({ length: SLATS }, (_, i) => {
            const dist = Math.abs(i - (SLATS - 1) / 2);
            const up = i % 2 === 0;
            return (
              <div
                key={i}
                className={`absolute top-0 h-full bg-ink ${up ? 'animate-intro-slat-up' : 'animate-intro-slat-down'}`}
                style={{
                  left: `${(i * 100) / SLATS}%`,
                  width: `${100 / SLATS + 0.15}%`,
                  animationDelay: `${2.65 + (dist - 0.5) * 0.07}s`
                }}
              >
                <span
                  className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-accent/60 to-transparent"
                  aria-hidden
                />
                <span className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.025)_3px,rgba(255,255,255,0.025)_4px)]" aria-hidden />
              </div>
            );
          })}

          {/* light bloom through the gaps */}
          <div
            className="absolute left-1/2 top-1/2 h-[45vh] w-[85vw] rounded-full bg-accent/35 blur-[80px] animate-intro-bloom"
            aria-hidden
          />

          {/* console surface: HUD + title card (fades out together) */}
          <div className="absolute inset-0 animate-intro-out">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(2,4,10,0.55))]" aria-hidden />

            {/* tech grid */}
            <div
              className="absolute inset-0 opacity-15 animate-intro-hud bg-[linear-gradient(rgba(79,70,229,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.5)_1px,transparent_1px)] bg-[size:44px_44px]"
              aria-hidden
            />
            {/* scanlines */}
            <div
              className="absolute inset-0 opacity-[0.13] bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.55)_0px,rgba(0,0,0,0.55)_1px,transparent_1px,transparent_3px)]"
              aria-hidden
            />
            {/* scan sweep */}
            <div
              className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-cyan-accent/25 to-transparent animate-intro-scan"
              aria-hidden
            />
            {/* corner brackets */}
            <span className="absolute left-4 top-4 w-5 h-5 border-l-2 border-t-2 border-accent/70 animate-intro-hud" aria-hidden />
            <span className="absolute right-4 top-4 w-5 h-5 border-r-2 border-t-2 border-cyan-accent/70 animate-intro-hud" aria-hidden />
            <span className="absolute left-4 bottom-4 w-5 h-5 border-l-2 border-b-2 border-cyan-accent/70 animate-intro-hud" aria-hidden />
            <span className="absolute right-4 bottom-4 w-5 h-5 border-r-2 border-b-2 border-accent/70 animate-intro-hud" aria-hidden />

            {/* HUD status lines */}
            <p className="absolute top-5 left-10 font-mono text-[10px] sm:text-xs text-white/60 tracking-widest animate-intro-hud">
              &gt; {siteName.toUpperCase()}_OS v2.0
            </p>
            <p className="absolute top-5 right-10 font-mono text-[10px] sm:text-xs text-cyan-accent/90 tracking-widest animate-intro-hud">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-accent mr-1.5 animate-intro-blink2 align-middle" />
              SYSTEM ONLINE
            </p>
            <p className="absolute bottom-9 left-10 font-mono text-[10px] sm:text-xs text-accent/90 tracking-widest animate-intro-hud">
              &gt; ACADEMY ONLINE
            </p>

            <div className="absolute inset-0 grid grid-rows-[1fr_auto_1fr]">
              <div className="flex items-end justify-center pb-5 px-4">
                <div className="relative animate-intro-settle">
                  <h1
                    className={`font-display font-extrabold uppercase text-white leading-none tracking-[-0.03em] text-[clamp(2.4rem,8.5vw,5.5rem)] flex flex-wrap justify-center ${typingDone ? 'animate-intro-glitch' : ''}`}
                  >
                    {letters.slice(0, typed).map((ch, i) => (
                      <span key={i}>{ch === ' ' ? '\u00A0' : ch}</span>
                    ))}
                    <span className="inline-block animate-intro-cursor text-gradient">_</span>
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
                  <p className="animate-intro-tag text-white/70 text-[11px] sm:text-xs uppercase text-center pl-[0.35em] font-mono tracking-[0.3em]">
                    {tagline}
                  </p>
                )}
              </div>
            </div>

            {/* boot progress bar */}
            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/10" aria-hidden>
              <div className="h-full bg-gradient-to-r from-accent via-accent-2 to-cyan-accent origin-left animate-intro-progress" />
            </div>

            <p className="absolute bottom-4 inset-x-0 text-center font-mono text-white/60 text-[10px] sm:text-xs tracking-[0.25em] animate-intro-hint">
              [ CLICK TO SKIP ]
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
