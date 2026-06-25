// ─────────────────────────────────────────────────────────────
// Easy Italia Hub — FX rate proxy (EUR → LKR) for the remittance comparator.
//
// Vercel serverless function. Server-side fetches a FREE, no-key FX API and
// returns a small, normalized JSON payload the client widget can consume.
//
// WHY a server-side proxy: the landing page CSP blocks third-party fetches from
// the browser. This function runs server-side (NOT CSP-constrained), so the
// third-party call happens here and the client only ever talks to same-origin
// /api/fx. No API key, no user secrets, no npm deps — just the global fetch.
//
// HONESTY: these are INTERBANK (mid-market) reference rates, NOT a live
// per-provider quote. The widget makes this explicit to the user.
// ─────────────────────────────────────────────────────────────

// Upstream: open.er-api.com — free, no API key required.
// Shape: { result:"success", time_last_update_utc:"...", rates:{ LKR, USD, INR, ... } }
const FX_URL = "https://open.er-api.com/v6/latest/EUR";

// Currencies we expose to the client (LKR is the key one for Sri Lanka).
const WANTED = ["LKR", "USD", "INR"];

// Network timeout for the upstream call. If it is exceeded we fall back to a
// recent static rate (HTTP 200, stale:true) so the widget always works.
const FETCH_TIMEOUT_MS = 6000;

// Recent STATIC fallback (approx., updated manually). Used only when the live
// fetch fails or times out. Clearly marked stale so the widget can warn the user.
const FALLBACK = {
  base: "EUR",
  rates: { LKR: 335, USD: 1.08, INR: 92 },
  source: "fallback",
  stale: true,
};

/** Coerce to a finite positive number, else undefined. */
function num(v) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Build the normalized payload (drops any currency the upstream omitted). */
function pickRates(rates) {
  const out = {};
  for (const cur of WANTED) {
    const n = num(rates?.[cur]);
    if (n !== undefined) out[cur] = n;
  }
  return out;
}

/** fetch with an abort timeout so a hung upstream can never hang the function. */
async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(t);
  }
}

const { isRateLimited, clientIp } = require('./_ratelimit');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // POST with email+target_rate → EUR/LKR alert subscription
  if (req.method === 'POST' && (req.body?.email || req.body?.target_rate)) {
    if (isRateLimited(clientIp(req), { name: 'fx-alert', max: 10 })) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    const email = String(req.body.email || '').trim().toLowerCase();
    const rate  = parseInt(req.body.target_rate, 10);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email non valida' });
    }
    if (!rate || rate < 200 || rate > 600) {
      return res.status(400).json({ error: 'Tasso fuori range (200-600)' });
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const r = await fetch(url + '/rest/v1/fx_alert_subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ email, target_rate: rate, created_at: new Date().toISOString() }),
      });
      if (!r.ok && r.status !== 409) {
        return res.status(502).json({ error: 'Database error' });
      }
    }
    return res.status(200).json({ ok: true });
  }

  // GET (or POST without alert fields) → return FX rates
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  try {
    const r = await fetchWithTimeout(FX_URL, FETCH_TIMEOUT_MS);
    if (!r.ok) throw new Error(`upstream_status_${r.status}`);

    const data = await r.json();
    if (data?.result && data.result !== "success") {
      throw new Error(`upstream_result_${data.result}`);
    }

    const rates = pickRates(data?.rates);
    if (rates.LKR === undefined) throw new Error("missing_lkr");

    return res.status(200).json({
      base: "EUR",
      rates,
      updated: data?.time_last_update_utc || new Date().toISOString(),
      source: "open.er-api.com",
    });
  } catch (err) {
    return res.status(200).json({
      base: FALLBACK.base,
      rates: FALLBACK.rates,
      updated: new Date().toISOString(),
      source: FALLBACK.source,
      stale: true,
    });
  }
};
