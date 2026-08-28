#!/usr/bin/env node
/* Il giro quotidiano dell'agente (spec §14 e §15).
 *
 *   node social/cli.mjs                 # bozze di oggi + rapporto
 *   node social/cli.mjs --quante 3      # meno roba
 *   node social/cli.mjs --lingue si,it  # solo due lingue
 *   node social/cli.mjs --commenti      # legge i commenti dei nostri post (serve token Meta)
 *   node social/cli.mjs --email         # manda il rapporto via Resend
 *
 * Cosa produce, in social/coda/AAAA-MM-GG/:
 *   bozze.json      tutto, con i controlli di sicurezza pezzo per pezzo
 *   rapporto.md     da leggere: le bozze pronte da copiare, in quattro lingue
 *
 * Niente pubblicazione automatica. La coda è una coda di approvazione: si
 * legge, si sceglie, si pubblica. La specifica lo chiede al §12 e resta la
 * scelta giusta anche quando i permessi Meta arriveranno.                    */

import { mkdirSync, writeFileSync } from 'node:fs';
import { opportunita } from './agenti/fonti.mjs';
import { pacchetti } from './agenti/contenuto.mjs';
import { registro, disponibile } from './lib/ai.mjs';
import { NOME_LINGUA, LINGUE } from './lib/marca.mjs';
import { stato as statoMeta, commenti as commentiMeta } from './connettori/meta.mjs';
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
console.log('modello:', disponibile() ? 'collegato' : 'ASCIUTTO (senza GEMINI_API_KEY: bozze grezze)');
console.log('Meta   :', statoMeta().collegato ? 'collegato' : 'non collegato — ' + statoMeta().motivo);
console.log('lingue :', lingue.map((l) => NOME_LINGUA[l] || l).join(', '), '\n');

const opp = opportunita({ quante });
console.log('Opportunità di oggi:');
for (const o of opp) console.log(`  [${String(o.punteggio).padStart(2)}] ${o.tipo.padEnd(18)} ${o.titolo.slice(0, 64)}`);
console.log();

const bozze = await pacchetti(opp, { lingue });

let commenti = null;
if (arg('commenti')) {
  try {
    const c = await commentiMeta();
    commenti = c.voci;
    console.log('commenti letti:', commenti.length);
  } catch (e) {
    console.error('lettura commenti fallita:', e.message);
  }
}

mkdirSync(cartella, { recursive: true });
writeFileSync(cartella + 'bozze.json', JSON.stringify({ oggi, opportunita: opp, bozze, commenti, ai: registro }, null, 2));
const md = scriviRapporto({ oggi, bozze, commenti, lingue });
writeFileSync(cartella + 'rapporto.md', md);

/* Il conto di cosa passerebbe e cosa no: è il numero che dice se l'agente sta
   lavorando bene, molto più del numero di bozze prodotte. */
let ok = 0, rivedere = 0, scartati = 0;
for (const b of bozze) for (const lg of Object.keys(b.lingue))
  for (const v of Object.values(b.lingue[lg].verifiche)) {
    if (v.modalita === 'scartato') scartati++;
    else if (v.modalita === 'revisione') rivedere++;
    else ok++;
  }

console.log('\nscritto', cartella);
console.log(`pezzi: ${ok + rivedere + scartati} · pronti ${ok} · da rivedere ${rivedere} · scartati ${scartati}`);

if (arg('email')) {
  const esito = await mandaRapporto(md, oggi);
  console.log('rapporto via email:', esito);
}
