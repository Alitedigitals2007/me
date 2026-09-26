import type { Metadata } from 'next';
import Link from 'next/link';
import CertLookup from '@/components/academy/CertLookup';

export const metadata: Metadata = { title: 'Verify a certificate · Academy' };
export const dynamic = 'force-dynamic';

export default function CertificatesIndexPage() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-5 py-16">
      <div className="w-full max-w-lg rounded-3xl bg-card ring-1 ring-line shadow-card p-8 text-center relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
        <p className="text-xs font-black uppercase tracking-widest text-accent">ALITE Academy</p>
        <h1 className="font-display font-extrabold uppercase text-3xl mt-2">Verify a certificate</h1>
        <p className="text-sm text-muted mt-2">
          Enter the certificate ID to view and print an official completion certificate.
        </p>
        <CertLookup />
        <p className="text-xs text-muted mt-5">
          Completed a course? Your certificate code is in your{' '}
          <Link href="/dashboard#certificates" className="text-accent font-semibold">
            dashboard →
          </Link>
        </p>
      </div>
    </div>
  );
}
