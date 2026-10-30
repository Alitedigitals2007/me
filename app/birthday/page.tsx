'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

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

const PLACEHOLDER_PHOTO = (i: number) =>
  `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="280" viewBox="0 0 300 280" fill="%2314122a"><rect width="300" height="280" fill="%2314122a"/><text x="150" y="140" text-anchor="middle" fill="%239b95c4" font-family="monospace" font-size="14">Photo ${String(i).padStart(2, '0')}</text></svg>`;

// Confetti canvas
function useConfetti(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles: any[] = [];
    const colors = ['#ffc247', '#ff4f9a', '#35e0c4', '#7d5fff', '#f4f0ff'];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const burst = (x: number, y: number) => {
      for (let i = 0; i < 100; i++) {
        particles.push({ x, y, vx: (Math.random()-.5)*6, vy: (Math.random()-.5)*6-3,
          w: 8+Math.random()*6, h: 8+Math.random()*6, rot: Math.random()*Math.PI*2,
          vrot: (Math.random()-.5)*.2, color: colors[Math.floor(Math.random()*colors.length)],
          life: 1, gravity: .15+Math.random()*.1 });
      }
    };
    let id: number;
    const loop = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach((p,i) => {
        p.vy += p.gravity; p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.life -= .005;
        if (p.life <= 0) particles.splice(i,1);
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
      });
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) id = requestAnimationFrame(loop);
    };
    loop();
    (canvas as any)._burst = burst;
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(id); };
  }, [ref]);
}

// Aurora
function useAurora(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let ribbons: any[] = [];
    const initRibbons = () => {
      ribbons = [];
      const colors = ['#35e0c4', '#ff4f9a', '#ffc247', '#7d5fff', '#f4f0ff'];
      for (let i = 0; i < 5; i++) {
        ribbons.push({ y: canvas.height*(i+1)/6, amp: 60+Math.random()*40,
          speed: .3+Math.random()*.2, offset: Math.random()*100, color: colors[i], widths: [2,1.5,1] });
      }
    };
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initRibbons(); };
    resize(); window.addEventListener('resize', resize);
    let id: number;
    const loop = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ribbons.forEach(r => {
        r.offset += r.speed*.02;
        ctx.globalCompositeOperation = 'lighter';
        r.widths.forEach((w: number) => {
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 2) {
            const y = r.y + Math.sin(x*.01+r.offset)*r.amp;
            if (x === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          }
          ctx.strokeStyle = r.color; ctx.lineWidth = w;
          ctx.shadowBlur = 20; ctx.shadowColor = r.color; ctx.stroke();
        });
      });
      const t = Date.now()*.0005;
      const radius = 80 + Math.sin(t)*15;
      const grd = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, radius);
      grd.addColorStop(0, 'rgba(255,194,71,0.4)');
      grd.addColorStop(1, 'rgba(125,95,255,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2, radius, 0, Math.PI*2); ctx.fill();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) id = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(id); };
  }, [ref]);
}

export default function BirthdayPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [days, setDays] = useState<number>(0);
  const [showCountdown, setShowCountdown] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const [tagline, setTagline] = useState('');
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const auroraRef = useRef<HTMLCanvasElement>(null);

  // Fetch from API
  useEffect(() => {
    fetch('/api/birthday')
      .then(r => r.json())
      .then(d => { setSettings(d.settings); setPhotos(d.photos || []); })
      .catch(console.error);
  }, []);

  // Countdown
  useEffect(() => {
    if (!settings) return;
    const bday = new Date(settings.birthday_date);
    const now = new Date();
    const d = Math.max(0, Math.ceil((bday.getTime() - now.getTime()) / 86400000));
    if (d <= 0) { setShowCountdown(false); setTimeout(() => setShowGreeting(true), 300); }
    else { setShowCountdown(true); setShowGreeting(false); setDays(d); }
  }, [settings]);

  useConfetti(confettiRef);
  useAurora(auroraRef);

  useEffect(() => {
    if (showGreeting && confettiRef.current) {
      const burst = (confettiRef.current as any)._burst;
      if (burst) {
        burst(window.innerWidth/2, window.innerHeight/2);
        const int = setInterval(() => {
          if (Math.random() > .3) burst(Math.random()*window.innerWidth, Math.random()*window.innerHeight);
        }, 5000);
        return () => clearInterval(int);
      }
    }
  }, [showGreeting]);

  // Tagline sequence
  useEffect(() => {
    if (!showGreeting) return;
    const msgs = ['Another year of building.', 'Quiet work. Loud results.', settings?.subtitle || 'Atilola Israel Ayomide · 30 Oct 2026'];
    let i = 0;
    const int = setInterval(() => {
      setTagline(msgs[i]); i++;
      if (i >= msgs.length) {
        clearInterval(int);
        setTimeout(() => { const c = document.getElementById('scroll-cue'); if(c) c.style.opacity='1'; }, 500);
      }
    }, 1500);
    return () => clearInterval(int);
  }, [showGreeting, settings]);

  // Forms
  const [wishName, setWishName] = useState('');
  const [wishText, setWishText] = useState('');
  const [giftName, setGiftName] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [giftNote, setGiftNote] = useState('');
  const [giftType, setGiftType] = useState('');
  const [giftChipActive, setGiftChipActive] = useState('');

  const handleWishChip = (text: string) => { setWishText(text); };
  
  const canSendWish = !!(wishName.trim() && wishText.trim());
  const handleWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendWish) return;
    const msg = `Happy birthday, Alite! ${wishText} - ${wishName}`;
    window.open(`https://wa.me/2349154681851?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const handleGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftType) return;
    let msg = `Hi Alite, this is ${giftName || 'NAME'}. Happy birthday! I would like to send you a gift: ${giftType}`;
    if (giftAmount) msg += ` (₦${giftAmount})`;
    if (giftNote) msg += `. ${giftNote}`;
    msg += '. Please share where I should send it.';
    window.open(`https://wa.me/2349154681851?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="birthday-wrap">
      <style>{STYLE}</style>
      {/* HERO */}
      <HeroSection 
        confettiRef={confettiRef}
        auroraRef={auroraRef}
        showCountdown={showCountdown}
        days={days}
        showGreeting={showGreeting}
        tagline={tagline}
        settings={settings}
        onReplay={() => window.location.reload()}
      />
      {/* SLIDESHOW */}
      <CarouselSection photos={photos} />
      {/* GALLERY */}
      <GallerySection photos={photos} />
      {/* WISH */}
      <WishSection 
        wishName={wishName} setWishName={setWishName}
        wishText={wishText} setWishText={setWishText}
        onChip={handleWishChip}
        onSend={handleWishSubmit}
        canSend={canSendWish}
      />
      {/* GIFT */}
      <GiftSection 
        giftType={giftType} setGiftType={setGiftType}
        giftChipActive={giftChipActive} setGiftChipActive={setGiftChipActive}
        giftName={giftName} setGiftName={setGiftName}
        giftAmount={giftAmount} setGiftAmount={setGiftAmount}
        giftNote={giftNote} setGiftNote={setGiftNote}
        onPreview={updateGiftPreview}
        onSend={handleGiftSubmit}
      />
      {/* STATS */}
      <StatsSection settings={settings} />
      {/* FOOTER */}
      <FooterSection />
    </div>
  );
}

function updateWishPreview() { /* handled reactively below */ }
function updateGiftPreview() { /* handled reactively below */ }

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root {
  --ink: #0b0a13; --panel: #14122a; --line: #2a2646;
  --paper: #f4f0ff; --muted: #9b95c4; --gold: #ffc247;
  --pink: #ff4f9a; --teal: #35e0c4; --violet: #7d5fff; --radius: 5px;
}
.birthday-wrap { background: var(--ink); color: var(--paper); font-family: 'JetBrains Mono', monospace; min-height: 100vh; overflow-x: hidden; }
.b-label { text-transform: uppercase; letter-spacing: .1em; font-size: .7em; color: var(--muted); display: block; margin-bottom: .3em; }
.b-panel { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 1.2rem; }
.b-btn { background: transparent; border: 1px solid var(--line); color: var(--paper); padding: .6em 1em; border-radius: var(--radius); font-size: .9rem; cursor: pointer; transition: border-color .2s; display: inline-block; text-decoration: none; font-family: inherit; }
.b-btn:hover { border-color: var(--gold); }
.b-btn:disabled { opacity: .4; cursor: not-allowed; border-color: var(--muted); }
.b-chip { background: var(--panel); border: 1px solid var(--line); color: var(--muted); padding: .3em .6em; border-radius: var(--radius); font-size: .8rem; cursor: pointer; }
.b-chip.active { border-color: var(--gold); color: var(--gold); }
.b-gift-chip { background: var(--panel); border: 1px solid var(--line); color: var(--muted); padding: .5em 1em; border-radius: var(--radius); font-size: .85rem; cursor: pointer; }
.b-gift-chip.active { border-color: var(--gold); color: var(--gold); }
.b-input { width: 100%; padding: .6rem; background: var(--ink); border: 1px solid var(--line); border-radius: var(--radius); font-size: 16px; color: var(--paper); }
@keyframes bscroll { 0% { transform: translate(0,0) rotate(45deg); opacity: 0; } 100% { transform: translate(-4px,5px) rotate(45deg); opacity: 1; } }
.scroll-spline { display: inline-block; width: 14px; height: 14px; border-right: 1px solid var(--muted); border-bottom: 1px solid var(--muted); animation: bscroll 1.5s infinite; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

// Hero Section
function HeroSection({ confettiRef, auroraRef, showCountdown, days, showGreeting, tagline, settings, onReplay }: {
   confettiRef: React.RefObject<HTMLCanvasElement | null>;
   auroraRef: React.RefObject<HTMLCanvasElement | null>;
  showCountdown: boolean;
  days: number;
  showGreeting: boolean;
  tagline: string;
  settings: Settings | null;
  onReplay: () => void;
}) {
  return (
    <section style={{
      minHeight: '84vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
      position: 'relative', borderBottom: '1px solid var(--line)'
    }}>
      <canvas ref={confettiRef} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:5}} />
      <canvas ref={auroraRef} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:1}} />
      
      {showCountdown && (
        <div style={{zIndex:10, textAlign:'center'}}>
          <div style={{opacity:1, transition:'opacity .5s'}}>
            <div style={{
              fontFamily: "'Bricolage Grotesque', sans-serif", fontSize:'6vw',
              fontWeight:800, color:'var(--gold)',
              textShadow:'0 0 30px rgba(255,194,71,.5)', lineHeight:1
            }}>{String(days).padStart(2, '0')}</div>
            <div className="b-label" style={{marginTop:'.5rem'}}>T MINUS · 30 OCT 2026</div>
          </div>
        </div>
      )}

      {!showCountdown && showGreeting && (
        <div style={{zIndex:10, textAlign:'center', marginTop:'2rem'}}>
          <div className="b-label">IT'S YOUR DAY</div>
          <h1 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif", fontSize:'4vw',
            fontWeight:800, lineHeight:1.2, margin:'.5rem 0'
          }}>Happy birthday, Alite</h1>
          <div style={{color:'var(--muted)', fontSize:'1.2vw', minHeight:'1.2em'}}>
            {tagline || settings?.subtitle || 'Atilola Israel Ayomide · 30 Oct 2026'}
          </div>
        </div>
      )}
      <button className="b-btn" style={{position:'fixed',top:'1rem',right:'1rem',zIndex:50}} onClick={onReplay}>REPLAY</button>
      <div id="scroll-cue" style={{
        position:'fixed', bottom:'2rem', left:'50%',
        transform:'translateX(-50%)', zIndex:50, opacity:0, transition:'opacity 1s'
      }}>
        <span style={{color:'var(--muted)',fontSize:'.8rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
          SCROLL FOR THE SLIDESHOW<span className="scroll-spline"></span>
        </span>
      </div>
    </section>
  );
}

// Carousel Section
function CarouselSection({ photos }: { photos: Photo[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const photoList = photos.length > 0 ? photos : Array.from({length: 8}, (_, i) => ({
    id: i+1, url: PLACEHOLDER_PHOTO(i+1), alt: `Photo ${String(i+1).padStart(2,'0')}`, isDrive: false
  }));
  const radius = 500;
  const count = photoList.length;
  let autoRotateInt: NodeJS.Timeout | null = null;
  useEffect(() => {
    autoRotateInt = setInterval(() => { if (!isDragging) setAngle(a => a + .002); }, 20);
    return () => { if (autoRotateInt) clearInterval(autoRotateInt); };
  }, [isDragging]);
  useEffect(() => {
    if (trackRef.current) trackRef.current.style.transform = `rotateY(${angle}rad)`;
  }, [angle]);
  return (
    <section style={{padding:'4rem 1rem',maxWidth:'1200px',margin:'0 auto',borderBottom:'1px solid var(--line)'}}>
      <div className="b-label">THE SLIDESHOW</div>
      <div style={{perspective:'1200px',width:'100%',height:'400px',marginTop:'2rem'}}>
        <div ref={trackRef} style={{position:'relative',width:'100%',height:'100%',transformStyle:'preserve-3d'}}>
          {photoList.map((photo, i) => {
            const a = (i / count) * Math.PI * 2;
            const z = Math.cos(a) * radius;
            return (
              <div key={photo.id} style={{
                position:'absolute',left:'50%',top:'50%',
                margin:'-140px 0 0 -90px',width:'180px',height:'280px',
                transform:`rotateY(${a*180/Math.PI}deg) translateZ(${z}px)`,
                backfaceVisibility:'hidden',border:'1px solid var(--line)',borderRadius:'var(--radius)',overflow:'hidden'
              }}>
                <img src={photo.url} alt={photo.alt} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:'1rem',marginTop:'2rem',flexWrap:'wrap'}}>
        <button className="b-btn" style={{minWidth:'100px'}} onClick={() => setAngle(a => a - .3)}>PREV</button>
        <button className="b-btn" style={{minWidth:'100px'}} onClick={() => setAngle(a => a + .3)}>NEXT</button>
      </div>
    </section>
  );
}

// Gallery Section
function GallerySection({ photos }: { photos: Photo[] }) {
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const photoList = photos.length > 0 ? photos : Array.from({length: 8}, (_, i) => ({
    id: i+1, url: PLACEHOLDER_PHOTO(i+1), alt: `Photo ${String(i+1).padStart(2,'0')}`, isDrive: false
  }));
  return (
    <section style={{padding:'4rem 1rem',maxWidth:'1200px',margin:'0 auto',borderBottom:'1px solid var(--line)'}}>
      <div className="b-label">THE GALLERY</div>
      <div style={{columnCount:2,columnGap:'1rem',marginTop:'2rem'}}>
        {photoList.map((photo) => (
          <div key={photo.id} style={{
            marginBottom:'1rem',display:'block',
            opacity: visible.has(photo.id) ? 1 : 0,
            transform: visible.has(photo.id) ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all .6s ease'
          }}>
            <img src={photo.url} alt={photo.alt} style={{
              width:'100%',borderRadius:'var(--radius)',border:'1px solid var(--line)'
            }} loading="lazy" onLoad={() => setVisible(v => new Set([...v, photo.id]))} />
          </div>
        ))}
      </div>
    </section>
  );
}

// Wish Section
function WishSection({ wishName, setWishName, wishText, setWishText, onChip, onSend, canSend }: {
  wishName: string; setWishName: (v: string) => void;
  wishText: string; setWishText: (v: string) => void;
  onChip: (t: string) => void; onSend: (e: React.FormEvent) => void; canSend: boolean;
}) {
  const chips = ['BIG WINS', 'THANK YOU', 'SYSTEMS THAT SCALE'];
  return (
    <section style={{padding:'4rem 1rem',maxWidth:'600px',margin:'0 auto',borderBottom:'1px solid var(--line)'}}>
      <div className="b-label">SEND A WISH</div>
      <form onSubmit={onSend} style={{marginTop:'2rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
        <div><div className="b-label">YOUR NAME</div>
          <input type="text" className="b-input" placeholder="Enter your name" value={wishName} onChange={e=>setWishName(e.target.value)} required />
        </div>
        <div><div className="b-label">YOUR WISH</div>
          <textarea rows={3} className="b-input" placeholder="Your birthday message..." value={wishText} onChange={e=>setWishText(e.target.value)} required />
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'.5rem'}}>
          {chips.map(c => (<button key={c} type="button" className="b-chip" onClick={() => onChip(c)}>{c}</button>))}
        </div>
        <div className="b-panel">
          <div className="b-label">WHAT ALITE WILL RECEIVE</div>
          <div style={{fontSize:'.95rem'}}>
            <strong>Happy birthday, Alite!</strong><br/>
            <span style={{color:'var(--muted)'}}>{wishText || 'Your wish will appear here'}</span><br/>
            <span style={{color:'var(--muted)'}}>— {wishName || 'name'}</span>
          </div>
        </div>
        <button type="submit" className="b-btn" disabled={!canSend}>SEND ON WHATSAPP</button>
      </form>
    </section>
  );
}

// Gift Section
function GiftSection({ giftType, setGiftType, giftName, setGiftName, giftAmount, setGiftAmount, giftNote, setGiftNote, giftChipActive, setGiftChipActive, onPreview, onSend }: {
  giftType: string; setGiftType: (v: string) => void;
  giftName: string; setGiftName: (v: string) => void;
  giftAmount: string; setGiftAmount: (v: string) => void;
  giftNote: string; setGiftNote: (v: string) => void;
  giftChipActive: string; setGiftChipActive: (v: string) => void;
  onPreview: () => void; onSend: (e: React.FormEvent) => void;
}) {
  const chips = [
    { label: 'AIRTIME/DATA', value: 'Airtime or data' },
    { label: 'CASH GIFT', value: 'Cash gift' },
    { label: 'FOOD/TREATS', value: 'Food or drinks treat' },
    { label: 'SURPRISE ITEM', value: 'Surprise item' }
  ];
  useEffect(() => { onPreview(); }, [giftType, giftName, giftAmount, giftNote]);
  const previewText = !giftType ? 'Select a gift type to preview' : (() => {
    let msg = `Hi Alite, this is ${giftName || 'NAME'}. Happy birthday! I would like to send you a gift: ${giftType}`;
    if (giftAmount) msg += ` (₦${giftAmount})`;
    if (giftNote) msg += `. ${giftNote}`;
    msg += '. Please share where I should send it.';
    return msg;
  })();
  return (
    <section style={{padding:'4rem 1rem',maxWidth:'600px',margin:'0 auto',borderBottom:'1px solid var(--line)'}}>
      <div className="b-label">SEND A GIFT</div>
      <form onSubmit={onSend} style={{marginTop:'2rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:'.5rem'}}>
          {chips.map(c => (<button key={c.value} type="button" className="b-gift-chip"
            style={{borderColor: giftChipActive === c.value ? 'var(--gold)' : 'var(--line)'}}
            onClick={() => { setGiftType(c.value); setGiftChipActive(c.value); }}>{c.label}</button>))}
        </div>
        <div><div className="b-label">YOUR NAME</div>
          <input type="text" className="b-input" placeholder="Enter your name" value={giftName} onChange={e=>setGiftName(e.target.value)} required />
        </div>
        <div><div className="b-label">AMOUNT (₦)</div>
          <input type="number" className="b-input" placeholder="Optional amount" value={giftAmount} onChange={e=>setGiftAmount(e.target.value)} />
        </div>
        <div><div className="b-label">NOTE</div>
          <textarea rows={2} className="b-input" placeholder="Optional note" value={giftNote} onChange={e=>setGiftNote(e.target.value)} />
        </div>
        <div className="b-panel">
          <div className="b-label">PREVIEW</div>
          <div style={{fontSize:'.95rem',color:'var(--muted)'}}>{previewText}</div>
        </div>
        <button type="submit" className="b-btn">SEND GIFT REQUEST ON WHATSAPP</button>
        <p style={{color:'var(--muted)',fontSize:'.8rem',textAlign:'center'}}>
          WhatsApp: +234 915 468 1851 · No charges on this page
        </p>
      </form>
    </section>
  );
}

// Stats Section
function StatsSection({ settings }: { settings: Settings | null }) {
  const stats = [
    { value: '4+', label: 'YEARS BUILDING', color: 'var(--gold)' },
    { value: '200+', label: 'GRADESENSE USERS', color: 'var(--pink)' },
    { value: '8+', label: 'LEADERSHIP ROLES', color: 'var(--teal)' }
  ];
  return (
    <section style={{padding:'4rem 1rem',maxWidth:'800px',margin:'0 auto'}}>
      <div className="b-label">WHAT ALITE HAS DONE</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'2rem',marginTop:'2rem',justifyContent:'center'}}>
        {stats.map(s => (<div key={s.label} style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:'2.5rem',fontWeight:800,color:s.color}}>{s.value}</div>
          <div className="b-label">{s.label}</div>
        </div>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'1rem',marginTop:'3rem'}}>
        <a href="https://myalite.vercel.app/about" target="_blank" rel="noopener" className="b-btn" style={{padding:'1.5rem'}}>
          <div className="b-label">ABOUT</div>
          <div>Full biography and background</div>
        </a>
        <a href="https://myalite.vercel.app/portfolio" target="_blank" rel="noopener" className="b-btn" style={{padding:'1.5rem'}}>
          <div className="b-label">PROJECTS</div>
          <div>MarketStore, Prepium, Stadium of Elite</div>
        </a>
      </div>
    </section>
  );
}

// Footer
function FooterSection() {
  return (
    <footer style={{padding:'2rem 1rem',textAlign:'center',borderTop:'1px solid var(--line)'}}>
      <p style={{marginBottom:'.5rem'}}>
        <span style={{color:'var(--muted)'}}>Another lap done. </span>
        <span style={{color:'var(--gold)'}}>Execution over excuses.</span>
      </p>
      <p style={{color:'var(--muted)',fontSize:'.9rem'}}>ALITE_</p>
      <p style={{color:'var(--muted)',fontSize:'.85rem',marginTop:'.5rem'}}>
        Full-Stack System Architect · Ibadan, Nigeria
      </p>
    </footer>
  );
}
