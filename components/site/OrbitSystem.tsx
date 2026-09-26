'use client';

type OrbitChip = { label: string; start: number; r: string; dur: number; reverse?: boolean };

const INNER: OrbitChip[] = [
  { label: 'Full-Stack Dev', start: 45, r: '31cqmin', dur: 34 },
  { label: 'WordPress', start: 135, r: '31cqmin', dur: 34 },
  { label: 'Automation', start: 225, r: '31cqmin', dur: 34 },
  { label: 'Data Analysis', start: 315, r: '31cqmin', dur: 34 }
];

const OUTER: OrbitChip[] = [
  { label: 'Excel & VBA', start: 15, r: '37cqmin', dur: 52, reverse: true },
  { label: 'Bot Architecture', start: 75, r: '37cqmin', dur: 52, reverse: true },
  { label: 'SEO & Growth', start: 135, r: '37cqmin', dur: 52, reverse: true },
  { label: 'Shopify', start: 195, r: '37cqmin', dur: 52, reverse: true },
  { label: 'Leadership', start: 255, r: '37cqmin', dur: 52, reverse: true },
  { label: 'Digital Strategy', start: 315, r: '37cqmin', dur: 52, reverse: true }
];

function Chip({ label, start, r, dur, reverse }: OrbitChip) {
  return (
    <span
      className="absolute left-1/2 top-1/2"
      style={
        {
          '--start': `${start}deg`,
          '--r': r,
          transformOrigin: '0 0',
          animation: `orbit-item ${dur}s linear infinite${reverse ? ' reverse' : ''}`
        } as React.CSSProperties
      }
    >
      <span className="block translate-x-[-50%] translate-y-[-50%] whitespace-nowrap rounded-full bg-card ring-1 ring-line shadow-card px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-semibold text-ink-soft">
        {label}
      </span>
    </span>
  );
}

export default function OrbitSystem({ photo, name }: { photo: string; name: string }) {
  const ringText = `${name} • SYSTEMS • AUTOMATION • DESIGN •`;

  return (
    <div
      className="relative mx-auto w-full max-w-[440px] aspect-square"
      style={{ containerType: 'size' }}
    >
      {/* ring circles */}
      <div className="absolute inset-[19%] rounded-full ring-1 ring-line" />
      <div className="absolute inset-[13%] rounded-full border border-dashed border-line" />
      <div className="absolute inset-[5%] rounded-full ring-1 ring-accent/10" />

      {/* center: portrait + rotating name ring */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] aspect-square">
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl" />
        <img
          src={photo}
          alt={name}
          className="relative w-full h-full rounded-full object-cover ring-2 ring-accent/40 shadow-lift"
        />
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[10%] w-[120%] h-[120%] font-display"
          style={{ animation: 'orbit-spin 70s linear infinite' }}
        >
          <defs>
            <path id="orbit-name-path" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" fill="none" />
          </defs>
          <text
            fill="currentColor"
            className="text-ink/60"
            fontSize="7"
            fontWeight="700"
            textLength={251}
            lengthAdjust="spacing"
          >
            <textPath href="#orbit-name-path">{ringText}</textPath>
          </text>
        </svg>
      </div>

      {/* orbiting skill chips */}
      {INNER.map((c) => (
        <Chip key={c.label} {...c} />
      ))}
      {OUTER.map((c) => (
        <Chip key={c.label} {...c} />
      ))}
    </div>
  );
}
