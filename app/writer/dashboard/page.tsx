import Link from 'next/link';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Writer Dashboard' };

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

export default async function WriterDashboard() {
  const writer = await getWriter();
  if (!writer) return redirect('/writer/login');

  const stories = await safeQuery(
    `SELECT id, title, slug, status, cover_image, created_at, published_at, updated_at
     FROM stories WHERE writer_id = $1 ORDER BY updated_at DESC`,
    [writer.id]
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-accent">Writer</p>
          <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl mt-1 tracking-[-0.02em]">
            Dashboard, <span className="text-gradient">{writer.name}</span>
          </h1>
          <p className="text-sm text-muted mt-1">Manage your stories</p>
        </div>
        <Link
          href="/writer/stories/new"
          className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white"
        >
          + New Story
        </Link>
      </div>

      <div className="space-y-3">
        {stories.length ? (
          stories.map((s) => (
            <Link
              key={s.id}
              href={`/writer/stories/${s.id}/edit`}
              className="flex items-center justify-between gap-4 rounded-2xl bg-card ring-1 ring-line p-4 hover:ring-accent/40 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                {s.cover_image && (
                  <img src={s.cover_image} alt="" className="w-16 h-12 rounded-lg object-cover ring-1 ring-line shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{s.title}</p>
                  <p className="text-xs text-muted truncate">
                    {s.slug} · {formatDate(s.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  s.status === 'published' ? 'bg-success/10 text-success' :
                  'bg-paper ring-1 ring-line text-muted'
                }`}>
                  {s.status}
                </span>
                {s.status === 'published' && (
                  <a
                    href={`/stories/${s.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-accent hover:text-accent-2"
                  >
                    View
                  </a>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-line p-10 text-center">
            <p className="text-muted mb-4">No stories yet.</p>
            <Link
              href="/writer/stories/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white"
            >
              + Create your first story
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-card ring-1 ring-line p-6">
        <h2 className="font-display font-bold uppercase text-lg mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/writer/stories/new" className="px-4 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line hover:ring-accent/50">
            New Story
          </Link>
          <a href="/stories" target="_blank" className="px-4 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line hover:ring-accent/50">
            View All Stories
          </a>
          <Link href="/writer/logout" className="px-4 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line hover:ring-danger/50 text-danger">
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
}
