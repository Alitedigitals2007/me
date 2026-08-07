/* Telegram webhook setup.
   Usage:
     node scripts/telegram-setup.cjs set <public-url>   (e.g. https://your-site.vercel.app/api/telegram/webhook)
     node scripts/telegram-setup.cjs delete
     node scripts/telegram-setup.cjs info
*/
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
const cmd = process.argv[2];
const arg = process.argv[3];

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN not found in .env');
  process.exit(1);
}
if (!cmd || !['set', 'delete', 'info'].includes(cmd)) {
  console.error('Usage: node scripts/telegram-setup.cjs (set <url> | delete | info)');
  process.exit(1);
}

(async () => {
  const base = `https://api.telegram.org/bot${token}`;
  if (cmd === 'set') {
    if (!arg) { console.error('Missing webhook URL'); process.exit(1); }
    const body = { url: arg };
    if (secret) body.secret_token = secret;
    const res = await (await fetch(`${base}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })).json();
    console.log('setWebhook ->', JSON.stringify(res));
  } else if (cmd === 'delete') {
    const res = await (await fetch(`${base}/deleteWebhook`, { method: 'POST' })).json();
    console.log('deleteWebhook ->', JSON.stringify(res));
  } else {
    const res = await (await fetch(`${base}/getWebhookInfo`)).json();
    console.log('getWebhookInfo ->', JSON.stringify(res, null, 2));
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
