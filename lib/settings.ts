import pool from './db';
import type { Settings } from './types';

const DEFAULTS: Record<string, string> = {
  site_name: 'ALITE',
  tagline: 'Full-Stack System Architect · Web Designer · Student Leader · Data Analyst · Project Manager',
  hero_name: 'Atilola Israel Ayomide',
  hero_title: 'Full-Stack System Architect',
  hero_bio: '',
  hero_photo: '/img/me.jpg',
  about_bio: '',
  social_twitter: '',
  social_github: '',
  social_linkedin: '',
  social_instagram: '',
  contact_email: '',
  contact_whatsapp: '',
  telegram_chat_id: '',
  og_image: '/img/logo.png',
  marketplace_listing_fee: '5000',
  telegram_daily_report: 'false',
  telegram_weekly_digest: 'false',
  telegram_expiring_ads: 'false'
};

let cache: Record<string, string> | null = null;
let cacheAt = 0;
const TTL = 30 * 1000;

export async function getSettings(force = false): Promise<Settings> {
  if (force || !cache || Date.now() - cacheAt > TTL) {
    const { rows } = await pool.query('SELECT key, value FROM settings');
    cache = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    cacheAt = Date.now();
  }
  const merged = { ...DEFAULTS, ...cache };
  return merged as unknown as Settings;
}

export async function setSetting(key: string, value: string) {
  await pool.query(
    'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
    [key, value ?? '']
  );
  if (cache) cache[key] = value ?? '';
}

export async function getSetting(key: string): Promise<string> {
  const s = await getSettings();
  return (s as unknown as Record<string, string>)[key] ?? '';
}
