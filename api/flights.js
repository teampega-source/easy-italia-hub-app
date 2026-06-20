// api/flights.js
// GET ?from=IATA → prezzi live Amadeus (comparatore)
// GET ?id=UUID   → disiscrizione avvisi volo
// POST           → iscrizione avvisi volo
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AM_ID     = process.env.AMADEUS_CLIENT_ID;
const AM_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AM_HOST   = process.env.AMADEUS_ENV === 'production'
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';

const VALID_ORIGINS = new Set(['MXP','FCO','TRN','VCE','NAP','BGY','LIN','PMO']);

// ── In-memory caches (warm instances) ───────────────────────────────────────
let _amToken = null, _amTokenExp = 0;
const _priceCache = new Map(); // origin → { data, exp }

// ── Router ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'POST') return handleSubscribe(req, res);
  if (req.method === 'GET') {
    const q = req.query || {};
    if (q.from) return handlePrices(req, res, q);
    return handleUnsubscribe(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
};

// ── PREZZI LIVE (Amadeus) ────────────────────────────────────────────────────
async function handlePrices(req, res, q) {
  if (isRateLimited(clientIp(req), { name: 'prices', max: 30 })) {
    return res.status(429).json({ error: 'Troppe richieste.' });
  }

  const origin = String(q.from).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (!VALID_ORIGINS.has(origin))
    return res.status(400).json({ error: 'Aeroporto non valido.' });

  const cached = _priceCache.get(origin);
  if (cached && Date.now() < cached.exp) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json(cached.data);
  }

  if (!AM_ID || !AM_SECRET) {
    return res.status(200).json({ demo: true, origin, destination: 'CMB', offers: demoOffers(origin) });
  }

  try {
    const token = await getAmadeusToken();
    const today = new Date();
    const start = addDays(today, 3);
    const end   = addDays(today, 90);
    const fmt   = d => d.toISOString().slice(0, 10);

    const url = `${AM_HOST}/v1/shopping/flight-dates?origin=${origin}&destination=CMB&oneWay=true&departureDate=${fmt(start)},${fmt(end)}&nonStop=false&viewBy=DATE`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) throw new Error(`Amadeus ${resp.status}`);

    const json = await resp.json();
    const offers = (json.data || [])
      .filter(d => d.price && d.departureDate)
      .sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))
      .slice(0, 8)
      .map(d => ({ departureDate: d.departureDate, price: parseFloat(d.price.total), currency: 'EUR' }));

    const result = { origin, destination: 'CMB', offers: offers.length ? offers : demoOffers(origin) };
    _priceCache.set(origin, { data: result, exp: Date.now() + 4 * 3600_000 });
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json(result);

  } catch (err) {
    console.error('[flights/prices]', err.message);
    return res.status(200).json({ demo: true, origin, destination: 'CMB', offers: demoOffers(origin) });
  }
}

async function getAmadeusToken() {
  if (_amToken && Date.now() < _amTokenExp) return _amToken;
  const params = new URLSearchParams({ grant_type: 'client_credentials', client_id: AM_ID, client_secret: AM_SECRET });
  const resp = await fetch(`${AM_HOST}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!resp.ok) throw new Error('Token ' + resp.status);
  const json = await resp.json();
  _amToken = json.access_token;
  _amTokenExp = Date.now() + (json.expires_in - 60) * 1000;
  return _amToken;
}

function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }

function demoOffers(origin) {
  const base = { MXP: 590, FCO: 610, TRN: 625, VCE: 615, NAP: 640, BGY: 580, LIN: 595, PMO: 660 }[origin] || 600;
  const today = new Date();
  return [14, 21, 35, 49, 63, 77].map((offset, i) => {
    const d = addDays(today, offset);
    const seasonal = [0, -30, -20, -10, 0, 10, 20, 60, 10, -20, -15, 40][d.getMonth()];
    return { departureDate: d.toISOString().slice(0, 10), price: base + seasonal + (i % 3 === 0 ? -15 : 0), currency: 'EUR' };
  });
}

// ── ISCRIZIONE AVVISI ────────────────────────────────────────────────────────
async function handleSubscribe(req, res) {
  if (isRateLimited(clientIp(req), { name: 'flights-sub', max: 5 }))
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto.' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch(_){} }

  const email    = String(body.email || '').trim().toLowerCase().slice(0, 254);
  const origin   = String(body.origin || 'MXP').toUpperCase().slice(0, 4);
  const maxPrice = body.max_price ? parseInt(body.max_price, 10) : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email non valida.' });
  if (!VALID_ORIGINS.has(origin))
    return res.status(400).json({ error: 'Aeroporto di partenza non valido.' });
  if (maxPrice !== null && (isNaN(maxPrice) || maxPrice < 50 || maxPrice > 5000))
    return res.status(400).json({ error: 'Budget non valido (50–5000 EUR).' });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)
    return res.status(200).json({ ok: true, demo: true });

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
  ).catch(err => { console.error('[flights/sub]', err.message); return null; });

  if (!resp || !resp.ok) {
    console.error('[flights/sub] supabase:', resp ? await resp.text() : 'network error');
    return res.status(500).json({ error: 'Errore salvataggio. Riprova.' });
  }
  return res.status(200).json({ ok: true });
}

// ── DISISCRIZIONE ────────────────────────────────────────────────────────────
async function handleUnsubscribe(req, res) {
  const id = String((req.query && req.query.id) || '').trim();
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))
    return res.status(400).send('Link non valido o scaduto.');

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    await fetch(`${SUPABASE_URL}/rest/v1/flight_subscribers?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ active: false }),
    }).catch(err => console.error('[flights/unsub]', err.message));
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Iscrizione rimossa — Easy Italia Hub</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f4f0;padding:1rem}
.box{max-width:440px;width:100%;text-align:center;padding:2.5rem 2rem;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
h1{margin:0 0 .75rem;color:#1a1814;font-size:1.5rem}p{color:#7d7058;margin:0 0 1.25rem}
a{display:inline-block;padding:.65rem 1.4rem;background:#7d7058;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:.9rem}</style>
</head><body><div class="box">
<p style="font-size:2rem;margin-bottom:.5rem">✅</p>
<h1>Iscrizione rimossa</h1>
<p>Non riceverai più avvisi volo da Easy Italia Hub.</p>
<a href="https://easyitaliahub.it/voli">← Torna alla pagina voli</a>
</div></body></html>`);
}
