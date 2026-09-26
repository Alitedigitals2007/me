import type { Metadata } from 'next';
import { Syne, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import PageTracker from '@/components/site/PageTracker';
import CinematicIntro from '@/components/site/CinematicIntro';
import MotionProvider from '@/components/site/MotionProvider';
import { getSettings } from '@/lib/settings';

const INTRO_ARM_SCRIPT = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&location.pathname.indexOf('/admin')!==0&&location.pathname.indexOf('/login')!==0&&!sessionStorage.getItem('alite:intro-seen')){sessionStorage.setItem('alite:intro-seen','1');document.documentElement.classList.add('intro-armed');setTimeout(function(){document.documentElement.classList.remove('intro-armed')},3600)}}catch(e){}`;

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap'
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap'
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
    title: {
      default: `${s.site_name} — ${s.hero_title}`,
      template: `%s — ${s.site_name}`
    },
    description: s.hero_bio || s.tagline,
    openGraph: {
      type: 'website',
      title: s.site_name,
      description: s.hero_bio || s.tagline,
      images: [s.og_image]
    },
    icons: { icon: '/img/logo.png' }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <html lang="en" className={`${syne.variable} ${spaceGrotesk.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: INTRO_ARM_SCRIPT }} />
        <MotionProvider>
          <CinematicIntro siteName={s.site_name} tagline={s.tagline} />
          <Navbar />
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
            <Footer settings={s} />
          </div>
          <PageTracker />
        </MotionProvider>
      </body>
    </html>
  );
}
