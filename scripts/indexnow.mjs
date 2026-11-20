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
 *   FILE_CAMBIATI="a.html\nb.html" node scripts/indexnow.mjs   # dal push
 *   node scripts/indexnow.mjs            # pagine cambiate negli ultimi 3 giorni
 *   GIORNI=7 node scripts/indexnow.mjs   # finestra più larga
 *   node scripts/indexnow.mjs --tutte    # tutte le pagine della sitemap
 *
 * Il modo giusto è il primo: il lastmod della sitemap può essere vecchio
 * anche quando una pagina cambia davvero, e allora IndexNow non segnalerebbe
 * niente. Con i file del push si manda esattamente quello che è cambiato,
 * comprese le quattro lingue della stessa pagina.
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
    const it = (b.match(/hreflang="it"\s+href="([^"]+)"/) || [])[1] || loc;
    if (loc) out.push({ loc, lastmod, it });
  }
  return out;
}

// Da "srilankadirectory.html" a tutte le URL della pagina, in ogni lingua.
function urlDaFile(voci, file) {
  const base = file.replace(/^.*\//, '').replace(/\.html$/, '');
  const percorso = base === 'index' ? '/' : '/' + base;
  const dellaPagina = voci.filter((v) => {
    try { return new URL(v.it).pathname === percorso; } catch { return false; }
  });
  if (dellaPagina.length) return dellaPagina.map((v) => v.loc);
  // Alcune lingue hanno slug diversi: se la pagina italiana non si trova,
  // ripiego su una corrispondenza per nome file.
  return voci.filter((v) => v.loc.split('/').pop() === base).map((v) => v.loc);
}

async function main() {
  const chiave = await trovaChiave();
  if (!chiave) {
    console.error('Chiave IndexNow assente: manca il file <chiave>.txt nella radice.');
    process.exit(1);
  }

  const xml = await readFile(join(RADICE, 'sitemap.xml'), 'utf8');
  const voci = urlDellaSitemap(xml);

  const cambiati = (process.env.FILE_CAMBIATI || '')
    .split(/\r?\n/)
    .map((f) => f.trim())
    .filter((f) => f.endsWith('.html'));

  let urlList;
  if (cambiati.length) {
    const insieme = new Set();
    for (const file of cambiati) {
      for (const u of urlDaFile(voci, file)) insieme.add(u);
    }
    urlList = [...insieme];
    console.log(`File cambiati nel push: ${cambiati.length}, URL ricavate: ${urlList.length}`);
  } else {
    const limite = new Date(Date.now() - GIORNI * 86400000).toISOString().slice(0, 10);
    urlList = voci.filter((u) => TUTTE || (u.lastmod && u.lastmod >= limite)).map((u) => u.loc);
  }

  if (!urlList.length) {
    console.log('Nessuna pagina da segnalare: niente da fare.');
    return;
  }

  urlList = urlList.slice(0, 10000);
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
