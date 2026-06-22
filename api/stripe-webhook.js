// api/stripe-webhook.js — Gestisce eventi Stripe webhook (lifecycle abbonamento)
// Verifica firma HMAC-SHA256. Aggiorna tabella subscriptions in Supabase.
'use strict';

const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handler(req, res) {
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
          const sessionMeta = obj.metadata || {};
          const subMeta = (obj.subscription_data && obj.subscription_data.metadata) || {};
          const userId = sessionMeta.user_id || subMeta.user_id;
          const plan = resolvePlan(sessionMeta.plan || subMeta.plan);
          await upsertSubscription({
            email: custEmail, user_id: userId, plan,
            stripe_subscription_id: obj.subscription,
            stripe_customer_id: obj.customer, status: 'active',
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const isActive = ['active', 'trialing'].includes(obj.status);
        const plan = isActive ? resolvePlan((obj.metadata && obj.metadata.plan) || null) : 'free';
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
    return res.status(500).json({ error: 'DB error — Stripe will retry' });
  }

  res.status(200).json({ received: true });
}

// Disable Vercel's automatic body parsing so we can read the raw stream
// (Stripe signature verification requires the raw bytes, not a parsed object)
handler.config = { api: { bodyParser: false } };

module.exports = handler;

function resolvePlan(raw) {
  return ['premium', 'premium_plus', 'business'].includes(raw) ? raw : 'free';
}

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
  const expectedBuf = Buffer.from(expected, 'hex');
  const signatureBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== signatureBuf.length) throw new Error('Signature length mismatch');
  if (!crypto.timingSafeEqual(expectedBuf, signatureBuf)) throw new Error('Signature mismatch');
  return JSON.parse(payload.toString('utf8'));
}

async function upsertSubscription(data) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  const base = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (data.user_id) {
    // True upsert (INSERT OR UPDATE) on unique user_id — requires UNIQUE(user_id) on table.
    const payload = { user_id: data.user_id, plan: data.plan, status: data.status, updated_at: new Date().toISOString() };
    if (data.stripe_subscription_id) payload.stripe_subscription_id = data.stripe_subscription_id;
    if (data.stripe_customer_id) payload.stripe_customer_id = data.stripe_customer_id;
    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?on_conflict=user_id`, {
      method: 'POST',
      headers: { ...base, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(payload),
    }).catch(err => console.error('[stripe-webhook] upsert error:', err.message));
    return;
  }

  // No user_id (subscription lifecycle events): update existing row by Stripe identifiers.
  const payload = { plan: data.plan, status: data.status, updated_at: new Date().toISOString() };
  if (data.stripe_subscription_id) payload.stripe_subscription_id = data.stripe_subscription_id;

  const filterCol = data.stripe_subscription_id ? 'stripe_subscription_id' :
                    data.stripe_customer_id ? 'stripe_customer_id' : null;
  const filterVal = data.stripe_subscription_id || data.stripe_customer_id;
  if (!filterCol) return;

  await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?${filterCol}=eq.${encodeURIComponent(filterVal)}`, {
    method: 'PATCH',
    headers: { ...base, 'Prefer': 'return=minimal' },
    body: JSON.stringify(payload),
  }).catch(err => console.error('[stripe-webhook] PATCH error:', err.message));
}
