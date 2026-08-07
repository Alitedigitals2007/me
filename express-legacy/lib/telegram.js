async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const { loadSettings } = require('./settings');
  if (!token) return { ok: false, reason: 'no token' };
  try {
    const settings = await loadSettings();
    const chatId = settings.telegram_chat_id;
    if (!chatId) return { ok: false, reason: 'no chat id' };
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });
    const data = await res.json();
    return data.ok ? { ok: true } : { ok: false, reason: data.description };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

module.exports = { sendTelegram };
