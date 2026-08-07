/* Local dev polling: forward Telegram updates to the local webhook endpoint.
   Run with: npm run tg:dev */
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
  return out;
}

const env = loadEnv();
const token = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const secret = env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || env.CRON_SECRET;
const LOCAL_URL = process.env.TG_DEV_URL || 'http://localhost:3100/api/telegram/webhook';

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN not found in .env — set it first.');
  process.exit(1);
}

let offset = 0;
const seen = new Set();

async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=30&offset=${offset}`);
    const data = await res.json();
    if (!data.ok) {
      console.error('getUpdates error:', data.description);
      return;
    }
    for (const upd of data.result || []) {
      offset = upd.update_id + 1;
      if (seen.has(upd.update_id)) continue;
      seen.add(upd.update_id);
      await fetch(LOCAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-telegram-bot-api-secret-token': secret } : {}) },
        body: JSON.stringify(upd)
      }).catch(() => {});
    }
  } catch (e) {
    console.error('poll error:', e.message);
  }
}

console.log(`Telegram poll running -> ${LOCAL_URL} (bot ${token.slice(0, 8)}...)`);
(async function loop() {
  await poll();
  setTimeout(loop, 2000);
})();
