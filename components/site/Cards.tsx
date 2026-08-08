import Link from 'next/link';
import type { BlogPost, Listing, Project } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { BuyNow } from './BuyNow';

export function SectionHead({ title, sub, link, linkLabel }: { title: string; sub?: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
      <div>
        <h2 className="font-display font-bold uppercase tracking-tight text-3xl md:text-4xl">
          <span className="text-gradient">{title.split(' ')[0]}</span> {title.split(' ').slice(1).join(' ')}
        </h2>
        {sub && <p className="text-muted mt-2 max-w-lg">{sub}</p>}
      </div>
      {link && (
        <Link href={link} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-2 transition-colors">
          {linkLabel || 'View all'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      )}
    </div>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      href={`/portfolio/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-line shadow-card hover:shadow-lift hover:-translate-y-1.5 transition-all duration-300"
    >
      <div className="relative overflow-hidden aspect-[16/10] bg-paper">
        {p.image_url ? (
          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center font-display font-bold text-4xl text-line">◆</div>
        )}
        {p.featured && (
          <span className="absolute top-3 left-3 bg-gradient-cta text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-bold text-lg group-hover:text-accent transition-colors">{p.title}</h3>
        {p.stack && <p className="text-xs font-semibold uppercase tracking-wider text-cyan-accent">{p.stack}</p>}
        <p className="text-sm text-muted line-clamp-2 flex-1">{p.description.replace(/<[^>]+>/g, '').slice(0, 120)}</p>
      </div>
    </Link>
  );
}

export function BlogCard({ p }: { p: BlogPost }) {
  return (
    <Link
      href={`/blog/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-line shadow-card hover:shadow-lift hover:-translate-y-1.5 transition-all duration-300"
    >
      <div className="relative overflow-hidden aspect-[16/9] bg-paper">
        {p.cover_image ? (
          <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center font-display font-bold text-3xl text-line">✎</div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <p className="text-xs text-muted">{formatDate(p.publish_at)}</p>
        <h3 className="font-display font-bold text-lg leading-snug group-hover:text-accent transition-colors">{p.title}</h3>
        <p className="text-sm text-muted line-clamp-2 flex-1">{p.excerpt || (p.content?.replace(/<[^>]+>/g, '') ?? '').slice(0, 120)}</p>
        {p.tags && (
          <div className="flex gap-1.5 flex-wrap mt-1">
            {p.tags.split(',').slice(0, 3).map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className="text-[11px] bg-accent/8 text-accent px-2.5 py-0.5 rounded-full font-medium">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ListingCard({ l }: { l: Listing }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-line shadow-card hover:shadow-lift hover:-translate-y-1.5 transition-all duration-300">
      <div className="relative overflow-hidden aspect-[16/10] bg-paper">
        {l.image_url ? (
          <img src={l.image_url} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center font-display font-bold text-4xl text-line">◆</div>
        )}
        {l.is_own && (
          <span className="absolute top-3 left-3 bg-gradient-cta text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            Official
          </span>
        )}
        {l.category && (
          <span className="absolute top-3 right-3 bg-paper/90 backdrop-blur text-ink text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ring-1 ring-line">
            {l.category}
          </span>
        )}
        {l.delivery_type && (
          <span className="absolute bottom-3 right-3 bg-ink/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            {l.delivery_type === 'file' ? '📁 File' : '🔗 Link'}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-bold text-lg">{l.title}</h3>
        <p className="text-sm text-muted line-clamp-2 flex-1">{l.description.slice(0, 120)}</p>
        {Number(l.price) > 0 && <p className="font-display font-bold text-xl text-accent">{formatMoney(l.price)}</p>}
        {l.is_own && Number(l.price) > 0 ? (
          <BuyNow listingId={l.id} title={l.title} priceLabel={formatMoney(l.price)} />
        ) : l.delivery_type === 'link' && l.link ? (
          <a
            href={l.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-accent hover:text-accent-2 transition-colors"
          >
            Get it here →
          </a>
        ) : !l.is_own && l.owner_contact ? (
          <a
            href={/@/.test(l.owner_contact) ? `mailto:${l.owner_contact}` : `https://wa.me/${l.owner_contact.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-accent hover:text-accent-2 transition-colors"
          >
            Contact seller →
          </a>
        ) : (
          <a
            href="/contact"
            className="text-sm font-semibold text-accent hover:text-accent-2 transition-colors"
          >
            Ask about it →
          </a>
        )}
      </div>
    </div>
  );
}

