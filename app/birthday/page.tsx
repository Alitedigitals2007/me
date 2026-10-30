'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

type Photo = {
  id: number;
  url: string;
  alt: string;
  isDrive: boolean;
};

type Settings = {
  birthday_date: string;
  title: string;
  subtitle: string;
  google_drive_folder: string;
  use_drive_photos: boolean;
};

// ---------- Color palette ----------
const COLORS = {
  ink: '#0b0a13',
  panel: '#14122a',
  line: '#2a2646',
  paper: '#f4f0ff',
  muted: '#9b95c4',
  gold: '#ffc247',
  pink: '#ff4f9a',
  teal: '#35e0c4',
  violet: '#7d5fff',
  radius: '5px',
};

// ---------- Fonts ----------
import 'next/font/google';

const bricolage = {
  family: `"Bricolage Grotesque", sans-serif`,
};
const jetbrains = {
  family: `"JetBrains Mono", monospace`,
};

// ---------- Canvas effects ----------
function useConfetti(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles: any[] = [];
    const colors = [COLORS.gold, COLORS.pink, COLORS.teal, COLORS.violet, COLORS.paper];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const burst = (x: number, y: number) => {
      for (let i = 0; i < 100; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 3,
          w: 8 + Math.random() * 6,
          h: 8 + Math.random() * 6,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          gravity: 0.15 + Math.random() * 0.1,
        });
      }
    };
    let id: number;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life -= 0.005;
        if (p.life <= 0) particles.splice(i, 1);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) id = requestAnimationFrame(loop);
    };
    loop();
    (canvas as any)._burst = burst;
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(id); };
  }, []);
}

function useAurora(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let ribbons: any[] = [];
    const colors = [COLORS.teal, COLORS.pink, COLORS.gold, COLORS.violet, COLORS.paper];
    const initRibbons = () => {
      ribbons = [];
      for (let i = 0; i < 5; i++) {
        ribbons.push({
          y: canvas.height * (i + 1) / 6,
          amp: 60 + Math.random() * 40,
          speed: 0.3 + Math.random() * 0.2,
          offset: Math.random() * 100,
          color: colors[i],
          widths: [2, 1.5, 1],
        });
      }
    };
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initRibbons(); };
    resize(); window.addEventListener('resize', resize);
    let id: number;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ribbons.forEach(r => {
        r.offset += r.speed * 0.02;
        ctx.globalCompositeOperation = 'lighter';
        r.widths.forEach((w: number) => {
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 2) {
            const y = r.y + Math.sin(x * 0.01 + r.offset) * r.amp;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = r.color;
          ctx.lineWidth = w;
          ctx.shadowBlur = 20;
          ctx.shadowColor = r.color;
          ctx.stroke();
        });
      });
      const t = Date.now() * 0.0005;
      const radius = 80 + Math.sin(t) * 15;
      const grd = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, radius);
      grd.addColorStop(0, 'rgba(255,194,71,0.4)');
      grd.addColorStop(1, 'rgba(125,95,255,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) id = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(id); };
  }, []);
}

// ---------- Global styles ----------
const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
html, body, #__next {
  margin: 0; padding: 0; box-sizing: border-box;
}
body {
  background: ${COLORS.ink};
  color: ${COLORS.paper};
  font-family: ${jetbrains.family};
  min-height: 100vh;
  overflow-x: hidden;
  line-height: 1.5;
}
* {
  scrollbar-width: thin;
  scrollbar-color: ${COLORS.line} ${COLORS.ink};
}
a { color: ${COLORS.gold}; text-decoration: none; }
a:hover { color: ${COLORS.pink}; }
button, input, textarea, select {
  font-family: ${jetbrains.family};
  font-size: 16px;
}
label { font-family: ${jetbrains.family}; }
`;

const BASE_STYLE = `
.b-label {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.7em;
  color: ${COLORS.muted};
  display: block;
  margin-bottom: 0.3em;
}
.b-panel {
  background: ${COLORS.panel};
  border: 1px solid ${COLORS.line};
  border-radius: ${COLORS.radius};
  padding: 1.2rem;
}
.b-btn {
  background: transparent;
  border: 1px solid ${COLORS.line};
  color: ${COLORS.paper};
  padding: 0.6em 1em;
  border-radius: ${COLORS.radius};
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s;
  display: inline-block;
  text-decoration: none;
  font-family: ${jetbrains.family};
}
.b-btn:hover { border-color: ${COLORS.gold}; }
.b-btn:disabled { opacity: 0.4; cursor: not-allowed; border-color: ${COLORS.muted}; }
.b-chip {
  background: ${COLORS.panel};
  border: 1px solid ${COLORS.line};
  color: ${COLORS.muted};
  padding: 0.3em 0.6em;
  border-radius: ${COLORS.radius};
  font-size: 0.8rem;
  cursor: pointer;
}
.b-chip.active { border-color: ${COLORS.gold}; color: ${COLORS.gold}; }
.b-gift-chip {
  background: ${COLORS.panel};
  border: 1px solid ${COLORS.line};
  color: ${COLORS.muted};
  padding: 0.5em 1em;
  border-radius: ${COLORS.radius};
  font-size: 0.85rem;
  cursor: pointer;
}
.b-gift-chip.active { border-color: ${COLORS.gold}; color: ${COLORS.gold}; }
.b-input {
  width: 100%;
  padding: 0.6rem;
  background: ${COLORS.ink};
  border: 1px solid ${COLORS.line};
  border-radius: ${COLORS.radius};
  font-size: 16px;
  color: ${COLORS.paper};
}
@keyframes bscroll {
  0% { transform: translate(0, 0) rotate(45deg); opacity: 0; }
  100% { transform: translate(-4px, 5px) rotate(45deg); opacity: 1; }
}
.scroll-spline {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-right: 1px solid ${COLORS.muted};
  border-bottom: 1px solid ${COLORS.muted};
  animation: bscroll 1.5s infinite;
}
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
@media (max-width: 600px) {
  .b-btn { font-size: 0.85rem; padding: 0.5em 0.9rem; }
  .b-panel { padding: 1rem; }
}
`;

// ---------- Carousel ----------
function CarouselSection({ photos }: { photos: Photo[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const photoList = photos.length > 0 ? photos : Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, url: PLACEHOLDER_PHOTO(i + 1), alt: `Photo ${String(i + 1).padStart(2, '0')}`, isDrive: false,
  }));
  const radius = 500;
  const count = photoList.length;
  let autoRotateInt: NodeJS.Timeout | null = null;

  useEffect(() => {
    autoRotateInt = setInterval(() => { if (!isDragging) setAngle(a => a + 0.002); }, 20);
    return () => { if (autoRotateInt) clearInterval(autoRotateInt); };
  }, [isDragging]);
  useEffect(() => {
    if (trackRef.current) trackRef.current.style.transform = `rotateY(${angle}rad)`;
  }, [angle]);

  return (
    <section style={{ padding: '4rem 1rem', maxWidth: '1200px', margin: '0 auto', borderBottom: `1px solid ${COLORS.line}` }}>
      <div className="b-label">THE SLIDESHOW</div>
      <div style={{ perspective: '1200px', width: '100%', height: '400px', marginTop: '2rem' }}>
        <div ref={trackRef} style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
          {photoList.map((photo, i) => {
            const a = (i / count) * Math.PI * 2;
            const z = Math.cos(a) * radius;
            return (
              <div key={photo.id} style={{
                position: 'absolute', left: '50%', top: '50%',
                margin: '-140px 0 0 -90px', width: '180px', height: '280px',
                transform: `rotateY(${a * 180 / Math.PI}deg) translateZ(${z}px)`,
                backfaceVisibility: 'hidden', border: `1px solid ${COLORS.line}`, borderRadius: COLORS.radius, overflow: 'hidden',
              }}>
                <Image src={photo.url} alt={photo.alt} width={180} height={280} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized={photo.url.startsWith('data:')} />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <button className="b-btn" style={{ minWidth: '100px' }} onClick={() => setAngle(a => a - 0.3)}>PREV</button>
        <button className="b-btn" style={{ minWidth: '100px' }} onClick={() => setAngle(a => a + 0.3)}>NEXT</button>
      </div>
    </section>
  );
}

// ---------- Gallery ----------
function GallerySection({ photos }: { photos: Photo[] }) {
  const photoList = photos.length > 0 ? photos : Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, url: PLACEHOLDER_PHOTO(i + 1), alt: `Photo ${String(i + 1).padStart(2, '0')}`, isDrive: false,
  }));
  return (
    <section style={{ padding: '4rem 1rem', maxWidth: '1200px', margin: '0 auto', borderBottom: `1px solid ${COLORS.line}` }}>
      <div className="b-label">THE GALLERY</div>
      <div style={{ columnCount: 2, columnGap: '1rem', marginTop: '2rem' }}>
        {photoList.map((photo) => (
          <div key={photo.id} style={{ marginBottom: '1rem', display: 'block' }}>
            <Image src={photo.url} alt={photo.alt} style={{ width: '100%', borderRadius: COLORS.radius, border: `1px solid ${COLORS.line}` }} unoptimized={photo.url.startsWith('data:')} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Wish ----------
function WishSection({ wishName, setWishName, wishText, setWishText }: {
  wishName: string; setWishName: (v: string) => void;
  wishText: string; setWishText: (v: string) => void;
}) {
  const chips = ['BIG WINS', 'THANK YOU', 'SYSTEMS THAT SCALE'];
  const canSend = !!(wishName.trim() && wishText.trim());
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const msg = `Happy birthday, Alite! ${wishText} - ${wishName}`;
    window.open(`https://wa.me/2349154681851?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };
  return (
    <section style={{ padding: '4rem 1rem', maxWidth: '600px', margin: '0 auto', borderBottom: `1px solid ${COLORS.line}` }}>
      <div className="b-label">SEND A WISH</div>
      <form onSubmit={handleSubmit} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div className="b-label">YOUR NAME</div>
          <input type="text" className="b-input" placeholder="Enter your name" value={wishName} onChange={e => setWishName(e.target.value)} required />
        </div>
        <div>
          <div className="b-label">YOUR WISH</div>
          <textarea rows={3} className="b-input" placeholder="Your birthday message..." value={wishText} onChange={e => setWishText(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {chips.map(c => (
            <button key={c} type="button" className="b-chip" onClick={() => setWishText(c)}>{c}</button>
          ))}
        </div>
        <div className="b-panel">
          <div className="b-label">WHAT ALITE WILL RECEIVE</div>
          <div style={{ fontSize: '0.95rem' }}>
            <strong style={{ color: COLORS.gold }}>Happy birthday, Alite!</strong><br />
            <span style={{ color: COLORS.muted }}>{wishText || 'Your wish will appear here'}</span><br />
            <span style={{ color: COLORS.muted }}>— {wishName || 'name'}</span>
          </div>
        </div>
        <button type="submit" className="b-btn" disabled={!canSend}>SEND ON WHATSAPP</button>
      </form>
    </section>
  );
}

// ---------- Gift ----------
function GiftSection({ giftType, setGiftType, giftName, setGiftName, giftAmount, setGiftAmount, giftNote, setGiftNote }: {
  giftType: string; setGiftType: (v: string) => void;
  giftName: string; setGiftName: (v: string) => void;
  giftAmount: string; setGiftAmount: (v: string) => void;
  giftNote: string; setGiftNote: (v: string) => void;
}) {
  const chips = [
    { label: 'AIRTIME/DATA', value: 'Airtime or data' },
    { label: 'CASH GIFT', value: 'Cash gift' },
    { label: 'FOOD/TREATS', value: 'Food or drinks treat' },
    { label: 'SURPRISE ITEM', value: 'Surprise item' },
  ];
  return (
    <section style={{ padding: '4rem 1rem', maxWidth: '600px', margin: '0 auto', borderBottom: `1px solid ${COLORS.line}` }}>
      <div className="b-label">SEND A GIFT</div>
      <form style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={(e) => {
        e.preventDefault();
        if (!giftType || !giftName.trim()) return;
        let msg = `Hi Alite, this is ${giftName}. Happy birthday! I would like to send you a gift: ${giftType}`;
        if (giftAmount) msg += ` (₦${giftAmount})`;
        if (giftNote) msg += `. ${giftNote}`;
        msg += '. Please share where I should send it.';
        window.open(`https://wa.me/2349154681851?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {chips.map(c => (
            <button key={c.value} type="button" className="b-gift-chip"
              style={{ borderColor: giftType === c.value ? COLORS.gold : COLORS.line }}
              onClick={() => { setGiftType(c.value); }}
            >{c.label}</button>
          ))}
        </div>
        <div>
          <div className="b-label">YOUR NAME</div>
          <input type="text" className="b-input" placeholder="Enter your name" value={giftName} onChange={e => setGiftName(e.target.value)} required />
        </div>
        <div>
          <div className="b-label">AMOUNT (₦)</div>
          <input type="number" className="b-input" placeholder="Optional amount" value={giftAmount} onChange={e => setGiftAmount(e.target.value)} />
        </div>
        <div>
          <div className="b-label">NOTE</div>
          <textarea rows={2} className="b-input" placeholder="Optional note" value={giftNote} onChange={e => setGiftNote(e.target.value)} />
        </div>
        <div className="b-panel">
          <div className="b-label">PREVIEW</div>
          <div style={{ fontSize: '0.95rem', color: COLORS.muted }}>
            {!giftType ? 'Select a gift type to preview' : (() => {
              let m = `Hi Alite, this is ${giftName || 'NAME'}. Happy birthday! I would like to send you a gift: ${giftType}`;
              if (giftAmount) m += ` (₦${giftAmount})`;
              if (giftNote) m += `. ${giftNote}`;
              m += '. Please share where I should send it.';
              return m;
            })()}
          </div>
        </div>
        <button type="submit" className="b-btn">SEND GIFT REQUEST ON WHATSAPP</button>
        <p style={{ color: COLORS.muted, fontSize: '0.8rem', textAlign: 'center' }}>
          WhatsApp: +234 915 468 1851 · No charges on this page
        </p>
      </form>
    </section>
  );
}

// ---------- Stats ----------
function StatsSection() {
  const stats = [
    { value: '4+', label: 'YEARS BUILDING', color: COLORS.gold },
    { value: '200+', label: 'GRADESENSE USERS', color: COLORS.pink },
    { value: '8+', label: 'LEADERSHIP ROLES', color: COLORS.teal },
  ];
  return (
    <section style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="b-label">WHAT ALITE HAS DONE</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '2rem', justifyContent: 'center' }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: bricolage.family, fontSize: '2.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div className="b-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '3rem' }}>
        <a href="https://myalite.vercel.app/about" target="_blank" rel="noopener" className="b-btn" style={{ padding: '1.5rem', display: 'block', textAlign: 'center' }}>
          <div className="b-label">ABOUT</div>
          <div>Full biography and background</div>
        </a>
        <a href="https://myalite.vercel.app/portfolio" target="_blank" rel="noopener" className="b-btn" style={{ padding: '1.5rem', display: 'block', textAlign: 'center' }}>
          <div className="b-label">PROJECTS</div>
          <div>MarketStore, Prepium, Stadium of Elite</div>
        </a>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function FooterSection() {
  return (
    <footer style={{ padding: '2rem 1rem', textAlign: 'center', borderTop: `1px solid ${COLORS.line}` }}>
      <p style={{ marginBottom: '0.5rem' }}>
        <span style={{ color: COLORS.muted }}>Another lap done. </span>
        <span style={{ color: COLORS.gold }}>Execution over excuses.</span>
      </p>
      <p style={{ color: COLORS.muted, fontSize: '0.9rem' }}>ALITE_</p>
      <p style={{ color: COLORS.muted, fontSize: '0.85rem', marginTop: '0.5rem' }}>
        Full-Stack System Architect · Ibadan, Nigeria
      </p>
    </footer>
  );
}

// ---------- Placeholder ----------
function PLACEHOLDER_PHOTO(i: number) {
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="280" viewBox="0 0 300 280" fill="%2314122a"><rect width="300" height="280" fill="%2314122a"/><text x="150" y="140" text-anchor="middle" fill="%239b95c4" font-family="monospace" font-size="14">Photo ${String(i).padStart(2, '0')}</text></svg>`;
}

// ---------- Main page ----------
export default function BirthdayPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [days, setDays] = useState<number>(0);
  const [showCountdown, setShowCountdown] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const [tagline, setTagline] = useState('');
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const auroraRef = useRef<HTMLCanvasElement>(null);
  const [wishName, setWishName] = useState('');
  const [wishText, setWishText] = useState('');
  const [giftType, setGiftType] = useState('');
  const [giftName, setGiftName] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [giftNote, setGiftNote] = useState('');

  useEffect(() => {
    fetch('/api/birthday')
      .then(r => r.json())
      .then(d => { setSettings(d.settings); setPhotos(d.photos || []); })
      .catch(() => setPhotos([]));
  }, []);

  useEffect(() => {
    if (!settings) return;
    const bday = new Date(settings.birthday_date);
    const now = new Date();
    const d = Math.max(0, Math.ceil((bday.getTime() - now.getTime()) / 86400000));
    if (d <= 0) { setShowCountdown(false); setShowGreeting(true); }
    else { setShowCountdown(true); setShowGreeting(false); }
    setDays(d);
  }, [settings]);

  useConfetti(confettiRef);
  useAurora(auroraRef);

  useEffect(() => {
    if (showGreeting && confettiRef.current) {
      const burst = (confettiRef.current as any)._burst;
      if (burst) {
        burst(window.innerWidth / 2, window.innerHeight / 2);
        const int = setInterval(() => {
          if (Math.random() > 0.3) burst(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
        }, 5000);
        return () => clearInterval(int);
      }
    }
  }, [showGreeting]);

  useEffect(() => {
    if (!showGreeting) return;
    const msgs = ['Another year of building.', 'Quiet work. Loud results.', settings?.subtitle || 'Atilola Israel Ayomide · 30 Oct 2026'];
    let i = 0;
    const int = setInterval(() => {
      setTagline(msgs[i]);
      i++;
      if (i >= msgs.length) clearInterval(int);
    }, 1500);
    return () => clearInterval(int);
  }, [showGreeting, settings]);

  const photoList = photos.length > 0 ? photos : Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, url: PLACEHOLDER_PHOTO(i + 1), alt: `Photo ${String(i + 1).padStart(2, '0')}`, isDrive: false,
  }));

  return (
    <div className="birthday-wrap">
      <style>{GLOBAL_STYLE}</style>
      <style>{BASE_STYLE}</style>

      {/* HERO */}
      <section style={{
        minHeight: '84vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
        position: 'relative', borderBottom: `1px solid ${COLORS.line}`,
      }}>
        <canvas ref={confettiRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }} />
        <canvas ref={auroraRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

        {showCountdown && (
          <div style={{ zIndex: 10, textAlign: 'center', marginTop: '2rem' }}>
            <div style={{ opacity: 1, transition: 'opacity .5s' }}>
              <div style={{
                fontFamily: bricolage.family, fontSize: '6vw', fontWeight: 800,
                color: COLORS.gold, textShadow: `0 0 30px rgba(255,194,71,.5)`, lineHeight: 1,
              }}>{String(days).padStart(2, '0')}</div>
              <div style={{ marginTop: '.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7em', color: COLORS.muted }}>
                T MINUS · 30 OCT 2026
              </div>
            </div>
          </div>
        )}

        {!showCountdown && showGreeting && (
          <div style={{ zIndex: 10, textAlign: 'center', marginTop: '2rem' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7em', color: COLORS.muted, marginBottom: '.3em' }}>
              IT'S YOUR DAY
            </div>
            <h1 style={{ fontFamily: bricolage.family, fontSize: '4vw', fontWeight: 800, lineHeight: 1.2, margin: '.5rem 0' }}>
              Happy birthday, Alite
            </h1>
            <div style={{ color: COLORS.muted, fontSize: '1.2vw', minHeight: '1.2em' }}>
              {tagline || settings?.subtitle || 'Atilola Israel Ayomide · 30 Oct 2026'}
            </div>
          </div>
        )}

        <button style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 50,
          background: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.paper,
          padding: '.6em 1em', borderRadius: COLORS.radius, fontSize: '.9rem', cursor: 'pointer',
          fontFamily: jetbrains.family,
        }} onClick={() => window.location.reload()}>REPLAY</button>

        <div id="scroll-cue" style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, opacity: 0, transition: 'opacity 1s',
        }}>
          <span style={{ color: COLORS.muted, fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            SCROLL FOR THE SLIDESHOW <span className="scroll-spline"></span>
          </span>
        </div>
      </section>

      {/* SLIDESHOW */}
      <CarouselSection photos={photoList} />

      {/* GALLERY */}
      <GallerySection photos={photoList} />

      {/* WISH */}
      <WishSection wishName={wishName} setWishName={setWishName} wishText={wishText} setWishText={setWishText} />

      {/* GIFT */}
      <GiftSection giftType={giftType} setGiftType={setGiftType} giftName={giftName} setGiftName={setGiftName} giftAmount={giftAmount} setGiftAmount={setGiftAmount} giftNote={giftNote} setGiftNote={setGiftNote} />

      {/* STATS */}
      <StatsSection />

      {/* FOOTER */}
      <FooterSection />
    </div>
  );
}
