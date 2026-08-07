import type { Ad } from '@/lib/types';

export default function AdSlot({ ads, position }: { ads: Record<string, Ad[]>; position: string }) {
  const slotAds = ads[position];
  if (!slotAds || slotAds.length === 0) return null;
  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="grid gap-3">
        {slotAds.map((ad) => (
          <a
            key={ad.id}
            href={`/api/click/${ad.id}`}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="group block rounded-2xl overflow-hidden ring-1 ring-line shadow-card hover:shadow-lift transition-all"
          >
            <img src={ad.image_url} alt="Sponsored" className="w-full max-h-44 object-cover group-hover:scale-[1.01] transition-transform" />
          </a>
        ))}
      </div>
    </div>
  );
}
