export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getWriter } from '@/lib/writer-session';
import AdminNav from '@/components/admin/AdminNav';

export default async function WriterLayout({ children }: { children: React.ReactNode }) {
  const writer = await getWriter();
  if (!writer) return redirect('/writer/login');

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-line bg-card p-4 hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto">
        <p className="font-display font-extrabold uppercase text-xl px-3 py-2 mb-3">
          Writer<span className="text-gradient">.</span>
        </p>
        <nav className="flex flex-col gap-1">
          <a
            href="/writer/dashboard"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold bg-accent text-white shadow-[0_6px_16px_rgba(79,70,229,0.3)]"
          >
            <span className="w-5 text-center text-base leading-none text-white">📖</span>
            Dashboard
          </a>
          <a
            href="/writer/stories/new"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink"
          >
            <span className="w-5 text-center text-base leading-none text-accent">✍</span>
            New Story
          </a>
          <a
            href="/stories"
            target="_blank"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink"
          >
            <span className="w-5 text-center text-base leading-none text-cyan-accent">🌐</span>
            View Stories
          </a>
          <a
            href="/writer/logout"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/5"
          >
            <span className="w-5 text-center text-base leading-none">🚪</span>
            Logout
          </a>
        </nav>
        <div className="mt-auto border-t border-line pt-3">
          <p className="px-3 pb-2 text-xs text-muted truncate">
            {writer.name}
          </p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden border-b border-line bg-card p-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <p className="font-display font-extrabold uppercase text-lg shrink-0 pr-1">
            Writer<span className="text-gradient">.</span>
          </p>
          <nav className="flex gap-1">
            <a href="/writer/dashboard" className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-accent text-white">Dashboard</a>
            <a href="/writer/stories/new" className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-ink/5">New Story</a>
            <a href="/writer/logout" className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5">Logout</a>
          </nav>
        </div>
        <main className="flex-1 min-w-0 w-full max-w-4xl mx-auto p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}