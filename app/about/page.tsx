import type { Metadata } from 'next';
import Reveal from '@/components/site/Reveal';
import AdSlot from '@/components/site/AdSlot';
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

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Who is Alite</p>
        <h1 className="mt-3 font-display font-extrabold uppercase tracking-tight text-[clamp(2.2rem,5.5vw,3.8rem)] leading-[0.95]">
          Atilola Israel<br />
          <span className="text-gradient">Ayomide</span>
        </h1>
        <div className="mt-6 max-w-3xl border-l-4 border-accent pl-6">
          <p className="text-lg md:text-xl text-ink-soft italic font-medium leading-relaxed">
            “I build smart systems that help people manage, grow, and succeed through technology and structured thinking.”
          </p>
        </div>
        <p className="mt-6 max-w-3xl text-ink-soft leading-relaxed">{settings.about_bio}</p>
      </Reveal>

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
            <h2 className="font-display font-bold uppercase text-2xl mb-6">Leadership & roles</h2>
          </Reveal>
          <div className="space-y-4">
            {roles.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.05}>
                <div className="group rounded-2xl bg-card ring-1 ring-line shadow-card p-6 hover:shadow-lift hover:-translate-y-0.5 transition-all">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display font-bold text-lg group-hover:text-accent transition-colors">{r.title}</h3>
                    <p className="text-xs font-semibold text-muted">{r.start_date}{r.end_date ? ` — ${r.end_date}` : ''}</p>
                  </div>
                  <p className="text-sm font-semibold text-accent mt-0.5">{r.org}</p>
                  {r.description && <p className="text-sm text-muted mt-2">{r.description}</p>}
                </div>
              </Reveal>
            ))}
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
