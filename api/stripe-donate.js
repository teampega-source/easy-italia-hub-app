// api/stripe-donate.js — Crea sessione Stripe Checkout per donazione una-tantum
'use strict';

const ALLOWED_AMOUNTS = [200, 500, 1000, 2000, 5000]; // centesimi di euro

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SK = process.env.STRIPE_SECRET_KEY;

  if (!SK) {
    return res.status(200).json({
      demo: true,
      message: 'Donazioni in arrivo — configura STRIPE_SECRET_KEY su Vercel.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    body = {};
  }

  const amount = parseInt(body.amount, 10);
  if (!amount || amount < 100 || amount > 50000) {
    return res.status(400).json({ error: 'Importo non valido (min €1, max €500).' });
  }

  const origin =
    req.headers.origin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://easyitaliahub.it');

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][unit_amount]', amount.toString());
  params.set('line_items[0][price_data][product_data][name]', 'Donazione a Easy Italia Hub');
  params.set(
    'line_items[0][price_data][product_data][description]',
    'Supporta il servizio gratuito per la community srilankese in Italia'
  );
  params.set('submit_type', 'donate');
  params.set('locale', 'it');
  params.set('success_url', `${origin}/?donated=1`);
  params.set('cancel_url', `${origin}/?donated=0`);

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SK}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const msg = (errData.error && errData.error.message) || 'Errore Stripe.';
    console.error('[stripe-donate]', resp.status, msg);
    return res.status(500).json({ error: msg });
  }

  const session = await resp.json();
  res.status(200).json({ url: session.url });
};
