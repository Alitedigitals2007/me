import type { Metadata } from 'next';
import Reveal from '@/components/site/Reveal';
import AdSlot from '@/components/site/AdSlot';
import OrbitSystem from '@/components/site/OrbitSystem';
import { getEducation, getRoles } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'About' };

export const dynamic = 'force-dynamic';

const VALUES = [
  ['Growth', 'Improvement is non-negotiable'],
  ['Discipline', 'Execution over excuses'],
  ['Innovation', 'Building smarter solutions'],
  ['Accountability', 'Measurable action'],
  ['Excellence', 'Quality at every level']
];

export default async function AboutPage() {
  const [education, roles, ads, settings] = await Promise.all([
    getEducation(),
    getRoles(),
    loadAds(),
    getSettings()
  ]);
  const schools = education.filter((e) => e.type !== 'certification');
  const certifications = education.filter((e) => e.type === 'certification');

  const byYear: Map<string, (typeof roles)[number]> = new Map();
  for (const r of [...roles].sort((a, b) => a.order_index - b.order_index)) {
    const key = r.start_date || 'Earlier';
    const bucket = byYear.get(key);
    if (bucket) bucket.push(r);
    else byYear.set(key, [r]);
  }
  const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));
  const isNow = (end?: string | null) => (end || '').trim().toLowerCase() === 'present';

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Who is Alite</p>
          <h1 className="mt-3 font-display font-extrabold uppercase tracking-tight text-[clamp(2.2rem,5.5vw,4.2rem)] leading-[0.95]">
            Atilola Israel<br />
            <span className="text-gradient">Ayomide</span>
          </h1>
          <div className="mt-6 max-w-2xl border-l-4 border-accent pl-6">
            <p className="text-lg md:text-xl text-ink-soft italic font-medium leading-relaxed">
              “I build smart systems that help people manage, grow, and succeed through technology and structured thinking.”
            </p>
          </div>
          <p className="mt-6 max-w-2xl text-ink-soft leading-relaxed">{settings.about_bio}</p>
        </Reveal>

        <Reveal delay={0.15}>
          <OrbitSystem photo={settings.hero_photo || '/img/me.jpg'} name={settings.hero_name} />
        </Reveal>
      </div>

      <div className="mt-16 grid lg:grid-cols-2 gap-10">
        <div>
          <Reveal>
            <h2 className="font-display font-bold uppercase text-2xl mb-6">Education</h2>
          </Reveal>
          <div className="space-y-4">
            {schools.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.06}>
                <div className="rounded-2xl bg-card ring-1 ring-line shadow-card p-6 hover:shadow-lift transition-shadow">
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-accent">
                    {e.start_date}{e.end_date ? ` — ${e.end_date}` : ''}
                  </p>
                  <h3 className="font-display font-bold text-xl mt-1">{e.program}</h3>
                  <p className="text-sm font-semibold text-accent">{e.institution}</p>
                  {e.description && <p className="text-sm text-muted mt-2">{e.description}</p>}
                </div>
              </Reveal>
            ))}
          </div>
          {certifications.length > 0 && (
            <div className="mt-8">
              <Reveal>
                <h3 className="font-display font-bold uppercase text-lg mb-4">Certifications</h3>
              </Reveal>
              <div className="flex flex-wrap gap-3">
                {certifications.map((c, i) => (
                  <Reveal key={c.id} delay={i * 0.04}>
                    <div className="px-5 py-3 rounded-xl bg-gradient-to-br from-card to-paper ring-1 ring-line border-l-4 border-accent text-xs md:text-sm font-bold uppercase tracking-widest">
                      {c.program}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <Reveal>
            <h2 className="font-display font-bold uppercase text-2xl mb-6">Leadership &amp; roles</h2>
          </Reveal>
          <div className="relative">
            <span
              className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-accent/60 via-accent-2/40 to-transparent"
              aria-hidden
            />
            <div className="space-y-7">
              {years.map((year, gi) => {
                const items = byYear.get(year)!;
                const active = items.some((r) => isNow(r.end_date));
                return (
                  <Reveal key={year} delay={Math.min(gi * 0.06, 0.3)}>
                    <div className="relative pl-10">
                      <span
                        className={`absolute left-[15px] top-1.5 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ${
                          active ? 'bg-cyan-accent ring-cyan-accent/20' : 'bg-accent ring-accent/15'
                        }`}
                        aria-hidden
                      />
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className={`font-display font-extrabold text-xl ${active ? 'text-gradient' : 'text-ink'}`}>
                          {year}
                        </h3>
                        {active && (
                          <span className="rounded-full bg-cyan-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-accent ring-1 ring-cyan-accent/30">
                            Now
                          </span>
                        )}
                        <span className="h-px flex-1 bg-line" aria-hidden />
                        <span className="text-[11px] font-semibold text-muted">{items.length} roles</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((r) => (
                          <div
                            key={r.id}
                            className="group/role rounded-xl px-4 py-2.5 ring-1 ring-transparent hover:ring-accent/30 hover:bg-card transition-all"
                          >
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <p className="text-sm font-semibold text-ink group-hover/role:text-accent transition-colors">
                                {r.title}
                              </p>
                              <p className="text-xs font-semibold text-accent">{r.org}</p>
                              {isNow(r.end_date) && (
                                <span className="rounded-full bg-cyan-accent/10 px-2 py-px text-[9px] font-bold uppercase tracking-wider text-cyan-accent ring-1 ring-cyan-accent/30">
                                  Now
                                </span>
                              )}
                            </div>
                            {r.description && <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{r.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Reveal>
          <h2 className="font-display font-bold uppercase text-2xl mb-6">Core values</h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {VALUES.map(([k, v], i) => (
            <Reveal key={k} delay={i * 0.06}>
              <div className="rounded-2xl bg-gradient-to-br from-card to-paper ring-1 ring-line p-6 text-center hover:ring-accent/50 transition-all">
                <p className="font-display font-bold uppercase">{k}</p>
                <p className="text-[11px] text-muted mt-1 uppercase tracking-wide">{v}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <AdSlot ads={ads} position="sidebar" />
      </div>
    </div>
  );
}
