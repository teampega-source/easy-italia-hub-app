#!/usr/bin/env node
/* Quante funzioni serverless stiamo per spedire? (limite Hobby: 12)
 *
 * Serve perché il conto non lo fa nessuno prima del deploy: la costruzione
 * riesce, e Vercel si ferma dopo, al passo `patchBuild`, con
 * exceeded_serverless_functions_per_deployment. È esattamente quello che è
 * successo il 25 agosto 2026: due file nuovi in api/, sei distribuzioni di
 * produzione fallite di fila e il sito fermo per giorni senza che niente
 * gridasse. Il fallimento era silenzioso solo perché nessuno contava.
 *
 * Cosa conta come funzione: ogni file .js/.mjs/.ts in api/ che non comincia
 * per _ (quelli sono moduli condivisi, non rotte). Non conta se dichiara
 * `runtime: 'edge'`: le funzioni Edge stanno fuori dal limite.
 *
 *   node scripts/conta-funzioni.mjs        elenca e esce 1 se si sfora
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const LIMITE = 12;                  // piano Hobby, per distribuzione
const CARTELLA = new URL('../api/', import.meta.url).pathname;

const rotte = readdirSync(CARTELLA)
  .filter((f) => /\.(js|mjs|ts)$/.test(f) && !f.startsWith('_'))
  .sort();

const edge = [];
const serverless = [];
for (const f of rotte) {
  const src = readFileSync(join(CARTELLA, f), 'utf8');
  /* La dichiarazione vale solo se è esportata: un `runtime: 'edge'` dentro un
     oggetto qualunque non sposta niente, e contarlo darebbe un via libera falso. */
  (/export\s+const\s+config\s*=\s*{[^}]*runtime:\s*['"]edge['"]/s.test(src) ? edge : serverless).push(f);
}

for (const f of serverless) console.log('  serverless  ' + f);
for (const f of edge) console.log('  edge        ' + f);
console.log(`\nserverless: ${serverless.length}/${LIMITE} · edge (fuori conto): ${edge.length}`);

if (serverless.length > LIMITE) {
  console.error(
    `\nERRORE: ${serverless.length} funzioni serverless, il massimo su Hobby è ${LIMITE}.\n` +
    'La distribuzione fallirà con exceeded_serverless_functions_per_deployment.\n' +
    "Rimedio: sposta una rotta su Edge (export const config = { runtime: 'edge' },\n" +
    'esporta un handler Request→Response — vedi api/og.mjs o api/salute.mjs).'
  );
  process.exit(1);
}
if (serverless.length === LIMITE) {
  console.log('Sei esattamente al limite: la prossima rotta serverless rompe il deploy.');
}
