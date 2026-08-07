import Link from 'next/link';
import ActionButton from '@/components/admin/ActionButton';
import ProjectForm from '@/components/admin/ProjectForm';
import pool from '@/lib/db';

export const metadata = { title: 'Projects' };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const sp = await searchParams;
  const { rows } = await pool.query('SELECT * FROM projects ORDER BY order_index ASC, created_at DESC');
  const editing = sp.edit ? rows.find((r) => String(r.id) === sp.edit) : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold uppercase text-3xl">Projects</h1>
        <Link href="/admin/projects?new=1" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white">
          + New project
        </Link>
      </div>

      {(sp.new || editing) && (
        <div className="mt-6">
          <ProjectForm editing={editing} />
        </div>
      )}

      <div className="mt-6 space-y-2">
        {rows.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 rounded-xl bg-card ring-1 ring-line px-4 py-3">
            <div className="min-w-0 flex items-center gap-3">
              {p.image_url && <img src={p.image_url} alt="" className="w-12 h-10 rounded-lg object-cover ring-1 ring-line" />}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {p.title} {p.featured && <span className="text-xs text-accent font-bold">★</span>}
                </p>
                <p className="text-xs text-muted truncate">{p.stack || p.slug}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/admin/projects?edit=${p.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-paper ring-1 ring-line text-ink-soft hover:ring-accent/50">
                Edit
              </Link>
              <ActionButton url={`/api/admin/projects/delete/${p.id}`} label="Delete" tone="danger" confirmText="Delete this project?" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
