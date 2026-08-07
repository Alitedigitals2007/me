import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import { finalizePayment } from '@/lib/paystack';

export const metadata: Metadata = { title: 'Payment status' };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ ref?: string; type?: string }> }) {
  const { ref, type } = await searchParams;
  let status: 'success' | 'pending' | 'failed' = 'pending';
  let message = 'Verifying your payment…';

  if (ref) {
    try {
      const result = await finalizePayment(ref);
      status = result.success ? 'success' : 'failed';
      message = result.message;
    } catch {
      status = 'failed';
      message = 'We could not verify the payment right now. If money was deducted, contact me and I will fix it manually.';
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center">
      <Reveal>
        <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-10">
          <p className="text-5xl mb-4">
            {status === 'success' ? '✓' : status === 'failed' ? '⚠' : '…'}
          </p>
          <h1 className="font-display font-extrabold uppercase text-3xl">
            {status === 'success' ? 'Payment received!' : status === 'failed' ? 'Payment not confirmed' : 'Verifying…'}
          </h1>
          <p className="text-muted mt-3">{message}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="bg-gradient-cta text-white font-semibold px-6 py-3 rounded-full">Back home</Link>
            <Link href="/contact" className="ring-1 ring-line bg-card font-semibold px-6 py-3 rounded-full">Need help?</Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
