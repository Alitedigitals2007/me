import Link from 'next/link';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';
import { ensureWriterSchema } from '@/lib/writer-schema';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import DeleteStoryButton from '@/components/writer/DeleteStoryButton';

export const metadata = { title: 'Writer Dashboard' };

const FILTERS = ['all', 'published', 'scheduled', 'draft'] as const;

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

export default async function WriterDashboard({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const writer = await getWriter();
  if (!writer) return redirect('/writer/login');

  const { filter } = await searchParams;
  const status = (FILTERS as readonly string[]).includes(filter || '') ? filter! : 'all';

  await ensureWriterSchema();
  const allStories = await safeQuery(
    `SELECT id, title, slug, status, cover_image, category, topic, tags, views, reading_minutes, like_count, created_at, published_at, updated_at
     FROM stories WHERE writer_id = $1 ORDER BY updated_at DESC`,
    [writer.id]
  );
  const stories = status === 'all' ? allStories : allStories.filter((s) => s.status === status);
  const statusCounts = FILTERS.reduce<Record<string, number>>((acc, f) => {
    acc[f] = f === 'all' ? allStories.length : allStories.filter((s) => s.status === f).length;
    return acc;
  }, {});
  const totalViews = allStories.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalLikes = allStories.reduce((sum, s) => sum + (s.like_count || 0), 0);
  const publishedCount = allStories.filter((s) => s.status === 'published').length;

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

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Published', value: publishedCount },
          { label: 'Total views', value: totalViews },
          { label: 'Likes', value: totalLikes }
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-card ring-1 ring-line p-4 text-center">
            <p className="font-display font-extrabold text-2xl md:text-3xl">{stat.value.toLocaleString()}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === 'all' ? '/writer/dashboard' : `/writer/dashboard?filter=${f}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-all ${
              status === f ? 'bg-accent text-white ring-accent' : 'bg-card ring-line text-muted hover:text-ink'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} {statusCounts[f]}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {stories.length ? (
          stories.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl bg-card ring-1 ring-line p-4 hover:ring-accent/40 transition-all"
            >
              <Link
                href={`/writer/stories/${s.id}/edit`}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {s.cover_image && (
                    <img src={s.cover_image} alt="" className="w-16 h-12 rounded-lg object-cover ring-1 ring-line shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{s.title}</p>
                    <p className="text-xs text-muted truncate">
                      {s.category ? <span className="text-accent font-semibold">{s.category}</span> : null}
                      {s.category ? ' · ' : ''}
                      {s.topic ? `${s.topic} · ` : ''}
                      {formatDate(s.updated_at)}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {s.status === 'published' ? `${s.views || 0} views · ${s.like_count || 0} likes · ` : ''}
                      {s.reading_minutes || 1} min read
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    s.status === 'published' ? 'bg-success/10 text-success' :
                    s.status === 'scheduled' ? 'bg-warning/15 text-warning-strong' :
                    'bg-paper ring-1 ring-line text-muted'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </Link>
              <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-line">
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
                <Link href={`/writer/stories/${s.id}/edit`} className="text-xs font-semibold text-ink-soft hover:text-ink">
                  Edit
                </Link>
                <DeleteStoryButton id={s.id} title={s.title} compact />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-line p-10 text-center">
            <p className="text-muted mb-4">{status === 'all' ? 'No stories yet.' : `No ${status} stories.`}</p>
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
