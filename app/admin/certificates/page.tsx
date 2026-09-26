import AdminHeader from '@/components/admin/AdminHeader';
import AdminApiButton from '@/components/academy/AdminApiButton';
import IssueCertForm from '@/components/academy/IssueCertForm';
import pool from '@/lib/db';
import { ensureAcademySchema } from '@/lib/academy-schema';

export const metadata: { title: string } = { title: 'Certificates' };
export const dynamic = 'force-dynamic';

export default async function AdminCertificatesPage() {
  await ensureAcademySchema();
  const [{ rows: certs }, { rows: students }, { rows: courses }] = await Promise.all([
    pool.query(
      `SELECT cert.id, cert.code, cert.issued_at, s.name AS student_name, s.email, c.title AS course_title, c.slug
       FROM certificates cert
       JOIN students s ON s.id = cert.student_id
       JOIN courses c ON c.id = cert.course_id
       ORDER BY cert.issued_at DESC`
    ),
    pool.query('SELECT id, name, email FROM students ORDER BY name ASC'),
    pool.query('SELECT id, title FROM courses ORDER BY title ASC')
  ]);

  return (
    <div className="space-y-6">
      <AdminHeader title="Certificates" sub={`${certs.length} issued · students earn them automatically on completion`} />

      <div className="rounded-2xl bg-card ring-1 ring-line p-5">
        <p className="text-xs font-black uppercase tracking-widest text-accent mb-3">Issue manually</p>
        <IssueCertForm students={students} courses={courses} />
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Course</th>
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Issued</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {certs.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">No certificates issued yet.</td></tr>
              )}
              {certs.map((c) => (
                <tr key={c.id} className="hover:bg-ink/[0.02]">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{c.student_name}</p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </td>
                  <td className="px-5 py-3">{c.course_title}</td>
                  <td className="px-5 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-5 py-3 text-xs text-muted">{new Date(c.issued_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <a href={`/certificates/${c.code}`} target="_blank" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-paper ring-1 ring-line hover:ring-accent/50">View</a>
                      <AdminApiButton url={`/api/admin/academy/certificates/${c.id}`} method="DELETE" label="Revoke" tone="danger" confirmText="Revoke this certificate?" />
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
