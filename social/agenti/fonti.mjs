/* Scout — ma sulle nostre fonti verificate, non sul web aperto.
 *
 * La specifica (§4) vuole uno Scout che trovi discussioni e gruppi dove la
 * comunità chiede aiuto. Quella parte ha bisogno dei permessi Meta, che si
 * ottengono con una app verificata: finché non ci sono, uno Scout che finge
 * di leggere Facebook produrrebbe opportunità inventate — il difetto peggiore
 * di tutti, perché sembra che funzioni.
 *
 * Quindi qui lo Scout fa una cosa vera e utile fin da subito: pesca dai
 * contenuti che abbiamo già verificato — le guide con la loro fascia di fonti,
 * gli avvisi ufficiali del Consolato, le sezioni dei percorsi — e li ordina per
 * quanto valgono per chi legge. Ogni opportunità porta con sé la fonte, che è
 * la condizione posta al §7.
 *
 * Quando i permessi Meta arriveranno, questo file guadagna una seconda sorgente
 * e il resto della catena non cambia di una riga.                            */

import { readFileSync, existsSync } from 'node:fs';
import { temaRegolato } from '../lib/marca.mjs';
import { SITO } from '../lib/marca.mjs';

const RADICE = new URL('../../', import.meta.url).pathname;

function leggi(f) {
  const p = RADICE + f;
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

/* ── 1 · gli avvisi del Consolato ────────────────────────────────────────
   Autorizzati da loro, aggiornati ogni lunedì dal lavoro automatico. Sono la
   cosa più vicina a una notizia che questa pagina possa pubblicare. */
function avvisiConsolato() {
  const src = leggi('assets/eih-avvisi-consolato.js');
  const m = src.match(/voci:\s*\[([\s\S]*?)\n\s*\]/);
  if (!m) return [];
  const voci = [];
  for (const riga of m[1].split('\n')) {
    const t = riga.match(/"titolo"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const u = riga.match(/"url"\s*:\s*"([^"]+)"/);
    if (t && u) voci.push({
      tipo: 'avviso-consolato',
      titolo: JSON.parse('"' + t[1] + '"'),
      fonte: u[1],
      fonteNome: 'Consolato Generale dello Sri Lanka a Milano',
      valore: 9,
    });
  }
  return voci;
}

/* ── 2 · le sezioni delle guide ──────────────────────────────────────────
   Ogni sezione ha un'ancora, quindi un indirizzo suo: un post può portare
   esattamente al paragrafo che risponde, non alla pagina intera. */
function sezioniGuida() {
  const html = leggi('guide.html');
  const fuori = [];
  const re = /<section id="([a-z0-9-]+)"[^>]*>\s*<h2[^>]*>([^<]+)<\/h2>/g;
  let m;
  while ((m = re.exec(html))) {
    const titolo = m[2].replace(/^\d+\.\s*/, '').trim();
    fuori.push({
      tipo: 'guida',
      titolo,
      fonte: `${SITO}/guide#${m[1]}`,
      fonteNome: 'Easy Italia Hub — guida verificata',
      valore: temaRegolato(titolo) ? 8 : 6,
    });
  }
  return fuori;
}

/* ── 3 · le pagine-strumento ─────────────────────────────────────────────
   Non sono letture: sono cose che si fanno. Un post che dice «fai questo in
   due minuti» rende più di uno che dice «leggi questo». */
const STRUMENTI = [
  { titolo: 'Bacheca lavoro con annunci controllati', percorso: '/lavoro', valore: 9 },
  { titolo: 'Mappa di CAF, patronati e templi in 22 città', percorso: '/mappa', valore: 8 },
  { titolo: 'Lettere e moduli pronti da scaricare', percorso: '/moduli', valore: 8 },
  { titolo: 'Curriculum in formato italiano, gratis', percorso: '/cv-builder', valore: 8 },
  { titolo: 'Il tuo percorso: dall\'arrivo alla cittadinanza', percorso: '/percorso', valore: 9 },
  { titolo: 'Promemoria delle scadenze del permesso', percorso: '/permesso-tracker', valore: 9 },
  { titolo: 'Assistente che risponde in sinhala e tamil, giorno e notte', percorso: '/percorso', valore: 7 },
];

function strumenti() {
  return STRUMENTI.map((s) => ({
    tipo: 'strumento',
    titolo: s.titolo,
    fonte: SITO + s.percorso,
    fonteNome: 'Easy Italia Hub',
    valore: s.valore,
  }));
}

/* Il punteggio della specifica (§4), con i pezzi che qui hanno un senso:
   quanto vale per chi legge, quanto è nostro il tema, quanto è fresco.
   Niente engagement: non lo conosciamo ancora, e inventarlo sarebbe peggio. */
export function punteggio(o) {
  let p = o.valore || 5;
  if (temaRegolato(o.titolo)) p += 2;          // è il motivo per cui la gente ci cerca
  if (o.tipo === 'avviso-consolato') p += 1;   // è ufficiale, e non lo pubblica nessun altro in sinhala
  if (!o.fonte) p -= 5;                        // senza fonte non si pubblica: che resti evidente
  return Math.max(0, Math.min(10, p));
}

export function opportunita({ quante = 6 } = {}) {
  const tutte = [...avvisiConsolato(), ...sezioniGuida(), ...strumenti()]
    .map((o) => ({ ...o, punteggio: punteggio(o) }))
    .sort((a, b) => b.punteggio - a.punteggio);

  /* Un giro di calendario: se si pescasse sempre dalla cima, il primo mese
     uscirebbero sette post sul permesso di soggiorno e nient'altro. Il giorno
     dell'anno fa da rotazione — deterministico, quindi ripetibile in prova. */
  const giorno = Math.floor(Date.now() / 86400000);
  const scelte = [];
  const perTipo = {};
  for (let i = 0; i < tutte.length && scelte.length < quante; i++) {
    const o = tutte[(i + giorno) % tutte.length];
    perTipo[o.tipo] = (perTipo[o.tipo] || 0) + 1;
    if (perTipo[o.tipo] > Math.ceil(quante / 2)) continue;  // niente monocoltura
    if (scelte.some((s) => s.titolo === o.titolo)) continue;
    scelte.push(o);
  }
  return scelte;
}
