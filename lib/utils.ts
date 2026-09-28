export function slugify(text: string): string {
  return (
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled'
  );
}

/** Gallery data may be a JS array (pg text[] column) or a JSON string (TEXT column) */
export function parseGallery(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === 'string' && !!u);
  if (typeof raw === 'string') {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter((u): u is string => typeof u === 'string' && !!u);
    } catch { /* fall through */ }
  }
  return [];
}

export function formatDate(d: string | null | Date): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
         date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatMoney(n: string | number): string {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '0';
  return '₦' + num.toLocaleString();
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·'
};

function decodeEntity(code: string): string | null {
  const key = code.toLowerCase();
  if (key in ENTITIES) return ENTITIES[key];
  if (/^#x[0-9a-f]+$/.test(key)) return String.fromCodePoint(parseInt(key.slice(2), 16));
  if (/^#[0-9]+$/.test(key)) return String.fromCodePoint(parseInt(key.slice(1), 10));
  return null;
}

/**
 * Strip HTML from rich text and decode entities. Rare named entities we don't
 * know are left as-is rather than mangled.
 */
export function plainText(html: string): string {
  return String(html || '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, (m, code: string) => decodeEntity(code) ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain-text summary that never cuts mid-word. */
export function excerpt(html: string, max = 140): string {
  const text = plainText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, '')}…`;
}

/** "Next.js, Tailwind, Postgres" -> ["Next.js", "Tailwind", "Postgres"] */
export function parseTags(raw: string | null | undefined, limit = 0): string[] {
  const tags = String(raw || '')
    .split(/[,/|]/)
    .map((t) => t.trim())
    .filter(Boolean);
  return limit > 0 ? tags.slice(0, limit) : tags;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
