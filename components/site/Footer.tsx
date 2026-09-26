import Link from 'next/link';
import type { Settings } from '@/lib/types';
import { getSocialAccounts } from '@/lib/data';
import SocialIcon from '@/components/site/SocialIcon';

export default async function Footer({ settings }: { settings: Settings }) {
  const accounts = await getSocialAccounts();
  const settingsSocials: Array<[string, string]> = [
    ['X (Twitter)', settings.social_twitter],
    ['GitHub', settings.social_github],
    ['LinkedIn', settings.social_linkedin],
    ['Instagram', settings.social_instagram]
  ].filter(([, u]) => !!u) as Array<[string, string]>;

  const socials = [...accounts.map((a) => [a.platform, a.url] as [string, string]), ...settingsSocials];
  const seen = new Set<string>();
  const merged = socials.filter(([, u]) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-ink text-white/80">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div>
            <p className="font-display font-bold text-xl text-white">
              ALITE<span className="text-gradient">_</span>
            </p>
            <p className="text-sm text-white/60 mt-1 max-w-sm">{settings.tagline}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-14">
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-xs uppercase tracking-widest text-white/50 font-semibold">Explore</span>
              <Link href="/portfolio" className="text-white/70 hover:text-cyan-accent transition-colors">Portfolio</Link>
              <Link href="/blog" className="text-white/70 hover:text-cyan-accent transition-colors">Blog</Link>
              <Link href="/marketplace" className="text-white/70 hover:text-cyan-accent transition-colors">Marketplace</Link>
              <Link href="/advertise" className="text-white/70 hover:text-cyan-accent transition-colors">Advertise</Link>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-xs uppercase tracking-widest text-white/50 font-semibold">Connect</span>
              {merged.map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/70 hover:text-cyan-accent transition-colors">
                  <span className="text-cyan-accent"><SocialIcon platform={label} size={14} /></span>
                  {label}
                </a>
              ))}
              {settings.contact_whatsapp && (
                <a href={`https://wa.me/${settings.contact_whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/70 hover:text-cyan-accent transition-colors">
                  <span className="text-cyan-accent"><SocialIcon platform="WhatsApp" size={14} /></span>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {year} {settings.site_name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</a>
            <Link href="/admin/login" className="hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
