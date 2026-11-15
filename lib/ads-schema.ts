import getPool from './db';

export const ADS_DDL = `
ALTER TABLE ad_submissions ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '';
`;

let ensured = false;

async function schemaReady(): Promise<boolean> {
  try {
    await getPool().query('SELECT caption FROM ad_submissions LIMIT 0');
    return true;
  } catch {
    return false;
  }
}

export async function ensureAdsSchema(): Promise<void> {
  if (ensured) return;
  try {
    const statements = ADS_DDL.split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${s};`);
    for (const stmt of statements) {
      try {
        await getPool().query(stmt);
      } catch (e) {
        console.error('ads ddl statement failed:', (e as Error).message, '->', stmt.slice(0, 80));
      }
    }
    ensured = await schemaReady();
  } catch (e) {
    console.error('ads schema', e);
  }
}
