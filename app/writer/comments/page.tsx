import Link from 'next/link';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';
import { ensureWriterSchema } from '@/lib/writer-schema';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import DeleteCommentButton from '@/components/writer/DeleteCommentButton';

export const metadata = { title: 'Writer Comments' };

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

export default async function WriterCommentsPage() {
  const writer = await getWriter();
  if (!writer) return redirect('/writer/login');

  await ensureWriterSchema();
  const [comments, counts] = await Promise.all([
    safeQuery(
      `SELECT c.id, c.name, c.content, c.created_at,
              s.title AS story_title, s.slug AS story_slug, s.id AS story_id
       FROM story_comments c
       JOIN stories s ON s.id = c.story_id
       WHERE s.writer_id=$1
       ORDER BY c.created_at DESC LIMIT 200`,
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
  const total = counts[0]?.c ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-accent">Writer</p>
        <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl mt-1 tracking-[-0.02em]">
          Reader <span className="text-gradient">Comments</span>
        </h1>
        <p className="text-sm text-muted mt-1">
          {total.toLocaleString()} comment{total === 1 ? '' : 's'} across your stories.
        </p>
      </div>

      <div className="space-y-3">
        {comments.length ? (
          comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{c.name}</span>{' '}
                    <span className="text-muted">on</span>{' '}
                    <Link href={`/stories/${c.story_slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:text-accent-2">
                      {c.story_title}
                    </Link>
                  </p>
                  <p className="text-sm text-ink-soft mt-1 break-words whitespace-pre-wrap">{c.content}</p>
                </div>
                <span className="text-xs text-muted shrink-0">{formatDate(c.created_at)}</span>
              </div>
              <div className="mt-3 flex justify-end">
                <DeleteCommentButton id={c.id} />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-line p-10 text-center">
            <p className="text-muted">No comments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
