import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import { finalizePayment } from '@/lib/paystack';

export const metadata: Metadata = { title: 'Payment status' };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ ref?: string; type?: string }> }) {
  const { ref, type } = await searchParams;
  let status: 'success' | 'pending' | 'failed' = 'pending';
  let message = 'Verifying your payment…';
  let delivery: { type: 'file' | 'link'; file_id?: string; link?: string; title?: string } | undefined;

  if (ref) {
    try {
      const result = await finalizePayment(ref);
      status = result.success ? 'success' : 'failed';
      message = result.message;
      delivery = result.delivery;
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
          
          {status === 'success' && delivery && (
            <div className="mt-8 space-y-4 text-left">
              <h2 className="font-display font-bold text-lg">Your purchase: {delivery.title}</h2>
              {delivery.type === 'file' && delivery.file_id && (
                <a 
                  href={`/api/download/${delivery.file_id}`}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-cta text-white font-semibold px-6 py-4 hover:opacity-90 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download your file
                </a>
              )}
              {delivery.type === 'link' && delivery.link && (
                <a 
                  href={delivery.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-cta text-white font-semibold px-6 py-4 hover:opacity-90 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Access your content
                </a>
              )}
            </div>
          )}
          
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="bg-gradient-cta text-white font-semibold px-6 py-3 rounded-full">Back home</Link>
            <Link href="/contact" className="ring-1 ring-line bg-card font-semibold px-6 py-3 rounded-full">Need help?</Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
