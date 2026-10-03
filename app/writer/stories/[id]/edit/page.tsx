import StoryForm from '@/components/writer/StoryForm';
import { getWriter } from '@/lib/writer-session';
import getPool from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Story } from '@/lib/types';

export const metadata = { title: 'Edit Story' };

interface Props {
  params: Promise<{ id: string }>;
}

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

export default async function EditStoryPage({ params }: Props) {
  const writer = await getWriter();
  if (!writer) return redirect('/writer/login');

  const { id } = await params;
  const rows = await safeQuery('SELECT * FROM stories WHERE id=$1 AND writer_id=$2', [id, writer.id]);
  const story = rows[0] as Story | undefined;
  if (!story) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/writer/dashboard" className="text-sm font-semibold text-accent hover:text-accent-2 inline-flex items-center gap-1 mb-2">
            ← Back to dashboard
          </Link>
          <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl tracking-[-0.02em]">
            Edit <span className="text-gradient">Story</span>
          </h1>
        </div>
        {story.status === 'published' && (
          <a
            href={`/stories/${story.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line hover:ring-accent/50"
          >
            View Live
          </a>
        )}
      </div>
      <StoryForm initialData={story} />
    </div>
  );
}