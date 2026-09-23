import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdSlot from '@/components/site/AdSlot';
import { BlogCard, SectionHead } from '@/components/site/Cards';
import { getPost, getRelatedPosts } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { formatDate } from '@/lib/utils';
import BlogPostActions from '@/components/site/BlogPostActions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post?.title ?? 'Post',
    description: post?.excerpt || post?.content.replace(/<[^>]+>/g, '').slice(0, 160),
    openGraph: {
      title: post?.title ?? 'Post',
      description: post?.excerpt || post?.content.replace(/<[^>]+>/g, '').slice(0, 160),
      images: post?.cover_image ? [post.cover_image] : [],
      type: 'article',
      publishedTime: post?.publish_at ?? undefined,
    }
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [related, ads] = await Promise.all([getRelatedPosts(post.id), loadAds()]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <Link href="/blog" className="text-sm font-semibold text-accent hover:text-accent-2 transition-colors inline-flex items-center gap-1.5">
        ← Back to blog
      </Link>
      <h1 className="mt-4 font-display font-extrabold uppercase tracking-tight text-[clamp(1.9rem,5vw,3rem)] leading-[1.05]">
        {post.title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>{formatDate(post.publish_at)}</span>
        {post.tags && (
          <span className="flex gap-1.5">
            {post.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
              <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="bg-accent/8 text-accent px-2.5 py-0.5 rounded-full text-xs font-semibold hover:bg-accent/15 transition-colors">
                #{t}
              </Link>
            ))}
          </span>
        )}
      </div>

      {post.cover_image && (
        <img src={post.cover_image} alt={post.title} className="mt-8 w-full rounded-2xl ring-1 ring-line shadow-card" />
      )}

      <article className="prose-alite mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />

      <BlogPostActions slug={slug} title={post.title} initialLikes={post.like_count} />

      <div className="mt-12">
        <AdSlot ads={ads} position="blog_inline" />
      </div>

      {related.length > 0 && (
        <div className="mt-16 border-t border-line pt-10">
          <SectionHead title="Keep reading" link="/blog" linkLabel="All posts" />
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((r, i) => (
              <BlogCard key={r.id} p={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
