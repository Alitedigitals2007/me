const { pool } = require('../config/db');

let cache = null;
let cacheAt = 0;
const TTL = 60 * 1000;

async function loadSettings(force = false) {
  if (force || !cache || Date.now() - cacheAt > TTL) {
    const { rows } = await pool.query('SELECT key, value FROM settings');
    cache = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    cacheAt = Date.now();
  }
  return cache;
}

async function setSetting(key, value) {
  await pool.query(
    'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
    [key, String(value ?? '')]
  );
  cache[key] = String(value ?? '');
}

module.exports = { loadSettings, setSetting };
