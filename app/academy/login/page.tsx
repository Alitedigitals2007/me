import type { Metadata } from 'next';
import Link from 'next/link';
import AuthForm from '@/components/academy/AuthForm';

export const metadata: Metadata = { title: 'Student login · Academy' };

export default function StudentLoginPage() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-5 py-14">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-card ring-1 ring-line shadow-card p-8">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <Link href="/academy" className="text-xs font-bold uppercase tracking-widest text-accent">← Academy</Link>
          <h1 className="font-display font-extrabold uppercase text-2xl mt-2">Student login</h1>
          <p className="text-sm text-muted mt-1 mb-6">Access your courses, assignments and certificates.</p>
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
}
