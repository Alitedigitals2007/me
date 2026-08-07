import pool from './db';
import { getSettings } from './settings';
import { tgSend, tgEdit, tgAnswer } from './telegram';

const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const HELP = `🤖 <b>ALITE Bot Control</b>

I manage your site from here:

/start · /help — this message
/ads — pending ad submissions (approve / reject)
/listings — pending marketplace listings
/posts — draft blog posts (publish)
/publish &lt;id&gt; — publish a draft post by id
/stats — quick site numbers

Tap the buttons under each list to act instantly.`;

async function isOwner(chatId: number | string | undefined): Promise<boolean> {
  if (!chatId) return false;
  const s = await getSettings();
  return String(chatId) === String(s.telegram_chat_id);
}

async function btnRow(action: string, id: number): Promise<any[]> {
  return [[
    { text: '✅ Approve', callback_data: `${action}:approve:${id}` },
    { text: '⛔ Reject', callback_data: `${action}:reject:${id}` }
  ]];
}

async function showAds(chatId: number, messageId?: number) {
  const { rows } = await pool.query(
    `SELECT a.id, a.advertiser_name, a.contact, a.duration_days, a.amount_paid, a.image_url,
            p.name AS package_name, s.name AS slot_name
       FROM ad_submissions a
       LEFT JOIN ad_packages p ON p.id = a.package_id
       LEFT JOIN ad_slots s ON s.id = a.slot_id
      WHERE a.status IN ('pending_payment','paid') ORDER BY a.id DESC LIMIT 10`
  );
  if (!rows.length) {
    const text = `📣 <b>Pending ads</b>\n\nNothing waiting — all clear.`;
    return messageId ? tgEdit(chatId, messageId, text) : tgSend(chatId, text);
  }
  const lines = rows.map((r, i) =>
    `${i + 1}. <b>#${r.id}</b> — ${esc(r.advertiser_name)} (${esc(r.contact)})\n   📦 ${esc(r.package_name || '—')} · ${r.duration_days}d · ₦${Number(r.amount_paid).toLocaleString()}${r.slot_name ? ` · 📍 ${esc(r.slot_name)}` : ''}`
  );
  const keyboard = { inline_keyboard: rows.flatMap((r) => btnRow('ad', r.id)) };
  if (messageId) await tgEdit(chatId, messageId, `📣 <b>Pending ads (${rows.length})</b>\n\n${lines.join('\n\n')}`, keyboard);
  else await tgSend(chatId, `📣 <b>Pending ads (${rows.length})</b>\n\n${lines.join('\n\n')}`, keyboard);
}

async function showListings(chatId: number, messageId?: number) {
  const { rows } = await pool.query(
    `SELECT id, title, category, price, owner_name FROM marketplace_listings
      WHERE status = 'pending' ORDER BY id DESC LIMIT 10`
  );
  if (!rows.length) {
    const text = `🛒 <b>Pending listings</b>\n\nNothing waiting — all clear.`;
    return messageId ? tgEdit(chatId, messageId, text) : tgSend(chatId, text);
  }
  const lines = rows.map((r, i) =>
    `${i + 1}. <b>#${r.id}</b> — ${esc(r.title)} (${esc(r.category || 'general')})\n   💰 ₦${Number(r.price).toLocaleString()} · by ${esc(r.owner_name || 'anonymous')}`
  );
  const keyboard = { inline_keyboard: rows.flatMap((r) => btnRow('listing', r.id)) };
  if (messageId) await tgEdit(chatId, messageId, `🛒 <b>Pending listings (${rows.length})</b>\n\n${lines.join('\n\n')}`, keyboard);
  else await tgSend(chatId, `🛒 <b>Pending listings (${rows.length})</b>\n\n${lines.join('\n\n')}`, keyboard);
}

async function showPosts(chatId: number, messageId?: number) {
  const { rows } = await pool.query(
    `SELECT id, title FROM blog_posts WHERE status = 'draft' ORDER BY id DESC LIMIT 10`
  );
  if (!rows.length) {
    const text = `📝 <b>Draft posts</b>\n\nNothing waiting — all published.`;
    return messageId ? tgEdit(chatId, messageId, text) : tgSend(chatId, text);
  }
  const lines = rows.map((r, i) => `${i + 1}. <b>#${r.id}</b> — ${esc(r.title)}`);
  const keyboard = { inline_keyboard: rows.map((r) => [{ text: '🚀 Publish', callback_data: `post:publish:${r.id}` }]) };
  if (messageId) await tgEdit(chatId, messageId, `📝 <b>Draft posts (${rows.length})</b>\n\n${lines.join('\n\n')}`, keyboard);
  else await tgSend(chatId, `📝 <b>Draft posts (${rows.length})</b>\n\n${lines.join('\n\n')}`, keyboard);
}

async function showStats(chatId: number) {
  const { rows } = await pool.query(`
    SELECT
      (SELECT count(*) FROM blog_posts) AS posts,
      (SELECT count(*) FROM blog_posts WHERE status = 'published') AS published,
      (SELECT count(*) FROM ad_submissions) AS ads,
      (SELECT count(*) FROM ad_submissions WHERE status = 'approved') AS ads_live,
      (SELECT count(*) FROM marketplace_listings) AS listings,
      (SELECT count(*) FROM marketplace_listings WHERE status = 'active') AS listings_live,
      (SELECT count(*) FROM contact_messages) AS contacts,
      (SELECT count(*) FROM ad_clicks) AS clicks,
      (SELECT count(*) FROM page_views) AS views
  `);
  const r = rows[0];
  await tgSend(chatId,
    `📊 <b>ALITE stats</b>\n\n` +
    `📝 Posts: <b>${r.posts}</b> (${r.published} live)\n` +
    `📣 Ads: <b>${r.ads}</b> (${r.ads_live} live)\n` +
    `🛒 Listings: <b>${r.listings}</b> (${r.listings_live} live)\n` +
    `✉️ Contact messages: <b>${r.contacts}</b>\n` +
    `👀 Page views: <b>${Number(r.views).toLocaleString()}</b>\n` +
    `🖱 Ad clicks: <b>${r.clicks}</b>`
  );
}

async function runAction(action: string, id: number): Promise<string> {
  if (action === 'ad:approve') {
    const { rows } = await pool.query(
      `UPDATE ad_submissions SET status='approved', start_date=CURRENT_DATE,
        end_date=CURRENT_DATE + (duration_days || ' days')::interval
       WHERE id=$1 AND status IN ('paid','pending_payment') RETURNING advertiser_name`,
      [id]
    );
    if (!rows.length) return `Ad #${id} — not found or already handled.`;
    return `✅ <b>Ad #${id} approved and live</b> — ${esc(rows[0].advertiser_name)}. Start: today.`;
  }
  if (action === 'ad:reject') {
    const { rows } = await pool.query(
      `UPDATE ad_submissions SET status='rejected' WHERE id=$1 AND status IN ('paid','pending_payment') RETURNING advertiser_name, paystack_ref`,
      [id]
    );
    if (!rows.length) return `Ad #${id} — not found or already handled.`;
    return `⛔ <b>Ad #${id} rejected</b> — ${esc(rows[0].advertiser_name)}${rows[0].paystack_ref ? ` (ref ${esc(rows[0].paystack_ref)}) — arrange refund` : ''}.`;
  }
  if (action === 'listing:approve') {
    const { rows } = await pool.query(
      `UPDATE marketplace_listings SET status='active' WHERE id=$1 AND status IN ('pending','rejected') RETURNING title`,
      [id]
    );
    if (!rows.length) return `Listing #${id} — not found or already handled.`;
    return `✅ <b>Listing #${id} approved</b> — ${esc(rows[0].title)} is now live.`;
  }
  if (action === 'listing:reject') {
    const { rows } = await pool.query(
      `UPDATE marketplace_listings SET status='rejected' WHERE id=$1 RETURNING title`,
      [id]
    );
    if (!rows.length) return `Listing #${id} — not found or already handled.`;
    return `⛔ <b>Listing #${id} rejected</b> — ${esc(rows[0].title)}.`;
  }
  if (action === 'post:publish') {
    const { rows } = await pool.query(
      `UPDATE blog_posts SET status='published', publish_at=COALESCE(publish_at, now()), updated_at=now()
       WHERE id=$1 AND status='draft' RETURNING title, slug`,
      [id]
    );
    if (!rows.length) return `Post #${id} — not found or already published.`;
    const base = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');
    return `🚀 <b>Post #${id} published</b> — ${esc(rows[0].title)}\n🔗 ${base}/blog/${esc(rows[0].slug)}`;
  }
  return 'Unknown action.';
}

async function handleCallback(cb: any): Promise<void> {
  const data: string = cb.data || '';
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const [kind, act, idStr] = data.split(':');
  const id = Number(idStr);
  if (!kind || !act || !id) return;
  const text = await runAction(`${kind}:${act}`, id);
  await tgEdit(chatId, messageId, text);
  await tgAnswer(cb.id, act === 'approve' ? 'Approved ✅' : 'Rejected ⛔');
}

export async function handleTelegramUpdate(update: any): Promise<void> {
  try {
    const msg = update?.message;
    const cb = update?.callback_query;
    const chatId = msg?.chat?.id ?? cb?.message?.chat?.id;
    if (!chatId) return;
    if (!(await isOwner(chatId))) return;

    if (cb) return handleCallback(cb);
    const text: string = msg?.text || '';
    const cmd = text.trim().split(/\s+/)[0]?.toLowerCase();
    switch (cmd) {
      case '/start':
      case '/help':
        await tgSend(chatId, HELP);
        break;
      case '/ads':
        await showAds(chatId);
        break;
      case '/listings':
        await showListings(chatId);
        break;
      case '/posts':
        await showPosts(chatId);
        break;
      case '/publish': {
        const id = Number(text.trim().split(/\s+/)[1]);
        if (!id) { await tgSend(chatId, 'Usage: /publish &lt;post id&gt;'); break; }
        const out = await runAction('post:publish', id);
        await tgSend(chatId, out);
        break;
      }
      case '/stats':
        await showStats(chatId);
        break;
      default:
        await tgSend(chatId, HELP);
    }
  } catch (e) {
    console.error('telegram bot handler', e);
  }
}
