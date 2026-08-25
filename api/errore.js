// api/errore.js — dove arrivano gli errori del browser (assets/eih-errori.js).
//
// Cosa fa, in ordine:
//   1. scrive l'errore nei log della funzione — sempre, senza configurare
//      niente: da soli i log di Vercel sono già meglio del nulla di oggi;
//   2. se SENTRY_DSN è impostato, inoltra a Sentry (o GlitchTip, o Bugsink:
//      parlano lo stesso protocollo). Niente SDK, niente pacchetti: una POST;
//   3. se ERRORI_WEBHOOK è impostato, manda anche lì — vale per Slack,
//      Discord, Telegram tramite un ponte, o qualunque cosa accetti JSON.
//
// Senza nessuna delle due variabili non esce niente dal nostro server. È la
// posizione di partenza giusta per un sito che raccoglie codici fiscali:
// mandare i dati fuori dev'essere una decisione, non un'impostazione di fabbrica.
//
// Il limitatore condiviso protegge dal caso peggiore: una pagina che va in
// ciclo su un errore e sparge richieste.
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const MAX_CORPO = 4000;

function taglia(v, n) {
  return String(v == null ? '' : v).slice(0, n);
}

/* Sentry accetta un evento anche senza SDK: basta l'indirizzo del progetto
   ricavato dal DSN e la chiave nell'intestazione. Si manda il minimo. */
async function versoSentry(dsn, ev) {
  const m = String(dsn).match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!m) return 'dsn illeggibile';
  const [, chiave, host, progetto] = m;
  const corpo = {
    event_id: (globalThis.crypto?.randomUUID?.() || String(Date.now())).replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'browser',
    environment: process.env.VERCEL_ENV || 'production',
    release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
    message: { formatted: ev.messaggio },
    tags: { pagina: ev.pagina, lingua: ev.lingua, tipo: ev.tipo },
    extra: { file: ev.file, riga: ev.riga, colonna: ev.colonna, schermo: ev.schermo, pila: ev.pila },
  };
  const r = await fetch(`https://${host}/api/${progetto}/store/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${chiave}, sentry_client=eih/1.0`,
    },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
  });
  return r.ok ? 'ok' : 'risposta ' + r.status;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Una pagina in ciclo puo' generare errori a raffica: il tetto e' alto
  // abbastanza da non perdere un caso vero e basso da non pagare un abuso.
  if (isRateLimited(clientIp(req), { name: 'errore', max: 30 })) {
    return res.status(429).json({ error: 'troppi errori' });
  }

  let b;
  try {
    const grezzo = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (grezzo.length > MAX_CORPO) return res.status(413).json({ error: 'troppo lungo' });
    b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) { return res.status(400).json({ error: 'JSON non valido' }); }

  const ev = {
    tipo: taglia(b.tipo, 20) || 'errore',
    messaggio: taglia(b.messaggio, 300),
    file: taglia(b.file, 200),
    riga: Number(b.riga) || 0,
    colonna: Number(b.colonna) || 0,
    pila: taglia(b.pila, 1200),
    // La pagina arriva già senza query dal browser: qui si ripulisce comunque,
    // perché un endpoint pubblico non si fida di quello che gli arriva.
    pagina: taglia(b.pagina, 120).split('?')[0],
    lingua: taglia(b.lingua, 8),
    schermo: taglia(b.schermo, 12),
  };
  if (!ev.messaggio) return res.status(400).json({ error: 'messaggio mancante' });

  console.error('[errore-browser]', JSON.stringify(ev));

  const esiti = {};
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    try { esiti.sentry = await versoSentry(dsn, ev); }
    catch (e) { esiti.sentry = String(e.message || e); }
  }
  const gancio = process.env.ERRORI_WEBHOOK;
  if (gancio) {
    try {
      await fetch(gancio, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `⚠️ ${ev.messaggio} — ${ev.pagina} (${ev.lingua}) ${ev.file}:${ev.riga}`, evento: ev }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      });
      esiti.webhook = 'ok';
    } catch (e) { esiti.webhook = String(e.message || e); }
  }

  // 204: al browser non serve sapere altro, e non si spreca banda.
  return res.status(204).end();
};
