import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyWebhookSignature, verifyTransaction } from '@/lib/paystack';

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
    const ref = event.data.reference;
    const txn = await verifyTransaction(ref);
    if (txn) {
      const meta = txn.metadata || {};
      if (meta.type === 'ad') {
        await pool.query(
          `UPDATE ad_submissions SET status='paid', amount_paid=$2, paystack_ref=$3
           WHERE id=$1 AND status='pending_payment'`,
          [meta.id, txn.amount / 100, ref]
        );
      } else if (meta.type === 'listing') {
        await pool.query(
          `UPDATE marketplace_listings SET status='sold', fee_paid=true, paystack_ref=$2
           WHERE id=$1 AND status IN ('pending_payment','paid')`,
          [meta.id, ref]
        );
      }
    }
  }
  return NextResponse.json({ status: 'ok' });
}
