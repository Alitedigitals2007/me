import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, finalizePayment } from '@/lib/paystack';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature');
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ status: 'invalid signature' }, { status: 400 });
  }
  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: 'bad payload' }, { status: 400 });
  }
  if (event.event === 'charge.success' && event.data?.reference) {
    // Single shared completion path (same idempotency guards as the /thanks route)
    await finalizePayment(event.data.reference);
  }
  return NextResponse.json({ status: 'ok' });
}
