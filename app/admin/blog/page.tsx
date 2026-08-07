import Link from 'next/link';
import ActionButton from '@/components/admin/ActionButton';
import PostForm from '@/components/admin/PostForm';
import pool from '@/lib/db';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Blog' };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const sp = await searchParams;
  const { rows } = await pool.query(
    'SELECT id,title,slug,status,publish_at,tags FROM blog_posts ORDER BY COALESCE(publish_at, created_at) DESC'
  );
  const editing = sp.edit ? await (async () => {
    const r = await pool.query('SELECT * FROM blog_posts WHERE id=$1', [sp.edit]);
    if (r.rows[0]?.publish_at) r.rows[0].publish_at_local = new Date(r.rows[0].publish_at).toISOString().slice(0, 16);
    return r.rows[0] ?? null;
  })() : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold uppercase text-3xl">Blog</h1>
        <Link href="/admin/blog?new=1" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white">
          + New post
        </Link>
      </div>

      {(sp.new || editing) && (
        <div className="mt-6">
          <PostForm editing={editing} />
        </div>
      )}

      <div className="mt-6 space-y-2">
        {rows.map((post) => (
          <div key={post.id} className="flex items-center justify-between gap-4 rounded-xl bg-card ring-1 ring-line px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{post.title}</p>
              <p className="text-xs text-muted truncate">
                {post.tags || 'no tags'} · {formatDateTime(post.publish_at)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                post.status === 'published' ? 'bg-success/10 text-success' :
                post.status === 'scheduled' ? 'bg-warning/15 text-warning-strong' :
                'bg-paper ring-1 ring-line text-muted'
              }`}>
                {post.status}
              </span>
              {post.status !== 'published' && (
                <ActionButton url={`/api/admin/posts/publish/${post.id}`} label="Publish" tone="success" />
              )}
              <Link href={`/admin/blog?edit=${post.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-paper ring-1 ring-line text-ink-soft hover:ring-accent/50">
                Edit
              </Link>
              <ActionButton url={`/api/admin/posts/delete/${post.id}`} label="Delete" tone="danger" confirmText="Delete this post?" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
