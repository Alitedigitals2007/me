import StoryForm from '@/components/writer/StoryForm';
import { getWriter } from '@/lib/writer-session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = { title: 'New Story' };

export default async function NewStoryPage() {
  const writer = await getWriter();
  if (!writer) return redirect('/writer/login');

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-8">
        <Link href="/writer/dashboard" className="text-sm font-semibold text-accent hover:text-accent-2 inline-flex items-center gap-1">
          ← Back to dashboard
        </Link>
        <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl mt-2 tracking-[-0.02em]">
          New <span className="text-gradient">Story</span>
        </h1>
      </div>
      <StoryForm />
    </div>
  );
}