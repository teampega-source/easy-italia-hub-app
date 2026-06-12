// api/stripe-checkout.js — Crea sessione Stripe Checkout (Premium €4,99/mese)
// Demo mode se STRIPE_SECRET_KEY o STRIPE_PRICE_ID non impostati.
'use strict';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SK       = process.env.STRIPE_SECRET_KEY;
  const PRICE_ID = process.env.STRIPE_PRICE_ID;

  if (!SK || !PRICE_ID) {
    return res.status(200).json({
      demo: true,
      message: 'Pagamenti in arrivo — configura STRIPE_SECRET_KEY e STRIPE_PRICE_ID su Vercel.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    body = {};
  }

  const { email, user_id } = body;
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

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SK}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const msg = (errData.error && errData.error.message) || 'Errore Stripe.';
    console.error('[stripe-checkout]', resp.status, msg);
    return res.status(500).json({ error: msg });
  }

  const session = await resp.json();
  res.status(200).json({ url: session.url });
};
