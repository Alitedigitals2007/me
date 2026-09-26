import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import LogoutButton from '@/components/academy/LogoutButton';
import { SectionHead } from '@/components/site/Cards';
import { getPublishedCourses, coursePriceNumber } from '@/lib/academy';
import { getStudent } from '@/lib/student-session';

export const metadata: Metadata = { title: 'Academy' };
export const dynamic = 'force-dynamic';

export default async function AcademyPage() {
  const [courses, student] = await Promise.all([getPublishedCourses(), getStudent()]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <SectionHead
            asPage
            className="mb-0 relative"
            title="ALITE Academy"
            sub="Practical courses with lessons, assignments, live classes and certificates — free and paid."
          />
        </div>
      </Reveal>

      {student && (
        <Reveal>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-card ring-1 ring-line shadow-card px-5 py-3.5">
            <span className="text-sm">
              <span className="font-semibold">Hi {student.name.split(' ')[0]}</span>
              <span className="text-muted"> — you are logged in</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/dashboard" className="bg-gradient-cta text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:-translate-y-0.5 transition-all">
                My dashboard →
              </Link>
              <LogoutButton />
            </div>
          </div>
        </Reveal>
      )}

      {courses.length === 0 ? (
        <Reveal>
          <p className="mt-14 text-muted rounded-2xl bg-card ring-1 ring-line p-10 text-center">
            Courses are being prepared — check back soon.
          </p>
        </Reveal>
      ) : (
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => {
            const price = coursePriceNumber(c.price);
            const external = c.delivery === 'external';
            const CardInner = (
              <>
                {c.image_url && (
                  <div className="aspect-video overflow-hidden bg-paper">
                    <img src={c.image_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${price > 0 ? 'bg-accent/10 text-accent' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      {price > 0 ? `₦${price.toLocaleString()}` : 'Free'}
                    </span>
                    {c.level && <span className="text-[11px] font-semibold uppercase tracking-wider text-muted ring-1 ring-line px-2.5 py-1 rounded-full">{c.level}</span>}
                    {c.duration && <span className="text-[11px] font-semibold text-muted ring-1 ring-line px-2.5 py-1 rounded-full">{c.duration}</span>}
                  </div>
                  <h3 className="font-display font-bold text-lg mt-3 group-hover:text-accent transition-colors">{c.title}</h3>
                  <p className="text-sm text-muted mt-2 line-clamp-2">{c.description}</p>
                  <span className="inline-block mt-4 text-sm font-semibold text-accent">{external ? 'View course →' : 'View curriculum →'}</span>
                </div>
              </>
            );
            const base = 'group rounded-3xl bg-card ring-1 ring-line shadow-card overflow-hidden hover:ring-accent/40 hover:shadow-lift transition-all block';
            return (
              <Reveal key={c.id}>
                {external ? (
                  <a href={c.link || '#'} target="_blank" rel="noopener noreferrer" className={base}>
                    {CardInner}
                  </a>
                ) : (
                  <Link href={`/academy/${c.slug}`} className={base}>
                    {CardInner}
                  </Link>
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
