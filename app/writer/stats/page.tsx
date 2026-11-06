import Link from 'next/link';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';
import { ensureWriterSchema } from '@/lib/writer-schema';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Writer Stats' };

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

function Stat({ label, value, tone = 'accent' }: { label: string; value: string | number; tone?: 'accent' | 'cyan' | 'success' | 'warning' }) {
  const tones: Record<string, string> = {
    accent: 'text-accent',
    cyan: 'text-cyan-accent',
    success: 'text-success',
    warning: 'text-warning-strong'
  };
  return (
    <div className="rounded-2xl bg-card ring-1 ring-line p-4">
      <p className={`font-display font-extrabold text-2xl md:text-3xl ${tones[tone]}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted mt-1">{label}</p>
    </div>
  );
}

export default async function WriterStatsPage() {
  const writer = await getWriter();
  if (!writer) return redirect('/writer/login');

  await ensureWriterSchema();
  const [stories, viewsByDay, commentsCount] = await Promise.all([
    safeQuery(
      `SELECT id, title, slug, status, views, like_count, reading_minutes, published_at, created_at
       FROM stories WHERE writer_id=$1 ORDER BY views DESC`,
      [writer.id]
    ),
    safeQuery(
      `SELECT TO_CHAR(sv.viewed_at::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS c
       FROM story_views sv
       JOIN stories s ON s.id = sv.story_id
       WHERE s.writer_id=$1 AND sv.viewed_at >= now() - interval '14 days'
       GROUP BY day ORDER BY day`,
      [writer.id]
    ),
    safeQuery(
      `SELECT COUNT(*)::int AS c
       FROM story_comments c
       JOIN stories s ON s.id = c.story_id
       WHERE s.writer_id=$1`,
      [writer.id]
    )
  ]);

  const storyIds = stories.map((s) => s.id);
  const [likes, views] = await Promise.all([
    safeQuery(
      `SELECT COUNT(*)::int AS c FROM story_likes l JOIN stories s ON s.id=l.story_id WHERE s.writer_id=$1`,
      [writer.id]
    ),
    safeQuery(
      `SELECT COUNT(*)::int AS c FROM story_views v JOIN stories s ON s.id=v.story_id WHERE s.writer_id=$1`,
      [writer.id]
    )
  ]);

  const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalLikes = stories.reduce((sum, s) => sum + (s.like_count || 0), 0);
  const published = stories.filter((s) => s.status === 'published');
  const avgViews = published.length ? Math.round(totalViews / published.length) : 0;
  const engagement = totalViews ? Math.round((totalLikes / totalViews) * 1000) / 10 : 0;
  const uniqueViews = views[0]?.c ?? 0;
  const uniqueLikes = likes[0]?.c ?? 0;
  const totalComments = commentsCount[0]?.c ?? 0;

  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const viewMap = Object.fromEntries(viewsByDay.map((r) => [r.day, r.c]));
  const peak = Math.max(1, ...days.map((d) => viewMap[d] || 0));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-accent">Writer</p>
        <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl mt-1 tracking-[-0.02em]">
          Your <span className="text-gradient">Stats</span>
        </h1>
        <p className="text-sm text-muted mt-1">How your stories are performing.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <Stat label="Total views" value={totalViews} />
        <Stat label="Total likes" value={totalLikes} tone="cyan" />
        <Stat label="Published" value={published.length} tone="success" />
        <Stat label="Avg views / story" value={avgViews} tone="warning" />
        <Stat label="Like rate" value={`${engagement}%`} />
        <Stat label="Comments" value={totalComments} tone="cyan" />
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-line p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold uppercase text-lg">Views · last 14 days</h2>
          <span className="text-xs text-muted">{uniqueViews.toLocaleString()} unique view{uniqueViews === 1 ? '' : 's'} all time</span>
        </div>
        <div className="flex items-end gap-1 h-32">
          {days.map((d) => {
            const c = viewMap[d] || 0;
            const h = Math.max(4, Math.round((c / peak) * 100));
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1" title={`${d}: ${c} view${c === 1 ? '' : 's'}`}>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-accent/40 to-accent"
                  style={{ height: `${h}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted">
          <span>{days[0].slice(5)}</span>
          <span>today</span>
        </div>
      </div>

      <h2 className="font-display font-extrabold uppercase text-xl mb-4">
        Stories<span className="text-gradient">.</span>
      </h2>
      <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
        {stories.length ? (
          stories.map((s) => (
            <div key={s.id} className="px-5 py-4 border-b border-line last:border-0 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/writer/stories/${s.id}/edit`} className="font-semibold text-sm hover:text-accent truncate block">
                  {s.title}
                </Link>
                <p className="text-[11px] text-muted">
                  <span className="capitalize">{s.status}</span>
                  {s.published_at ? ` · published ${formatDate(s.published_at)}` : ''}
                  {` · ${s.reading_minutes || 1} min read`}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <span className="font-semibold text-accent">{s.views || 0} <span className="text-muted font-normal">views</span></span>
                <span className="font-semibold text-cyan-accent">{s.like_count || 0} <span className="text-muted font-normal">likes</span></span>
              </div>
            </div>
          ))
        ) : (
          <p className="p-8 text-sm text-muted text-center">No stories yet.</p>
        )}
      </div>
      {storyIds.length === 0 && (
        <p className="text-xs text-muted mt-4">
          Publish your first story to start collecting views and likes.
        </p>
      )}
    </div>
  );
}
