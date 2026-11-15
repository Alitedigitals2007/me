import type { Ad } from '@/lib/types';

export default function AdSlot({ ads, position }: { ads: Record<string, Ad[]>; position: string }) {
  const slotAds = ads[position];
  if (!slotAds || slotAds.length === 0) return null;
  return (
    <div className="grid gap-3">
      {slotAds.map((ad) => (
        <a
          key={ad.id}
          href={`/api/click/${ad.id}`}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="group block rounded-2xl overflow-hidden ring-1 ring-line shadow-card hover:shadow-lift transition-all"
        >
          <span className="relative block">
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-cta text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 shadow-[0_4px_12px_rgba(79,70,229,0.35)]">
              <span aria-hidden>★</span> Promotion
            </span>
            <img src={ad.image_url} alt="Sponsored" className="w-full max-h-44 object-cover group-hover:scale-[1.01] transition-transform" />
          </span>
          {ad.caption && (
            <span className="block px-3.5 py-2.5 bg-card text-xs font-semibold text-ink-soft leading-snug">
              {ad.caption}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
