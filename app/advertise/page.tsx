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
        <SectionHead
          asPage
          title="Advertise with me"
          sub="Reach my audience — students, founders and businesses across Nigeria. Pay per day, cancel anytime."
        />
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
