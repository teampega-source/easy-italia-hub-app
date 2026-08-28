// api/errore.mjs — dove arrivano gli errori del browser (assets/eih-errori.js).
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
// Perché Edge: vale la stessa ragione scritta in salute.mjs — sul piano Hobby
// le funzioni serverless sono al massimo 12, e queste due erano la tredicesima
// e la quattordicesima.

export const config = { runtime: 'edge' };

const MAX_CORPO = 4000;

/* Il limitatore non arriva da api/_ratelimit.js: quello è CommonJS e l'Edge non
   ha require. Copiarne dodici righe costa meno che tenere due moduli gemelli, e
   la finestra scorrevole è comunque per singola istanza in entrambi i mondi:
   condividere il file non avrebbe condiviso il conteggio. Cede aperto. */
const colpi = new Map();
function troppi(ip, max = 30, finestra = 60_000) {
  if (!ip) return false;
  const ora = Date.now();
  if (colpi.size > 5000) colpi.clear();
  const arr = (colpi.get(ip) || []).filter((t) => ora - t < finestra);
  arr.push(ora);
  colpi.set(ip, arr);
  return arr.length > max;
}

function taglia(v, n) {
  return String(v == null ? '' : v).slice(0, n);
}

const risposta = (stato, corpo) =>
  new Response(corpo ? JSON.stringify(corpo) : null, {
    status: stato,
    headers: corpo ? { 'Content-Type': 'application/json; charset=utf-8' } : {},
  });

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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    });
  }
  // Una pagina in ciclo puo' generare errori a raffica: il tetto e' alto
  // abbastanza da non perdere un caso vero e basso da non pagare un abuso.
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (troppi(ip)) return risposta(429, { error: 'troppi errori' });

  let b;
  try {
    const grezzo = await req.text();
    if (grezzo.length > MAX_CORPO) return risposta(413, { error: 'troppo lungo' });
    b = grezzo ? JSON.parse(grezzo) : {};
  } catch (e) {
    return risposta(400, { error: 'JSON non valido' });
  }

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
  if (!ev.messaggio) return risposta(400, { error: 'messaggio mancante' });

  console.error('[errore-browser]', JSON.stringify(ev));

  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    try { await versoSentry(dsn, ev); }
    catch (e) { console.error('[errore-browser] sentry:', e.message || e); }
  }
  const gancio = process.env.ERRORI_WEBHOOK;
  if (gancio) {
    try {
      await fetch(gancio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `⚠️ ${ev.messaggio} — ${ev.pagina} (${ev.lingua}) ${ev.file}:${ev.riga}`, evento: ev }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      });
    } catch (e) { console.error('[errore-browser] webhook:', e.message || e); }
  }

  // 204: al browser non serve sapere altro, e non si spreca banda.
  return risposta(204, null);
}
