import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendTelegram, siteUrl } from '@/lib/telegram';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many messages sent. Try again later.' }, { status: 429 });
  }
  try {
    const fd = await req.formData();
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const message = String(fd.get('message') || '').trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES ($1,$2,$3)',
      [name, email, message]
    );
    sendTelegram(`✉️ New contact message from <b>${name}</b> (${email}):\n${message.slice(0, 300)}\n🔗 ${siteUrl()}/admin/messages`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('contact', e);
    return NextResponse.json({ error: 'Could not send message. Try again or reach me on WhatsApp.' }, { status: 500 });
  }
}
