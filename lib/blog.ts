export function livePostCondition(alias = ''): string {
  const p = alias ? `${alias}.` : '';
  return `(${p}status='published' OR (${p}status='scheduled' AND ${p}publish_at IS NOT NULL AND ${p}publish_at <= now()))`;
}
