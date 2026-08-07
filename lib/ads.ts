import pool from './db';
import type { Ad } from './types';

export async function loadAds(): Promise<Record<string, Ad[]>> {
  const { rows } = await pool.query(
    `SELECT a.id, a.image_url, a.target_url, s.position
     FROM ad_submissions a
     JOIN ad_slots s ON s.id = a.slot_id
     WHERE a.status='approved' AND s.is_active = true AND a.start_date <= CURRENT_DATE AND a.end_date >= CURRENT_DATE`
  );
  const byPosition: Record<string, Ad[]> = {};
  for (const ad of rows) {
    if (!byPosition[ad.position]) byPosition[ad.position] = [];
    byPosition[ad.position].push(ad);
  }
  return byPosition;
}
