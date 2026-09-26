import Hero from '@/components/site/Hero';
import AdSlot from '@/components/site/AdSlot';
import Reveal from '@/components/site/Reveal';
import { BlogCard, ListingCard, ProjectCard, SectionHead } from '@/components/site/Cards';
import { getFeaturedProjects, getPublishedPosts, getActiveListings } from '@/lib/data';
import { loadAds } from '@/lib/ads';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [projects, posts, listings, ads, settings] = await Promise.all([
    getFeaturedProjects(3),
    getPublishedPosts(),
    getActiveListings(),
    loadAds(),
    getSettings()
  ]);

  return (
    <>
      <Hero settings={settings} />

      <div className="mx-auto max-w-6xl px-5">
        <AdSlot ads={ads} position="home_banner" />
      </div>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal>
          <SectionHead
            title="Featured work"
            sub="Projects designed and shipped — from full web systems to automation tools."
            link="/portfolio"
          />
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <ProjectCard p={p} />
            </Reveal>
          ))}
        </div>
        {!projects.length && (
          <p className="text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">Projects coming soon.</p>
        )}
      </section>

      {posts.length > 0 && (
        <section className="bg-card border-y border-line">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <Reveal>
              <SectionHead title="Latest writing" sub="Notes on building, leadership and shipping." link="/blog" />
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.slice(0, 3).map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08}>
                  <BlogCard p={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {listings.length > 0 && (
        <section className="bg-gradient-to-b from-accent/5 to-cyan-accent/5 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionHead title="Marketplace" sub="Products, services and curated listings." link="/marketplace" />
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.slice(0, 3).map((l, i) => (
                <Reveal key={l.id} delay={i * 0.08}>
                  <ListingCard l={l} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
