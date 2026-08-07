const crypto = require('crypto');

const SECRET = process.env.PAYSTACK_SECRET_KEY || '';

async function initializePayment({ email, amountKobo, reference, metadata, callbackUrl }) {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata
    })
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || 'Paystack initialization failed');
  return data.data;
}

async function verifyTransaction(reference) {
  if (!SECRET) return null;
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${SECRET}` }
  });
  const data = await res.json();
  if (!data.status || data.data.status !== 'success') return null;
  return data.data;
}

function verifyWebhookSignature(rawBody, signature) {
  if (!SECRET || !signature) return false;
  const hash = crypto.createHmac('sha512', SECRET).update(rawBody).digest('hex');
  return hash === signature;
}

function makeReference(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { initializePayment, verifyTransaction, verifyWebhookSignature, makeReference, hasKeys: !!SECRET };
