export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getWriter } from '@/lib/writer-session';
import WriterNav from '@/components/writer/WriterNav';

export default async function WriterLayout({ children }: { children: React.ReactNode }) {
  const writer = await getWriter();
  if (!writer) return redirect('/login?next=/writer/dashboard');

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-line bg-card p-4 hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto">
        <p className="font-display font-extrabold uppercase text-xl px-3 py-2 mb-3">
          Writer<span className="text-gradient">.</span>
        </p>
        <WriterNav />
        <div className="mt-auto border-t border-line pt-3">
          <p className="px-3 pb-2 text-xs text-muted truncate">{writer.name}</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden border-b border-line bg-card p-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <p className="font-display font-extrabold uppercase text-lg shrink-0 pr-1">
            Writer<span className="text-gradient">.</span>
          </p>
          <WriterNav compact />
        </div>
        <main className="flex-1 min-w-0 w-full max-w-4xl mx-auto p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
