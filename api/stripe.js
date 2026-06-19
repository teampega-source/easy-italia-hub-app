// api/stripe.js — POST: sessione Stripe Checkout (abbonamento o donazione)
// body.type = 'donate' | 'checkout' (default)
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const ALLOWED_DONATE_AMOUNTS = [200, 500, 1000, 2000, 5000];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (isRateLimited(clientIp(req), { name: 'stripe', max: 10 })) {
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto e riprova.' });
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { body = {}; }

  const type = body.type === 'donate' ? 'donate' : 'checkout';
  return type === 'donate' ? handleDonate(req, res, body) : handleCheckout(req, res, body);
};

async function handleCheckout(req, res, body) {
  const SK       = process.env.STRIPE_SECRET_KEY;
  const PRICE_ID = process.env.STRIPE_PRICE_ID;

  if (!SK || !PRICE_ID) {
    return res.status(200).json({
      demo: true,
      message: 'Pagamenti in arrivo — configura STRIPE_SECRET_KEY e STRIPE_PRICE_ID su Vercel.',
    });
  }

  const { email, user_id, plan = 'premium' } = body;
  const safePlan = ['premium', 'premium_plus', 'business'].includes(plan) ? plan : 'premium';
  const origin =
    req.headers.origin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://easyitaliahub.it');

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('line_items[0][price]', PRICE_ID);
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${origin}/dashboard?upgraded=1&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/abbonamenti?cancelled=1`);
  params.set('subscription_data[trial_period_days]', '14');
  params.set('locale', 'it');
  params.set('billing_address_collection', 'auto');
  if (email) params.set('customer_email', email);
  if (user_id) params.set('subscription_data[metadata][user_id]', user_id);
  params.set('subscription_data[metadata][plan]', safePlan);

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const msg = (errData.error && errData.error.message) || 'Errore Stripe.';
    console.error('[stripe/checkout]', resp.status, msg);
    return res.status(500).json({ error: msg });
  }

  const session = await resp.json();
  return res.status(200).json({ url: session.url });
}

async function handleDonate(req, res, body) {
  const SK = process.env.STRIPE_SECRET_KEY;

  if (!SK) {
    return res.status(200).json({
      demo: true,
      message: 'Donazioni in arrivo — configura STRIPE_SECRET_KEY su Vercel.',
    });
  }

  const amount = parseInt(body.amount, 10);
  if (!ALLOWED_DONATE_AMOUNTS.includes(amount))
    return res.status(400).json({ error: 'Importo non valido.' });

  const origin =
    req.headers.origin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://easyitaliahub.it');

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][unit_amount]', amount.toString());
  params.set('line_items[0][price_data][product_data][name]', 'Donazione a Easy Italia Hub');
  params.set('line_items[0][price_data][product_data][description]', 'Supporta il servizio gratuito per la community srilankese in Italia');
  params.set('submit_type', 'donate');
  params.set('locale', 'it');
  params.set('success_url', `${origin}/?donated=1`);
  params.set('cancel_url', `${origin}/?donated=0`);

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SK}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const msg = (errData.error && errData.error.message) || 'Errore Stripe.';
    console.error('[stripe/donate]', resp.status, msg);
    return res.status(500).json({ error: msg });
  }

  const session = await resp.json();
  return res.status(200).json({ url: session.url });
}
