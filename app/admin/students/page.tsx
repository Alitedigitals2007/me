import AdminHeader from '@/components/admin/AdminHeader';
import AdminApiButton from '@/components/academy/AdminApiButton';
import pool from '@/lib/db';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Students' };
export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  await ensureAcademySchema();
  const { rows: students } = await pool.query(
    `SELECT s.id, s.name, s.email, s.status, s.created_at,
            COALESCE(e.n, 0)::int AS courses,
            COALESCE(c.certs, 0)::int AS certs
     FROM students s
     LEFT JOIN (SELECT student_id, COUNT(*) AS n FROM enrollments WHERE status IN ('active','completed') GROUP BY student_id) e ON e.student_id = s.id
     LEFT JOIN (SELECT student_id, COUNT(*) AS certs FROM certificates GROUP BY student_id) c ON c.student_id = s.id
     ORDER BY s.created_at DESC`
  );

  return (
    <div className="space-y-6">
      <AdminHeader title="Students" sub={`${students.length} registered account${students.length === 1 ? '' : 's'}`} />

      <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-left px-5 py-3">Courses</th>
                <th className="text-left px-5 py-3">Certs</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">No students yet.</td></tr>
              )}
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-ink/[0.02]">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted">{s.email}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{formatDateTime(s.created_at)}</td>
                  <td className="px-5 py-3">{s.courses}</td>
                  <td className="px-5 py-3">{s.certs}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-danger/10 text-danger'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <AdminApiButton
                        url={`/api/admin/academy/students/${s.id}`}
                        method="PATCH"
                        body={{ status: s.status === 'active' ? 'disabled' : 'active' }}
                        label={s.status === 'active' ? 'Disable' : 'Enable'}
                        tone={s.status === 'active' ? 'danger' : 'success'}
                      />
                      <AdminApiButton url={`/api/admin/academy/students/${s.id}`} method="DELETE" label="Delete" tone="danger" confirmText={`Delete ${s.name} and all their progress, submissions and certificates?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
