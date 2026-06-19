// api/subscribe-flights.js — Iscrive un utente agli avvisi volo settimanali
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VALID_ORIGINS = new Set(['MXP','FCO','TRN','VCE','NAP','BGY','LIN','PMO']);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (isRateLimited(clientIp(req), { name: 'subscribe-flights', max: 5 })) {
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch(_){} }

  const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
  const origin = String(body.origin || 'MXP').toUpperCase().slice(0, 4);
  const maxPrice = body.max_price ? parseInt(body.max_price, 10) : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email non valida.' });
  }
  if (!VALID_ORIGINS.has(origin)) {
    return res.status(400).json({ error: 'Aeroporto di partenza non valido.' });
  }
  if (maxPrice !== null && (isNaN(maxPrice) || maxPrice < 50 || maxPrice > 5000)) {
    return res.status(400).json({ error: 'Budget non valido (50–5000 EUR).' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(200).json({ ok: true, demo: true });
  }

  const payload = { email, origin, destination: 'CMB', active: true };
  if (maxPrice !== null) payload.max_price = maxPrice;

  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/flight_subscribers?on_conflict=email,origin,destination`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    }
  ).catch(err => { console.error('[subscribe-flights]', err.message); return null; });

  if (!resp || !resp.ok) {
    console.error('[subscribe-flights] supabase:', resp ? await resp.text() : 'network error');
    return res.status(500).json({ error: 'Errore salvataggio. Riprova.' });
  }

  return res.status(200).json({ ok: true });
};
