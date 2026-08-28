#!/usr/bin/env node
/* Il giro quotidiano dell'agente (spec §14 e §15).
 *
 *   node social/cli.mjs                  # bozze + messaggi per i gruppi + rapporto
 *   node social/cli.mjs --quante 3       # meno roba
 *   node social/cli.mjs --lingue si,it   # solo due lingue
 *   node social/cli.mjs --commenti       # legge i commenti dei nostri post (serve token Meta)
 *   node social/cli.mjs --pubblica       # pubblica sulla Pagina, se tutti i cancelli sono aperti
 *   node social/cli.mjs --email          # manda il rapporto
 *
 * Tre livelli, e la differenza è tutta qui:
 *   · la Pagina lavora da sola  → --pubblica, con SOCIAL_AUTOPUBBLICA=1
 *   · i commenti: risposte fisse automatiche, domande vere in coda
 *   · i gruppi: pronti da incollare, sempre. Non esiste API, non c'è scampo.  */

import { mkdirSync, writeFileSync } from 'node:fs';
import { opportunita } from './agenti/fonti.mjs';
import { pacchetti } from './agenti/contenuto.mjs';
import { risposte as rispostePer } from './agenti/comunita.mjs';
import { messaggi as messaggiGruppi } from './agenti/gruppi.mjs';
import { registro, disponibile } from './lib/ai.mjs';
import { leggi as leggiMemoria, scrivi as scriviMemoria, segnaGruppo } from './lib/registro.mjs';
import { NOME_LINGUA, LINGUE } from './lib/marca.mjs';
import { stato as statoMeta, commenti as commentiMeta } from './connettori/meta.mjs';
import { pubblicaDelGiorno, mandaRisposteAuto, acceso } from './pubblica.mjs';
import { scrivi as scriviRapporto, manda as mandaRapporto } from './rapporto.mjs';

const arg = (nome, pre) => {
  const i = process.argv.indexOf('--' + nome);
  if (i < 0) return pre;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

const quante = Number(arg('quante', 5));
const lingue = String(arg('lingue', LINGUE.join(','))).split(',').filter(Boolean);
const oggi = new Date().toISOString().slice(0, 10);
const cartella = new URL('./coda/' + oggi + '/', import.meta.url).pathname;

console.log('Easy Italia Hub — agente social ·', oggi);
console.log('modello    :', disponibile() ? 'collegato' : 'ASCIUTTO (senza GEMINI_API_KEY: bozze grezze)');
console.log('Meta       :', statoMeta().collegato ? 'collegato' : 'non collegato — ' + statoMeta().motivo);
console.log('pubblica da solo:', acceso() ? 'SÌ' : 'no (SOCIAL_AUTOPUBBLICA non è 1)');
console.log('lingue     :', lingue.map((l) => NOME_LINGUA[l] || l).join(', '), '\n');

const opp = opportunita({ quante });
console.log('Opportunità di oggi:');
for (const o of opp) console.log(`  [${String(o.punteggio).padStart(2)}] ${o.tipo.padEnd(18)} ${o.titolo.slice(0, 64)}`);
console.log();

const bozze = await pacchetti(opp, { lingue });

/* ── commenti sotto i nostri post ─────────────────────────────────────── */
let commenti = null, risposte = null, esitoRisposte = null;
if (arg('commenti')) {
  try {
    const c = await commentiMeta();
    commenti = c.voci;
    if (commenti.length) {
      risposte = await rispostePer(commenti);
      console.log(`commenti letti: ${commenti.length} · risposte fisse pronte: ${risposte.filter((r) => r.modalita === 'auto').length}`);
      esitoRisposte = await mandaRisposteAuto(risposte);
      if (esitoRisposte.inviate) console.log('risposte inviate da sole:', esitoRisposte.inviate);
    } else {
      console.log('nessun commento nuovo');
    }
  } catch (e) {
    console.error('lettura commenti fallita:', e.message);
  }
}

/* ── i gruppi: pronti da incollare ────────────────────────────────────── */
const memoria = leggiMemoria();
const gruppi = await messaggiGruppi(opp, memoria);
if (gruppi.senzaElenco) {
  console.log('gruppi: nessun elenco. Copia social/gruppi.esempio.json in social/gruppi.json');
} else {
  console.log(`gruppi di oggi: ${gruppi.messaggi.length}${gruppi.saltati.length ? ` · in pausa: ${gruppi.saltati.length}` : ''}`);
  /* Il gruppo si segna quando il messaggio viene proposto, non quando viene
     incollato: non possiamo sapere se l'hai incollato. Se salti un gruppo lo
     ritrovi fra sette giorni, e nel frattempo l'agente non te lo ripropone
     ogni mattina — che è il modo più veloce per farti scrivere due volte. */
  for (const m of gruppi.messaggi) segnaGruppo(memoria, m.gruppo.id);
  scriviMemoria(memoria);
}

/* ── la Pagina, se le è stato dato il permesso ────────────────────────── */
let pubblicazione = null;
if (arg('pubblica')) {
  pubblicazione = await pubblicaDelGiorno(bozze);
  console.log('pubblicazione:', pubblicazione.fatto ? `fatta — ${pubblicazione.titolo}` : 'no — ' + pubblicazione.motivo);
}

mkdirSync(cartella, { recursive: true });
writeFileSync(cartella + 'bozze.json', JSON.stringify(
  { oggi, opportunita: opp, bozze, commenti, risposte, gruppi, pubblicazione, ai: registro }, null, 2));
const md = scriviRapporto({ oggi, bozze, commenti, risposte, gruppi, pubblicazione, lingue });
writeFileSync(cartella + 'rapporto.md', md);

let ok = 0, rivedere = 0, scartati = 0;
for (const b of bozze) for (const lg of Object.keys(b.lingue))
  for (const v of Object.values(b.lingue[lg].verifiche)) {
    if (v.modalita === 'scartato') scartati++;
    else if (v.modalita === 'revisione') rivedere++;
    else ok++;
  }

console.log('\nscritto', cartella);
console.log(`pezzi: ${ok + rivedere + scartati} · pronti ${ok} · da rivedere ${rivedere} · scartati ${scartati}`);

if (arg('email')) console.log('rapporto via email:', await mandaRapporto(md, oggi));
