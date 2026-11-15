import Link from 'next/link';

export default function AdInvite({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link
        href="/advertise"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent hover:text-ink transition-colors"
      >
        <span aria-hidden>★</span> Place your advert here
      </Link>
    );
  }

  return (
    <Link
      href="/advertise"
      className="group flex items-center justify-between gap-3 rounded-2xl ring-1 ring-line bg-paper px-4 py-3 hover:ring-accent/50 transition-all"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="grid place-items-center w-9 h-9 shrink-0 rounded-xl bg-gradient-cta text-white text-sm shadow-[0_6px_16px_rgba(79,70,229,0.3)]" aria-hidden>
          ★
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-widest text-accent">Place your advert here</span>
          <span className="block text-[11px] text-muted leading-snug">
            Reach thousands of learners, readers and makers on every page.
          </span>
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-ink-soft group-hover:text-accent transition-colors">
        Advertise →
      </span>
    </Link>
  );
}
