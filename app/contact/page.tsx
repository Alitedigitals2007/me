import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import ContactForm from '@/components/site/ContactForm';
import SocialIcon from '@/components/site/SocialIcon';
import { SectionHead } from '@/components/site/Cards';
import { getSettings } from '@/lib/settings';
import { getSocialAccounts } from '@/lib/data';

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactPage() {
  const [settings, socials] = await Promise.all([getSettings(), getSocialAccounts()]);
  const whatsapp = settings.contact_whatsapp || '2349154681851';
  const email = settings.contact_email || 'contact@alite.site';

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.08] via-card to-cyan-accent/[0.06] ring-1 ring-line p-7 md:p-9">
          <span className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-cyan-accent/15 blur-3xl" aria-hidden />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-cyan-accent" aria-hidden />
          <SectionHead asPage className="mb-0 relative" title="Let's talk" sub="Project, collaboration, or just to say hi — my inbox is open." />
        </div>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        <Reveal>
          <div className="space-y-4">
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              className="flex items-center gap-4 rounded-3xl bg-card ring-1 ring-line shadow-card p-5 hover:-translate-y-0.5 transition-transform"
            >
              <span className="w-12 h-12 rounded-2xl bg-success/10 text-success grid place-items-center text-xl">✆</span>
              <div>
                <p className="font-display font-bold uppercase">WhatsApp (fastest)</p>
                <p className="text-sm text-muted">Replies within hours</p>
              </div>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-4 rounded-3xl bg-card ring-1 ring-line shadow-card p-5 hover:-translate-y-0.5 transition-transform"
            >
              <span className="w-12 h-12 rounded-2xl bg-accent/10 text-accent grid place-items-center text-xl">@</span>
              <div>
                <p className="font-display font-bold uppercase">Email</p>
                <p className="text-sm text-muted">{email}</p>
              </div>
            </a>
            {socials.length > 0 && (
              <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Follow me</p>
                <div className="flex flex-wrap gap-2.5">
                  {socials.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-paper ring-1 ring-line hover:ring-accent/50 hover:-translate-y-0.5 transition-all text-sm font-semibold"
                    >
                      <span className="text-accent"><SocialIcon platform={s.platform} size={16} /></span>
                      {s.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-5">
              <p className="text-sm text-muted">
                Based in Ibadan, Nigeria — open to remote work and collaborations worldwide.
              </p>
            </div>
            <p className="text-sm text-muted pt-2">
              Want to work together? Check the{' '}
              <Link href="/portfolio" className="text-accent font-semibold">portfolio</Link> and{' '}
              <Link href="/marketplace" className="text-accent font-semibold">marketplace</Link> first.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}
