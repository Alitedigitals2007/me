'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/analytics', label: 'Analytics', icon: '◫' },
  { href: '/admin/academy', label: 'Academy', icon: '◆' },
  { href: '/admin/submissions', label: 'Submissions', icon: '📝' },
  { href: '/admin/students', label: 'Students', icon: '👥' },
  { href: '/admin/certificates', label: 'Certificates', icon: '🏅' },
  { href: '/admin/messages', label: 'Messages', icon: '✉' },
  { href: '/admin/ads', label: 'Ads', icon: '▣' },
  { href: '/admin/marketplace', label: 'Marketplace', icon: '◍' },
  { href: '/admin/blog', label: 'Blog', icon: '☰' },
  { href: '/admin/projects', label: 'Projects', icon: '❐' },
  { href: '/admin/education', label: 'Education', icon: '♜' },
  { href: '/admin/roles', label: 'Roles', icon: '★' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' }
];

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

export default function AdminNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  if (compact) {
    return (
      <>
        {NAV.map((n) => {
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
      </>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
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
    </nav>
  );
}
