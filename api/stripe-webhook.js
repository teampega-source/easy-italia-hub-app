// api/stripe-webhook.js — Gestisce eventi Stripe webhook (lifecycle abbonamento)
// Verifica firma HMAC-SHA256. Aggiorna tabella subscriptions in Supabase.
'use strict';

const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) return res.status(200).json({ ignored: 'Stripe not configured' });

  // Collect raw body (needed for signature verification)
  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', chunk => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    event = verifyAndParse(rawBody, req.headers['stripe-signature'] || '', WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] Invalid signature:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const obj = event.data.object;
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        if (obj.mode === 'subscription') {
          const custEmail = (obj.customer_details && obj.customer_details.email) || obj.customer_email;
          const userId = (obj.metadata && obj.metadata.user_id) ||
                         (obj.subscription_data && obj.subscription_data.metadata && obj.subscription_data.metadata.user_id);
          await upsertSubscription({
            email: custEmail, user_id: userId, plan: 'premium',
            stripe_subscription_id: obj.subscription,
            stripe_customer_id: obj.customer, status: 'active',
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const plan = ['active', 'trialing'].includes(obj.status) ? 'premium' : 'free';
        const status = obj.status || 'active';
        await upsertSubscription({
          stripe_subscription_id: obj.id, stripe_customer_id: obj.customer, plan, status,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        await upsertSubscription({
          stripe_subscription_id: obj.id, stripe_customer_id: obj.customer,
          plan: 'free', status: 'canceled',
        });
        break;
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] DB error:', err.message);
  }

  res.status(200).json({ received: true });
};

function verifyAndParse(payload, sigHeader, secret) {
  const parts = sigHeader.split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Part = parts.find(p => p.startsWith('v1='));
  if (!tPart || !v1Part) throw new Error('Missing signature components');
  const timestamp = tPart.slice(2);
  const signature = v1Part.slice(3);
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) throw new Error('Timestamp too old');
  const signed = `${timestamp}.${payload.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(signed, 'utf8').digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))) {
    throw new Error('Signature mismatch');
  }
  return JSON.parse(payload.toString('utf8'));
}

async function upsertSubscription(data) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  const payload = {
    plan: data.plan,
    status: data.status,
    updated_at: new Date().toISOString(),
  };
  if (data.stripe_subscription_id) payload.stripe_subscription_id = data.stripe_subscription_id;
  if (data.stripe_customer_id) payload.stripe_customer_id = data.stripe_customer_id;

  let filterUrl;
  if (data.user_id) {
    filterUrl = `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(data.user_id)}`;
  } else if (data.stripe_customer_id) {
    filterUrl = `${SUPABASE_URL}/rest/v1/subscriptions?stripe_customer_id=eq.${encodeURIComponent(data.stripe_customer_id)}`;
  } else {
    return;
  }

  await fetch(filterUrl, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  }).catch(err => console.error('[stripe-webhook] PATCH error:', err.message));
}
