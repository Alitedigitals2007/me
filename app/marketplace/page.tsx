import type { Metadata } from 'next';
import Reveal from '@/components/site/Reveal';
import { SectionHead } from '@/components/site/Cards';
import MarketplaceGrid from '@/components/site/MarketplaceGrid';
import { getActiveListings } from '@/lib/data';

export const metadata: Metadata = { title: 'Marketplace' };
export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const listings = await getActiveListings();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <SectionHead
            asPage
            className="mb-0 relative"
            title="Marketplace"
            sub="Things I have built, sell, or recommend — courses, tools, and services."
          />
        </div>
      </Reveal>
      <MarketplaceGrid listings={listings} />
    </div>
  );
}
