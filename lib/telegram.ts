import { getSettings } from './settings';

export const siteUrl = () => (process.env.SITE_URL || '').replace(/\/$/, '');

export async function tgApi(method: string, payload: Record<string, any>): Promise<any> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: 'TELEGRAM_BOT_TOKEN not set' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error('telegram api', method, e);
    return { ok: false };
  }
}

export async function tgSend(chatId: number | string, text: string, replyMarkup?: Record<string, any>): Promise<boolean> {
  const data = await tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  });
  return !!data.ok;
}

export async function tgEdit(chatId: number | string, messageId: number, text: string, replyMarkup?: Record<string, any>): Promise<boolean> {
  const data = await tgApi('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  });
  return !!data.ok;
}

export async function tgAnswer(callbackQueryId: string, text?: string): Promise<void> {
  await tgApi('answerCallbackQuery', { callback_query_id: callbackQueryId, ...(text ? { text, show_alert: false } : {}) });
}

export async function sendTelegram(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const settings = await getSettings();
    const chatId = settings.telegram_chat_id;
    if (!chatId) return false;
    return tgSend(chatId, message);
  } catch {
    return false;
  }
}
