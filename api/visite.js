// api/visite.js — Contatore visite del footer.
//
// Contratto: GET senza parametri → { totale, reali }. Fail-open: se qualunque
// cosa va male il client mostra il suo fallback e l'utente non vede mai un errore.
//
// Deduplica: cookie tecnico di sessione (`eih_v`, 30 minuti, HttpOnly, SameSite=Lax,
// Secure in produzione). Un visitatore che naviga dieci pagine conta 1; se torna
// dopo mezz'ora conta di nuovo, come un quotidiano. Nessun dato personale nel DB:
// il cookie non viene memorizzato da nessuna parte, serve solo a questa risposta.
//
// Sicurezza: la RPC `visite_registra` è eseguibile solo dalla service key
// (migration-011). Rate limit best-effort come dagli altri endpoint pubblici.
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit.js');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const COOKIE = 'eih_v';
const DEDUP_MS = 30 * 60 * 1000; // 30 minuti: stessa visita, non nuova

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end();
  }

  // Il contatore non è essenziale: sotto attacco, si tira indietro in silenzio.
  const ip = clientIp(req);
  if (isRateLimited(ip, { name: 'visite', windowMs: 60_000, max: 30 })) {
    res.statusCode = 429;
    return res.end();
  }

  // ── Cookie di deduplica ─────────────────────────────────────────
  const cookies = String(req.headers.cookie || '');
  const match = cookies.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)'));
  const visto = match ? decodeURIComponent(match[1]) : '';
  const now = Date.now();
  const conta = !(visto && now - Number(visto) < DEDUP_MS && Number(visto) > 0);

  const maxAge = Math.floor(DEDUP_MS / 1000);
  res.setHeader('Set-Cookie',
    `${COOKIE}=${conta ? now : visto}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax` +
    (process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''));

  // Senza credenziali Supabase (es. anteprima locale): rispondiamo con il solo
  // calcolo della formula, senza toccare il DB.
  if (!SUPABASE_URL || !SERVICE_KEY) {
    const giorni = Math.max(0, Math.floor(now / 86_400_000) - Math.floor(Date.UTC(2026, 8, 26) / 86_400_000));
    return json(res, 200, { totale: 824 + giorni * 5, reali: null });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/visite_registra`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conta }),
    });
    if (!r.ok) throw new Error(`supabase ${r.status}`);
    const d = await r.json();

    json(res, 200, {
      totale: (d.base || 0) + (d.giorni || 0) * 5 + (d.reali || 0),
      reali: d.reali || 0,
    });
  } catch (e) {
    // Fail-open: il client ha il fallback con la stessa formula.
    const giorni = Math.max(0, Math.floor(now / 86_400_000) - Math.floor(Date.UTC(2026, 8, 26) / 86_400_000));
    json(res, 200, { totale: 824 + giorni * 5, reali: null, degradato: true });
  }
};

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}
