import crypto from 'crypto';
import pool from './db';
import { sendTelegram, siteUrl } from './telegram';

const SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export async function initializePayment(opts: {
  email: string;
  amountKobo: number;
  reference: string;
  metadata: Record<string, unknown>;
  callbackUrl: string;
}): Promise<string> {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountKobo,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata
    })
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || 'Paystack initialization failed');
  return data.data.authorization_url as string;
}

export async function verifyTransaction(reference: string) {
  if (!SECRET) return null;
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${SECRET}` }
  });
  const data = await res.json();
  if (!data.status || data.data.status !== 'success') return null;
  return data.data;
}

export function verifyWebhookSignature(rawBody: string, signature?: string | null): boolean {
  if (!SECRET || !signature) return false;
  const hash = crypto.createHmac('sha512', SECRET).update(rawBody).digest('hex');
  return hash === signature;
}

export function makeReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function hasPaystackKeys(): boolean {
  return !!SECRET && !!process.env.PAYSTACK_PUBLIC_KEY;
}

export async function finalizePayment(reference: string): Promise<{ success: boolean; message: string; type?: string; delivery?: { type: 'file' | 'link'; file_id?: string; link?: string; title?: string } }> {
  const txn = await verifyTransaction(reference);
  if (!txn) return { success: false, message: 'Payment could not be verified.' };
  const meta = txn.metadata || {};
  const amountNaira = (txn.amount || 0) / 100;
  if (meta.type === 'ad') {
    const { rowCount, rows } = await pool.query(
      `UPDATE ad_submissions SET status='paid', amount_paid=$2, paystack_ref=$3
       WHERE id=$1 AND status='pending_payment' RETURNING id, advertiser_name`,
      [meta.id, amountNaira, reference]
    );
    if (rowCount) {
      sendTelegram(`💰 New ad payment received from <b>${rows[0].advertiser_name}</b> (₦${amountNaira.toLocaleString()}, ref ${reference}).\n🔗 ${siteUrl()}/admin/ads`);
    }
    return { success: !!rowCount, message: rowCount ? 'Your ad is now in the review queue — it goes live after approval.' : 'This payment was already processed.', type: 'ad' };
  }
  if (meta.type === 'listing') {
    const { rowCount, rows } = await pool.query(
      `UPDATE marketplace_purchases SET status='completed'
       WHERE paystack_ref=$1 AND status='pending' RETURNING listing_id`,
      [reference]
    );
    let delivery: { type: 'file' | 'link'; file_id?: string; link?: string; title?: string } | undefined;
    if (rowCount) {
      const listingId = rows[0].listing_id;
      const { rows: listingRows } = await pool.query(
        `SELECT title, delivery_type, file_id, link FROM marketplace_listings WHERE id=$1`,
        [listingId]
      );
      if (listingRows.length) {
        sendTelegram(
          `💰 <b>Listing sold:</b> ${listingRows[0].title} — ₦${amountNaira.toLocaleString()}\n📧 buyer email on Paystack receipt\n🔗 ${siteUrl()}/admin/marketplace`
        );
        delivery = {
          type: listingRows[0].delivery_type === 'file' ? 'file' as const : 'link' as const,
          file_id: listingRows[0].file_id || undefined,
          link: listingRows[0].link || undefined,
          title: listingRows[0].title
        };
      }
    }
    return { 
      success: !!rowCount, 
      message: rowCount ? 'Purchase complete! Check your email for details.' : 'This order was already processed.', 
      type: 'listing',
      delivery
    };
  }
  if (meta.type === 'course') {
    const courseId = Number(meta.course_id);
    const studentId = Number(meta.student_id);
    const { rowCount, rows } = await pool.query(
      `UPDATE enrollments SET status='active', amount_paid=$3, payment_ref=$4
       WHERE course_id=$1 AND student_id=$2 AND status='pending'
       RETURNING id`,
      [courseId, studentId, amountNaira, reference]
    );
    if (rowCount) {
      const { rows: cRows } = await pool.query('SELECT title FROM courses WHERE id=$1', [courseId]);
      sendTelegram(`🎓 <b>Paid course enrollment</b>\nCourse: ${cRows[0]?.title || courseId} — ₦${amountNaira.toLocaleString()}\nRef: ${reference}\n🔗 ${siteUrl()}/admin/academy`);
      return { success: true, message: 'Enrollment confirmed — start learning!', type: 'course', delivery: { type: 'link' as const, link: '/dashboard', title: 'Your Academy dashboard' } };
    }
    const active = await pool.query(`SELECT id FROM enrollments WHERE course_id=$1 AND student_id=$2 AND status IN ('active','completed')`, [courseId, studentId]);
    if (active.rows.length) {
      return { success: true, message: 'You are already enrolled in this course.', type: 'course', delivery: { type: 'link' as const, link: '/dashboard', title: 'Your Academy dashboard' } };
    }
    return { success: false, message: 'This payment could not be matched to an enrollment.', type: 'course' };
  }
  return { success: false, message: 'Payment reference is not recognised.' };
}
