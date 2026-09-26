import type { Metadata } from 'next';
import Reveal from '@/components/site/Reveal';
import AdvertiseForm from '@/components/site/AdvertiseForm';
import { SectionHead } from '@/components/site/Cards';
import { getActiveSlots, getAdPackages } from '@/lib/data';

export const metadata: Metadata = { title: 'Advertise with me' };

export const dynamic = 'force-dynamic';

export default async function AdvertisePage() {
  const [packages, slots] = await Promise.all([getAdPackages(), getActiveSlots()]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <SectionHead
            asPage
            className="mb-0 relative"
            title="Advertise with me"
            sub="Reach my audience — students, founders and businesses across Nigeria. Pay per day, cancel anytime."
          />
        </div>
      </Reveal>

      <Reveal>
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            ['1', 'Pick a package', 'Status, channel, website — or all three.'],
            ['2', 'Choose 1–14 days', '3-day bundles save you money. Pay on the spot.'],
            ['3', 'I approve & publish', 'Website ads go live instantly on my site; status & channel ads get posted by me.']
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
              <span className="text-xs font-black uppercase tracking-widest text-accent">Step {n}</span>
              <h3 className="font-display font-bold uppercase text-lg mt-1">{t}</h3>
              <p className="text-sm text-muted mt-2">{d}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {packages.length ? (
        <Reveal>
          <AdvertiseForm packages={packages} slots={slots} />
        </Reveal>
      ) : (
        <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-10 text-center">
          Ad packages are being prepared — contact me and I&apos;ll let you know when they open.
        </p>
      )}
    </div>
  );
}
