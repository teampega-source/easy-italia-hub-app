// api/flight-track.js — GET ?fn=UL566 → posizione live del volo (ADS-B, OpenSky)
// Nessuna chiave richiesta. I dati ADS-B usano il codice ICAO della compagnia
// (UL → ALK), quindi il numero IATA inserito dall'utente va convertito.
// Se l'aereo non è a terra/in copertura non risulta: il client rimanda a FR24.
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

// IATA → ICAO per le compagnie della rotta Italia ↔ Colombo (+ principali in Italia).
const ICAO = {
  UL:'ALK', EK:'UAE', QR:'QTR', EY:'ETD', TK:'THY', LH:'DLH', AZ:'ITY', SV:'SVA',
  MS:'MSR', AI:'AIC', WY:'OMA', GF:'GFA', KU:'KAC', G9:'ABY', FZ:'FDB', '6E':'IGO',
  UK:'VTI', BA:'BAW', AF:'AFR', KL:'KLM', LX:'SWR', OS:'AUA', SN:'BEL', FR:'RYR',
  W6:'WZZ', U2:'EZY', VY:'VLG', NO:'NOS', A3:'AEE', PC:'PGT', XQ:'SXS',
};

// L'API anonima di OpenSky ha un budget giornaliero e ogni tanto risponde 503.
// Lo snapshot globale viene riusato per SNAP_TTL su questa istanza: più utenti
// che cercano voli diversi nello stesso minuto costano una sola chiamata.
const SNAP_TTL = 45_000;
const FETCH_TIMEOUT = 6_000;
let snapAt = 0, snapData = null, snapPending = null;

async function fetchStates() {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch('https://opensky-network.org/api/states/all', {
      signal: ac.signal,
      headers: { 'User-Agent': 'EasyItaliaHub/1.0 (+https://easyitaliahub.it)' },
    });
    if (!r.ok) throw new Error('opensky ' + r.status);
    return (await r.json()).states || [];
  } finally {
    clearTimeout(timer);
  }
}

async function snapshot() {
  if (snapData && Date.now() - snapAt < SNAP_TTL) return snapData;
  if (!snapPending) {
    snapPending = fetchStates()
      .then((s) => { snapData = s; snapAt = Date.now(); return s; })
      .catch((e) => { console.error('[flight-track] opensky error', e.message); return null; })
      .finally(() => { snapPending = null; });
  }
  return snapPending;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (isRateLimited(clientIp(req), { name: 'flight-track', max: 20 }))
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto.' });

  const raw = String((req.query || {}).fn || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const m = raw.match(/^([A-Z][A-Z0-9])(\d{1,4})$/);
  if (!m) return res.status(400).json({ error: 'Numero di volo non valido. Esempio: UL566' });

  const [, iata, num] = m;
  const prefix = ICAO[iata] || iata;

  const states = await snapshot();
  if (!states) return res.status(200).json({ error: 'service_down', flight: iata + num });

  // Il callsign ADS-B è ICAO+numero, con zeri iniziali variabili (ALK566 / ALK0566).
  const want = new RegExp('^' + prefix + '0*' + num + '$');
  const s = states.find((a) => want.test(String(a[1] || '').trim()));

  // Cache CDN breve: i dati cambiano di continuo ma evita di martellare OpenSky.
  res.setHeader('Cache-Control', 'public, s-maxage=45, stale-while-revalidate=30');

  if (!s) return res.status(200).json({ found: false, flight: iata + num });

  return res.status(200).json({
    found: true,
    flight: iata + num,
    callsign: String(s[1] || '').trim(),
    country: s[2] || null,
    lon: s[5], lat: s[6],
    altitude: s[13] != null ? s[13] : s[7],   // geometrica, fallback barometrica
    velocity: s[9],                            // m/s
    heading: s[10],
    verticalRate: s[11],
    onGround: !!s[8],
    lastContact: s[4] || null,
  });
};
