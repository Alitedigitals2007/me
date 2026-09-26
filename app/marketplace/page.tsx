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
        <SectionHead
          asPage
          title="Marketplace"
          sub="Things I have built, sell, or recommend — courses, tools, and services."
        />
      </Reveal>
      <MarketplaceGrid listings={listings} />
    </div>
  );
}
