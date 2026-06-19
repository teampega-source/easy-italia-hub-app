// api/unsubscribe-flights.js — Disattiva iscrizione avvisi volo tramite link email
'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').trim();
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    return res.status(400).send('Link non valido o scaduto.');
  }

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
    }).catch(err => console.error('[unsubscribe-flights]', err.message));
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
};
