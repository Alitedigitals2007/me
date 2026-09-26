import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminApiButton from '@/components/academy/AdminApiButton';
import CourseForm from '@/components/academy/CourseForm';
import pool from '@/lib/db';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { coursePriceNumber } from '@/lib/academy';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Academy' };
export const dynamic = 'force-dynamic';

export default async function AdminAcademyPage() {
  await ensureAcademySchema();
  const [{ rows: courses }, { rows: stats }] = await Promise.all([
    pool.query(
      `SELECT c.*, COALESCE(e.n, 0)::int AS students,
              COALESCE(p.pending, 0)::int AS pending
       FROM courses c
       LEFT JOIN (SELECT course_id, COUNT(*) AS n FROM enrollments WHERE status IN ('active','completed') GROUP BY course_id) e ON e.course_id = c.id
       LEFT JOIN (SELECT a.course_id, COUNT(*) AS pending FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.status='pending' GROUP BY a.course_id) p ON p.course_id = c.id
       ORDER BY c.order_index ASC, c.id ASC`
    ),
    pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM students) AS students,
        (SELECT COUNT(*)::int FROM enrollments WHERE status IN ('active','completed')) AS enrollments,
        (SELECT COUNT(*)::int FROM submissions WHERE status='pending') AS pending,
        (SELECT COUNT(*)::int FROM certificates) AS certs`
    )
  ]);
  const s = stats[0];

  return (
    <div className="space-y-6">
      <AdminHeader title="Academy" sub="Courses, curriculum, students and certificates.">
        <div className="flex gap-2">
          <Link href="/admin/submissions" className="px-4 py-2 rounded-full text-xs font-semibold bg-paper ring-1 ring-line hover:ring-accent/50">Grade submissions</Link>
          <Link href="/academy" target="_blank" className="px-4 py-2 rounded-full text-xs font-semibold bg-paper ring-1 ring-line hover:ring-accent/50">View public page ↗</Link>
        </div>
      </AdminHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Students', s.students, 'Registered accounts'],
          ['Enrollments', s.enrollments, 'Active + completed'],
          ['To grade', s.pending, 'Pending submissions'],
          ['Certificates', s.certs, 'Issued']
        ].map(([label, value, sub]) => (
          <div key={label as string} className="relative overflow-hidden rounded-2xl bg-card ring-1 ring-line p-5">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
            <p className="text-xs font-black uppercase tracking-widest text-muted">{label}</p>
            <p className="font-display font-extrabold text-3xl mt-1">{value as number}</p>
            <p className="text-[11px] text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <CourseForm />

      <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Price</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Students</th>
                <th className="text-left px-5 py-3">To grade</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {courses.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-muted">No courses yet — create the first one above.</td></tr>
              )}
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-ink/[0.02]">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-xs text-muted font-mono">/academy/{c.slug || c.id}</p>
                    <p className="text-xs text-muted">{formatDateTime(c.created_at)}</p>
                  </td>
                  <td className="px-5 py-3">{coursePriceNumber(c.price) > 0 ? `₦${coursePriceNumber(c.price).toLocaleString()}` : 'Free'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${c.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs">{c.delivery}</td>
                  <td className="px-5 py-3">{c.students}</td>
                  <td className="px-5 py-3">{c.pending > 0 ? <span className="font-bold text-amber-600">{c.pending}</span> : 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/courses/${c.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white">Open studio</Link>
                      <AdminApiButton url={`/api/admin/academy/courses/${c.id}`} method="DELETE" label="Delete" tone="danger" confirmText={`Delete "${c.title}" and ALL its lessons, assignments and enrollments?`} />
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
