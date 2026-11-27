// api/stripe.js — POST: sessione Stripe Checkout (abbonamento o donazione)
// body.type = 'donate' | 'checkout' (default)
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');
const {
  isSameOrigin, originForRedirect, userFromRequest, publicUser,
  validEmail, text, json,
} = require('./_security');

const ALLOWED_DONATE_AMOUNTS = [200, 500, 1000, 2000, 5000];

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });

  // Una sessione Stripe non deve poter essere creata da un sito terzo.
  if (!isSameOrigin(req)) return json(res, 403, { error: 'Origine non consentita.' });

  if (isRateLimited(clientIp(req), { name: 'stripe', max: 10 })) {
    return json(res, 429, { error: 'Troppe richieste. Attendi un minuto e riprova.' });
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

  /* L'identità non si prende dal body: se c'è un token Supabase valido
     usiamo quell'utente, altrimenti il checkout resta ospite con la sola
     email. Prima un client poteva scrivere user_id di un altro account nei
     metadata Stripe. */
  const authUser = publicUser(await userFromRequest(req));
  const bodyEmail = validEmail(body.email) ? text(body.email, 254).toLowerCase() : '';
  const email = authUser ? authUser.email : bodyEmail;
  const userId = authUser ? authUser.id : null;
  /* Il piano NON si prende dal body: con un solo prezzo Stripe, lasciare che
     il client scelga "business" significherebbe pagare premium e ricevere
     business. Se un giorno servono più piani, mappare price_id → piano qui. */
  const safePlan = ['premium', 'premium_plus', 'business'].includes(process.env.STRIPE_PLAN)
    ? process.env.STRIPE_PLAN : 'premium';
  const origin = originForRedirect(req);

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
  if (userId) params.set('subscription_data[metadata][user_id]', userId);
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
    return res.status(500).json({ error: 'Errore pagamento. Riprova.' });
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

  const origin = originForRedirect(req);

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
    return res.status(500).json({ error: 'Errore pagamento. Riprova.' });
  }

  const session = await resp.json();
  return res.status(200).json({ url: session.url });
}
