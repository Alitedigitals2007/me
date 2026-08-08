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

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
