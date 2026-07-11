// api/keepalive.js — Cron giornaliero: tiene "sveglio" il progetto Supabase.
// Il piano Free mette in pausa il progetto dopo ~7 giorni di inattività; una
// richiesta al DB al giorno azzera quel timer. Ping leggero (HEAD, 0 righe).
// Vercel inietta Authorization: Bearer <CRON_SECRET> per autenticare la chiamata.
'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers['authorization'] !== `Bearer ${secret}`) {
    return res.status(401).end();
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(200).json({ skipped: 'not configured' });
  }
  try {
    // HEAD su una tabella esistente: colpisce Postgres senza trasferire righe.
    const r = await fetch(`${SUPABASE_URL}/rest/v1/flight_subscribers?select=id&limit=1`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    return res.status(200).json({ ok: r.ok, status: r.status });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e && e.message || e) });
  }
};
