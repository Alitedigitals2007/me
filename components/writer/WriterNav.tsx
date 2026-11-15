'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const WRITER_NAV = [
  { href: '/writer/dashboard', label: 'Dashboard', icon: '📖' },
  { href: '/writer/stories/new', label: 'New Story', icon: '✍' },
  { href: '/writer/stats', label: 'Stats', icon: '📊' },
  { href: '/writer/comments', label: 'Comments', icon: '💬' },
  { href: '/writer/profile', label: 'Profile', icon: '👤' }
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function WriterNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname() || '';

  if (compact) {
    return (
      <>
        {WRITER_NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ? 'bg-accent text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'text-ink-soft hover:bg-ink/5'
              }`}
            >
              {n.label}
            </Link>
          );
        })}
        <Link
          href="/stories"
          className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-cyan-accent hover:bg-ink/5"
        >
          View Stories
        </Link>
        <Link
          href="/writer/logout"
          className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5"
        >
          Logout
        </Link>
      </>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {WRITER_NAV.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              active
                ? 'bg-accent text-white shadow-[0_6px_16px_rgba(79,70,229,0.3)]'
                : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
            }`}
          >
            <span className={`w-5 text-center text-base leading-none ${active ? 'text-white' : 'text-accent'}`}>
              {n.icon}
            </span>
            {n.label}
          </Link>
        );
      })}
      <Link
        href="/stories"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink"
      >
        <span className="w-5 text-center text-base leading-none text-cyan-accent">🌐</span>
        View Stories
      </Link>
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink"
      >
        <span className="w-5 text-center text-base leading-none text-accent-2">🏠</span>
        Back to site
      </Link>
      <Link
        href="/writer/logout"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/5"
      >
        <span className="w-5 text-center text-base leading-none">🚪</span>
        Logout
      </Link>
    </nav>
  );
}
