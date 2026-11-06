import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '@/components/site/Reveal';
import StoryCard from '@/components/site/StoryCard';
import { getWriterProfile, getPublishedStoriesByWriter } from '@/lib/data';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const writer = await getWriterProfile(Number(id));
  return {
    title: writer ? `${writer.name} — Writer` : 'Writer',
    description: writer?.bio || `Stories by ${writer?.name ?? 'a writer'} on ALITE.`
  };
}

export default async function WriterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const writerId = Number(id);
  if (!Number.isFinite(writerId)) notFound();

  const writer = await getWriterProfile(writerId);
  if (!writer) notFound();
  const stories = await getPublishedStoriesByWriter(writerId);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-cyan-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {writer.avatar_url ? (
              <img src={writer.avatar_url} alt={writer.name} className="w-20 h-20 rounded-2xl object-cover ring-1 ring-line" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-paper ring-1 ring-line grid place-items-center font-display font-bold text-3xl text-line">
                {writer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <Link href="/stories" className="text-sm font-semibold text-accent hover:text-accent-2 transition-colors">
                ← All stories
              </Link>
              <h1 className="font-display font-extrabold uppercase tracking-tight text-3xl md:text-4xl mt-1">{writer.name}</h1>
              <p className="text-sm text-muted mt-1">
                {writer.story_count} {writer.story_count === 1 ? 'story' : 'stories'} · joined {formatDate(writer.created_at)}
              </p>
            </div>
          </div>
          {writer.bio && <p className="relative mt-5 text-ink-soft leading-relaxed max-w-3xl">{writer.bio}</p>}
        </div>
      </Reveal>

      <h2 className="font-display font-extrabold uppercase text-2xl tracking-tight mt-12 mb-5">
        Stories<span className="text-gradient">.</span>
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stories.map((s, i) => (
          <Reveal key={s.id} delay={(i % 3) * 0.08}>
            <StoryCard s={s} />
          </Reveal>
        ))}
      </div>
      {!stories.length && (
        <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-10 text-center">No published stories yet.</p>
      )}
    </div>
  );
}
