import type { Metadata } from 'next';
import Link from 'next/link';
import PrintButton from '@/components/academy/PrintButton';
import pool from '@/lib/db';
import { ensureAcademySchema } from '@/lib/academy-schema';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Certificate ${code.toUpperCase()} · ALITE Academy` };
}

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await ensureAcademySchema();
  const { rows } = await pool.query(
    `SELECT cert.code, cert.issued_at, s.name AS student_name, c.title AS course_title
     FROM certificates cert
     JOIN students s ON s.id=cert.student_id
     JOIN courses c ON c.id=cert.course_id
     WHERE cert.code=$1`,
    [code]
  );
  if (!rows.length) {
    return (
      <div className="min-h-[70vh] grid place-items-center px-5 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-card ring-1 ring-line shadow-card p-8 text-center">
          <p className="text-4xl" aria-hidden>🔍</p>
          <h1 className="font-display font-extrabold uppercase text-2xl mt-3">Certificate not found</h1>
          <p className="text-sm text-muted mt-2 break-words">
            No certificate matches <span className="font-mono font-semibold text-ink">{code.toUpperCase()}</span>.
            Double-check the code — it looks like <span className="font-mono">ALITE-7F3K</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center text-sm">
            <Link href="/certificates" className="bg-gradient-cta text-white font-semibold px-6 py-2.5 rounded-full">
              Try another code
            </Link>
            <Link href="/dashboard" className="ring-1 ring-line font-semibold px-6 py-2.5 rounded-full hover:ring-accent/50 transition-all">
              My dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const cert = rows[0];

  return (
    <div className="min-h-[80vh] px-5 py-14 print:py-4 print:px-0 bg-paper">
      <div className="max-w-3xl mx-auto">
        <div className="flex print:hidden items-center justify-between mb-4 text-sm">
          <Link href="/" className="text-muted hover:text-accent">← Back to site</Link>
          <PrintButton />
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-card ring-1 ring-line shadow-lift p-8 md:p-14 print:rounded-none print:shadow-none print:ring-0">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <span className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" aria-hidden />
          <span className="absolute -top-24 -right-16 h-48 w-48 rounded-full bg-cyan-accent/10 blur-3xl" aria-hidden />

          <div className="relative text-center">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-accent">ALITE Academy</p>
            <p className="font-display font-bold uppercase text-lg md:text-xl mt-6 text-muted">Certificate of Completion</p>
            <p className="text-sm text-muted mt-6">This certifies that</p>
            <p className="font-display font-extrabold uppercase text-3xl md:text-5xl mt-3 tracking-[-0.02em] break-words">{cert.student_name}</p>
            <p className="text-sm text-muted mt-6">has successfully completed the course</p>
            <p className="font-display font-bold uppercase text-xl md:text-3xl mt-2 text-accent break-words">{cert.course_title}</p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
              <div>
                <p className="font-bold text-ink text-sm">{new Date(cert.issued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p className="uppercase tracking-wider">Date issued</p>
              </div>
              <div className="h-8 w-px bg-line" />
              <div>
                <p className="font-bold text-ink text-sm font-mono">{cert.code}</p>
                <p className="uppercase tracking-wider">Certificate ID</p>
              </div>
              <div className="h-8 w-px bg-line" />
              <div>
                <p className="font-bold text-emerald-600 text-sm">✓ Verified</p>
                <p className="uppercase tracking-wider">alite academy</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted mt-4 print:hidden">
          Verify this certificate anytime at <span className="font-mono">{`/certificates/${cert.code}`}</span>
        </p>
      </div>
    </div>
  );
}
