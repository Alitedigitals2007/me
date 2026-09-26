'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Settings } from '@/lib/types';

const SKILLS = [
  'Full-Stack Web Design',
  'WordPress Engineering',
  'Excel Automation & VBA',
  'Bot Architecture',
  'Data Analysis',
  'Project Management',
  'Team Leadership',
  'Digital Strategy',
  'Shopify',
  'SEO Optimization'
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } }
};

export default function Hero({ settings }: { settings: Settings }) {
  // Hold the entrance while the cinematic intro is playing, so the hero
  // reveals together with the opening doors. Starts immediately otherwise.
  const [gate, setGate] = useState(true);

  useEffect(() => {
    if (!document.documentElement.classList.contains('intro-armed')) {
      setGate(false);
      return;
    }
    const start = () => setGate(false);
    window.addEventListener('alite:intro-reveal', start);
    const fallback = setTimeout(start, Math.max(0, 2450 - performance.now()));
    return () => {
      window.removeEventListener('alite:intro-reveal', start);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full blur-3xl opacity-30 animate-blob" style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-24 w-[440px] h-[440px] rounded-full blur-3xl opacity-25 animate-blob-2" style={{ background: 'radial-gradient(circle, #0891b2, transparent 70%)' }} />
        <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #db2777, transparent 70%)' }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-14 lg:pt-24 lg:pb-20">
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-12 lg:gap-16 items-center">
          <motion.div variants={container} initial="hidden" animate={gate ? 'hidden' : 'show'}>
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-line px-4 py-1.5 text-xs font-semibold text-ink-soft shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Available for projects — Ibadan, Nigeria
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 font-display font-extrabold uppercase leading-[0.95] tracking-tight text-[clamp(2.6rem,7vw,4.6rem)]"
            >
              Building smart
              <br />
              <span className="text-gradient">systems</span> that
              <br />
              scale without friction
            </motion.h1>

            <motion.p variants={item} className="mt-6 max-w-xl text-lg text-ink-soft leading-relaxed">
              I'm <strong className="text-ink">{settings.hero_name}</strong> — {settings.hero_title.toLowerCase()}.
              I architect the logic that runs your business while you sleep — high-end systems designed for the
              streets of Nigeria and the markets of the world.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Link
                href={settings.contact_whatsapp ? `https://wa.me/${settings.contact_whatsapp}` : '/contact'}
                target={settings.contact_whatsapp ? '_blank' : undefined}
                className="bg-gradient-cta text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_10px_30px_rgba(79,70,229,0.35)] hover:shadow-[0_14px_40px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 transition-all"
              >
                Let&apos;s talk
              </Link>
              <Link
                href="/portfolio"
                className="font-semibold px-7 py-3.5 rounded-full bg-white ring-1 ring-line text-ink hover:ring-accent hover:-translate-y-0.5 transition-all shadow-sm"
              >
                View my work
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-10 grid grid-cols-3 max-w-md gap-6">
              {[
                ['4+', 'Years building'],
                ['200+', 'GradeSense users'],
                ['8+', 'Leadership roles']
              ].map(([num, label]) => (
                <div key={label}>
                  <p className="font-display font-bold text-3xl text-accent">{num}</p>
                  <p className="text-xs text-muted mt-1">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={gate ? { opacity: 0, scale: 0.92, y: 20 } : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-br from-accent via-accent-2 to-cyan-accent opacity-25 blur-xl" aria-hidden />
            <div className="relative rounded-[2rem] overflow-hidden ring-1 ring-line shadow-2xl bg-white p-2">
              <img
                src={settings.hero_photo || '/img/me.jpg'}
                alt={settings.hero_name}
                className="w-full aspect-[4/5] object-cover rounded-[1.6rem]"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={gate ? { opacity: 0, y: 14 } : { opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -bottom-5 -left-6 glass rounded-2xl ring-1 ring-line px-4 py-3 shadow-card"
            >
              <p className="font-display font-bold text-sm text-gradient">Execution over excuses</p>
              <p className="text-[11px] text-muted">— my operating principle</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* skills marquee */}
      <div className="relative border-y border-line bg-card py-4 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee gap-0" style={{ width: 'max-content' }}>
          {[...SKILLS, ...SKILLS].map((s, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft uppercase tracking-wider">
              <span className="text-gradient">◆</span> {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
