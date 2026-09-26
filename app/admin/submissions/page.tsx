import AdminHeader from '@/components/admin/AdminHeader';
import GradeForm from '@/components/academy/GradeForm';
import pool from '@/lib/db';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { getAdmin } from '@/lib/admin-auth';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Submissions' };
export const dynamic = 'force-dynamic';

export default async function AdminSubmissionsPage() {
  const admin = await getAdmin();
  if (!admin) notFound();
  await ensureAcademySchema();

  const { rows } = await pool.query(
    `SELECT sub.id, sub.content, sub.file_url, sub.status, sub.score, sub.feedback, sub.submitted_at, sub.graded_at,
            a.title AS assignment_title, a.max_score, a.instructions, a.due_at,
            c.title AS course_title, c.slug AS course_slug,
            st.name AS student_name, st.email AS student_email
     FROM submissions sub
     JOIN assignments a ON a.id = sub.assignment_id
     JOIN courses c ON c.id = a.course_id
     JOIN students st ON st.id = sub.student_id
     ORDER BY (sub.status = 'pending') DESC, sub.submitted_at DESC
     LIMIT 200`
  );
  const pending = rows.filter((r) => r.status === 'pending');
  const graded = rows.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <AdminHeader title="Submissions" sub={`${pending.length} waiting to be graded · Telegram alert sent on every new submission`} />

      <section>
        <h2 className="font-display font-bold uppercase text-lg mb-3">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-6">Nothing to grade — all caught up.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">{s.course_title}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Pending</span>
                  <span className="text-xs text-muted ml-auto">{new Date(s.submitted_at).toLocaleString('en-GB')}</span>
                </div>
                <h3 className="font-display font-bold text-base mt-2">{s.assignment_title}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {s.student_name} · {s.student_email} · max {s.max_score}
                  {s.due_at ? ` · due ${new Date(s.due_at).toLocaleDateString('en-GB')}` : ''}
                </p>
                {s.instructions && <p className="text-xs text-muted mt-2 italic break-words whitespace-pre-wrap">“{s.instructions}”</p>}
                <div className="mt-3 rounded-xl bg-paper ring-1 ring-line p-4">
                  <p className="text-sm text-ink-soft whitespace-pre-wrap break-words">{s.content || '— (file submission only) —'}</p>
                  {s.file_url && (
                    <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent font-semibold underline mt-2 inline-block">
                      📎 Open attached file
                    </a>
                  )}
                </div>
                <GradeForm submissionId={s.id} maxScore={s.max_score} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold uppercase text-lg mb-3">Graded ({graded.length})</h2>
        {graded.length === 0 ? (
          <p className="text-sm text-muted">No graded submissions yet.</p>
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-left px-5 py-3">Assignment</th>
                    <th className="text-left px-5 py-3">Course</th>
                    <th className="text-left px-5 py-3">Score</th>
                    <th className="text-left px-5 py-3">Feedback</th>
                    <th className="text-left px-5 py-3">Graded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {graded.map((s) => (
                    <tr key={s.id} className="hover:bg-ink/[0.02]">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{s.student_name}</p>
                        <p className="text-xs text-muted">{s.student_email}</p>
                      </td>
                      <td className="px-5 py-3">{s.assignment_title}</td>
                      <td className="px-5 py-3 text-xs">{s.course_title}</td>
                      <td className="px-5 py-3 font-bold">{s.score ?? '—'}/{s.max_score}</td>
                      <td className="px-5 py-3 text-xs text-muted max-w-56 truncate" title={s.feedback || ''}>{s.feedback || '—'}</td>
                      <td className="px-5 py-3 text-xs text-muted">{s.graded_at ? new Date(s.graded_at).toLocaleDateString('en-GB') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
