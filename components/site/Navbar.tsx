'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/blog', label: 'Blog' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/advertise', label: 'Advertise' },
  { href: '/contact', label: 'Contact' }
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-[0_1px_0_0_var(--color-line)]' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-6xl px-5 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/img/logo.png"
            alt="ALITE logo"
            className="w-9 h-9 rounded-xl object-cover ring-1 ring-line transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
          />
          <span className="font-display font-800 tracking-tight text-xl font-bold">
            ALITE<span className="text-gradient">_</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
                isActive(l.href)
                  ? 'text-accent bg-accent/8'
                  : 'text-ink-soft hover:text-ink hover:bg-ink/5'
              }`}
            >
              {isActive(l.href) && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-accent/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{l.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="hidden sm:inline-flex bg-gradient-cta text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:shadow-[0_10px_32px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 transition-all"
          >
            Let&apos;s talk
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="lg:hidden w-10 h-10 grid place-items-center rounded-full bg-ink/5 text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden glass border-t border-line"
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(l.href) ? 'bg-accent/10 text-accent' : 'text-ink-soft hover:bg-ink/5'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
