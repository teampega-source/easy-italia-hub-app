// api/visite.mjs — Contatore visite del footer.
//
// Contratto: GET senza parametri → { totale, reali }. Fail-open: se qualunque
// cosa va male il client mostra il suo fallback e l'utente non vede mai un errore.
//
// PERCHÉ EDGE: il piano Hobby ammette al massimo 12 funzioni serverless per
// distribuzione, e con visite.js in Node eravamo a 13 — Vercel scopre lo sforo
// solo dopo la costruzione e la produzione resta ferma col vecchio deploy
// (successo il 25 agosto 2026, ripetuto il 30 settembre con questo endpoint).
// Le funzioni Edge stanno fuori dal conto (scripts/conta-funzioni.mjs): lo
// spostamento non cambia né l'URL (/api/visite) né il contratto. Stesso stile
// di api/og.mjs e api/salute.mjs.
//
// Deduplica: cookie tecnico di sessione (`eih_v`, 30 minuti, HttpOnly, SameSite=Lax,
// Secure in produzione). Un visitatore che naviga dieci pagine conta 1; se torna
// dopo mezz'ora conta di nuovo, come un quotidiano. Nessun dato personale nel DB:
// il cookie non viene memorizzato da nessuna parte, serve solo a questa risposta.
//
// Sicurezza: la RPC `visite_registra` è eseguibile solo dalla service key
// (migration-011). Rate limit best-effort in-memory per isolato, fail-open —
// come api/_ratelimit.js fa per gli endpoint Node, qui in forma ridotta perché
// l'edge runtime non importa i moduli CommonJS degli altri endpoint.
export const config = { runtime: 'edge' };

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const COOKIE = 'eih_v';
const DEDUP_MS = 30 * 60 * 1000; // 30 minuti: stessa visita, non nuova

// Secchiello per isolato: blunts bursty abuse da un singolo IP sull'istanza
// calda; non è una garanzia globale (vedi il CAVEAT in _ratelimit.js).
const LIMITI = { finestraMs: 60_000, max: 30, maxChiavi: 5000 };
const secchiello = new Map(); // ip -> number[]

function limitato(ip, now) {
  try {
    if (!ip) return false; // client sconosciuto → non blocchiamo mai
    if (secchiello.size > LIMITI.maxChiavi) secchiello.clear();
    const arr = (secchiello.get(ip) || []).filter((t) => now - t < LIMITI.finestraMs);
    arr.push(now);
    secchiello.set(ip, arr);
    return arr.length > LIMITI.max;
  } catch {
    return false; // mai lasciare che il limiter rompa una richiesta vera
  }
}

export default async function handler(req) {
  const now = Date.now();
  const baseHeaders = {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: baseHeaders });
  }
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: baseHeaders });
  }

  // Il contatore non è essenziale: sotto attacco, si tira indietro in silenzio.
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (limitato(ip, now)) {
    return new Response('Too Many Requests', { status: 429, headers: baseHeaders });
  }

  // ── Cookie di deduplica ─────────────────────────────────────────
  const cookies = req.headers.get('cookie') || '';
  const match = cookies.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)'));
  const visto = match ? decodeURIComponent(match[1]) : '';
  const conta = !(visto && now - Number(visto) < DEDUP_MS && Number(visto) > 0);

  const maxAge = Math.floor(DEDUP_MS / 1000);
  const sicuro =
    process.env.NODE_ENV === 'production' || req.headers.get('x-forwarded-proto') === 'https';
  const setCookie =
    `${COOKIE}=${conta ? now : visto}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax` +
    (sicuro ? '; Secure' : '');

  const formula = () => ({
    totale: 824 + Math.max(0, Math.floor(now / 86_400_000) - Math.floor(Date.UTC(2026, 8, 26) / 86_400_000)) * 5,
    reali: null,
  });

  // Senza credenziali Supabase (es. anteprima locale): rispondiamo con il solo
  // calcolo della formula, senza toccare il DB.
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(200, formula(), setCookie);
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

    return json(200, {
      totale: (d.base || 0) + (d.giorni || 0) * 5 + (d.reali || 0),
      reali: d.reali || 0,
    }, setCookie);
  } catch (e) {
    // Fail-open: il client ha il fallback con la stessa formula.
    return json(200, { ...formula(), degradato: true }, setCookie);
  }
}

function json(status, obj, setCookie) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Set-Cookie': setCookie,
    },
  });
}
