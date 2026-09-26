'use client';

import { useMemo, useState } from 'react';
import Reveal from '@/components/site/Reveal';
import { ListingCard } from '@/components/site/Cards';
import type { Listing } from '@/lib/types';

export default function MarketplaceGrid({ listings }: { listings: Listing[] }) {
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const l of listings) if (l.category) set.add(l.category);
    return ['All', ...Array.from(set)];
  }, [listings]);

  const shown = category === 'All' ? listings : listings.filter((l) => l.category === category);

  if (!listings.length) {
    return (
      <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-10 text-center">
        The store is being stocked — check back soon.
      </p>
    );
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-3 rounded-full text-sm font-semibold ring-1 transition-all ${
                category === c
                  ? 'bg-gradient-cta text-white ring-transparent'
                  : 'bg-card ring-line text-muted hover:text-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shown.map((l, i) => (
          <Reveal key={l.id} delay={(i % 3) * 0.08}>
            <ListingCard l={l} />
          </Reveal>
        ))}
      </div>
      {!shown.length && (
        <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-10 text-center">Nothing in this category yet.</p>
      )}
    </div>
  );
}
