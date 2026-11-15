import Link from 'next/link';

export default function WriterInvite({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link
        href="/login?mode=signup&role=writer"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent hover:text-ink transition-colors"
      >
        <span aria-hidden>✍</span> Want to be a writer?
      </Link>
    );
  }

  return (
    <Link
      href="/login?mode=signup&role=writer"
      className="group flex items-center justify-between gap-3 rounded-2xl ring-1 ring-line bg-paper px-4 py-3 hover:ring-accent/50 transition-all"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="grid place-items-center w-9 h-9 shrink-0 rounded-xl bg-accent/10 text-accent text-sm" aria-hidden>
          ✍
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-widest text-accent">Want to be a writer?</span>
          <span className="block text-[11px] text-muted leading-snug">
            Pitch a story, publish on ALITE and grow your audience.
          </span>
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-ink-soft group-hover:text-accent transition-colors">
        Start writing →
      </span>
    </Link>
  );
}
