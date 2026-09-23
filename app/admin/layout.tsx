import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/admin/LogoutButton';
import { readSession } from '@/lib/session';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/analytics', label: 'Analytics', icon: '◫' },
  { href: '/admin/messages', label: 'Messages', icon: '✉' },
  { href: '/admin/ads', label: 'Ads', icon: '▣' },
  { href: '/admin/marketplace', label: 'Marketplace', icon: '◍' },
  { href: '/admin/blog', label: 'Blog', icon: '☰' },
  { href: '/admin/projects', label: 'Projects', icon: '❐' },
  { href: '/admin/education', label: 'Education', icon: '♜' },
  { href: '/admin/roles', label: 'Roles', icon: '★' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await readSession();
  if (!user) return redirect('/admin/login');

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-line bg-card/60 p-4 flex flex-col gap-1 sticky top-0 h-screen max-md:hidden">
        <Link href="/admin" className="font-display font-extrabold uppercase text-xl px-3 py-2 mb-2">
          Admin<span className="text-gradient">.</span>
        </Link>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink transition-colors"
          >
            <span className="text-accent">{n.icon}</span> {n.label}
          </Link>
        ))}
        <div className="mt-auto border-t border-line pt-3">
          <p className="px-3 pb-2 text-xs text-muted truncate">
            {user.username || user.email}
            {user.role ? ` · ${user.role}` : ''}
          </p>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="md:hidden border-b border-line p-4 flex items-center gap-4 overflow-x-auto whitespace-nowrap">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-semibold text-ink-soft hover:text-accent">
              {n.label}
            </Link>
          ))}
          <LogoutButton compact />
        </div>
      </div>
      <main className="flex-1 min-w-0 p-6 md:p-10 max-w-6xl">{children}</main>
    </div>
  );
}
