#!/usr/bin/env node
/**
 * Segnala a IndexNow le pagine appena cambiate.
 *
 * IndexNow è il canale gratuito e senza account con cui un sito dice ai motori
 * di ricerca "questa pagina è cambiata, vieni a rivederla". Lo leggono Bing,
 * Yandex, Naver e Seznam; Google continua per la sua strada, ma le pagine qui
 * elencate restano le stesse della sitemap, quindi non si perde niente.
 *
 * La chiave è pubblica per progetto: un file <chiave>.txt nella radice del
 * sito che contiene la chiave stessa. Serve a dimostrare che il sito è tuo.
 * Lo script la trova da solo fra i file della radice (oppure usa INDEXNOW_KEY).
 *
 * Uso:
 *   node scripts/indexnow.mjs            # pagine cambiate negli ultimi 3 giorni
 *   GIORNI=7 node scripts/indexnow.mjs   # finestra più larga
 *   node scripts/indexnow.mjs --tutte    # tutte le pagine della sitemap
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITO = 'https://easyitaliahub.it';
const GIORNI = Number(process.env.GIORNI || 3);
const TUTTE = process.argv.includes('--tutte');

async function trovaChiave() {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim();
  const file = (await readdir(RADICE)).filter((n) => /^[a-f0-9]{32}\.txt$/.test(n));
  if (!file.length) return null;
  return (await readFile(join(RADICE, file[0]), 'utf8')).trim();
}

function urlDellaSitemap(xml) {
  const out = [];
  for (const b of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
    const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lastmod = (b.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || '';
    if (loc) out.push({ loc, lastmod });
  }
  return out;
}

async function main() {
  const chiave = await trovaChiave();
  if (!chiave) {
    console.error('Chiave IndexNow assente: manca il file <chiave>.txt nella radice.');
    process.exit(1);
  }

  const xml = await readFile(join(RADICE, 'sitemap.xml'), 'utf8');
  const limite = new Date(Date.now() - GIORNI * 86400000).toISOString().slice(0, 10);
  const scelte = urlDellaSitemap(xml).filter((u) => TUTTE || (u.lastmod && u.lastmod >= limite));

  if (!scelte.length) {
    console.log(`Nessuna pagina cambiata negli ultimi ${GIORNI} giorni: niente da segnalare.`);
    return;
  }

  const urlList = scelte.map((u) => u.loc);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'easyitaliahub.it',
      key: chiave,
      keyLocation: `${SITO}/${chiave}.txt`,
      urlList,
    }),
    signal: AbortSignal.timeout(20000),
  });

  console.log(`IndexNow: ${urlList.length} URL inviate, risposta ${res.status}`);
  // 200 = accettate, 202 = accettate ma in verifica della chiave.
  if (![200, 202].includes(res.status)) {
    console.error(await res.text().catch(() => ''));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Errore IndexNow:', e);
  process.exit(1);
});
