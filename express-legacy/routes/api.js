const express = require('express');
const { pool } = require('../config/db');
const paystack = require('../lib/paystack');
const { runScheduledTasks } = require('../lib/cron');

const router = express.Router();

router.post('/webhooks/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const raw = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
  if (!paystack.verifyWebhookSignature(raw, signature)) {
    return res.status(400).json({ status: 'invalid signature' });
  }
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return res.status(400).json({ status: 'bad payload' });
  }
  if (event.event === 'charge.success') {
    const ref = event.data && event.data.reference;
    if (ref) {
      const txn = await paystack.verifyTransaction(ref);
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
            `UPDATE marketplace_listings SET status='pending', fee_paid=true, paystack_ref=$2
             WHERE id=$1 AND status='pending_payment'`,
            [meta.id, ref]
          );
        }
      }
    }
  }
  res.json({ status: 'ok' });
});

router.get('/cron', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const result = await runScheduledTasks();
  res.json({ ok: true, ...result });
});

module.exports = router;
