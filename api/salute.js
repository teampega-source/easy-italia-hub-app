// api/salute.js — «il sito è vivo?», ma sul serio.
//
// Perché non basta sorvegliare la home. La home è HTML statico servito dalla
// rete di distribuzione: risponde 200 anche quando Supabase è in pausa,
// quando la chiave di Gemini è scaduta e quando Resend ha smesso di accettare
// le email. Un sorvegliante puntato lì direbbe «tutto bene» mentre nessuno
// riesce a entrare nel proprio percorso.
//
// Qui si guardano le cose da cui il sito dipende davvero, e si risponde:
//   200  tutto in piedi
//   503  qualcosa di essenziale è giù  → è il segnale che fa partire l'avviso
//
// Cosa NON fa: non tocca dati di persone, non scrive niente, non legge
// nessuna tabella con dentro qualcuno. Chiede a Supabase la sua ora e basta.
// Le chiavi si controllano per presenza, non si stampano mai.
//
// Uso: monitor HTTP su https://easyitaliahub.it/api/salute — parola chiave
// da cercare nella risposta: "ok":true
'use strict';

const TIMEOUT_MS = 4000;

/* Si taglia con un segnale di annullamento, non con una corsa contro un timer:
   `Promise.race` fa scadere l'attesa ma lascia la richiesta viva dietro le
   quinte, che su una funzione serverless significa pagarla e non saperlo.
   È il punto 4 della checklist in .references/silent-failure-checklist.md. */
function scadenza(ms) {
  return AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
}

async function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  // Senza Supabase il sito funziona lo stesso, in modalità demo: non è un
  // guasto, è una configurazione. Si dichiara e non si fa fallire il controllo.
  if (!url || !key) return { stato: 'assente', essenziale: false };
  try {
    const r = await fetch(url.replace(/\/+$/, '') + '/rest/v1/', {
      headers: { apikey: key },
      signal: scadenza(TIMEOUT_MS),
    });
    // PostgREST sulla radice risponde 200 con lo schema. Qualunque risposta
    // dice che il progetto è sveglio: il piano gratuito va in pausa da solo
    // dopo una settimana di silenzio, ed è proprio quello che vogliamo vedere.
    return { stato: r.ok ? 'ok' : 'errore ' + r.status, essenziale: true, ok: r.ok };
  } catch (e) {
    return { stato: String(e.message || e), essenziale: true, ok: false };
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Mai in cache: una risposta salvata direbbe che il sito sta bene anche
  // mezz'ora dopo che ha smesso.
  res.setHeader('Cache-Control', 'no-store');

  const db = await supabase();

  const pezzi = {
    supabase: db.stato,
    // Presenza delle chiavi: se sparisce una variabile d'ambiente dopo un
    // rientro di configurazione, la funzione smette di funzionare in silenzio.
    resend: process.env.RESEND_API_KEY ? 'ok' : 'assente',
    gemini: (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'ok' : 'assente',
    cron: process.env.CRON_SECRET ? 'ok' : 'assente',
  };

  // Cade solo per quello che è davvero essenziale: se Supabase non è
  // configurato il sito vive in demo, se è configurato ma non risponde no.
  const ok = !(db.essenziale && !db.ok);

  return res.status(ok ? 200 : 503).json({
    ok,
    quando: new Date().toISOString(),
    pezzi,
  });
};
