import Link from 'next/link';
import getPool from '@/lib/db';
import { getWriter } from '@/lib/writer-session';
import { ensureWriterSchema } from '@/lib/writer-schema';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/writer/ProfileForm';

export const metadata = { title: 'Writer Profile' };

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

export default async function WriterProfilePage() {
  const writer = await getWriter();
  if (!writer) return redirect('/writer/login');

  await ensureWriterSchema();
  const rows = await safeQuery(
    `SELECT id, name, email, bio, avatar_url, status FROM writer_users WHERE id=$1`,
    [writer.id]
  );
  const profile = rows[0];
  if (!profile) return redirect('/writer/login');

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-8">
        <Link href="/writer/dashboard" className="text-sm font-semibold text-accent hover:text-accent-2 inline-flex items-center gap-1 mb-2">
          ← Back to dashboard
        </Link>
        <h1 className="font-display font-extrabold uppercase text-3xl md:text-4xl tracking-[-0.02em]">
          Your <span className="text-gradient">Profile</span>
        </h1>
        <p className="text-sm text-muted mt-1">This is how readers see you on your stories.</p>
      </div>

      <ProfileForm
        initialName={profile.name}
        initialBio={profile.bio || ''}
        initialAvatar={profile.avatar_url || ''}
        email={profile.email}
        status={profile.status}
      />
    </div>
  );
}
