/* I font per i video, in un posto solo.

   Tre script montano video con i caratteri del sito, e ognuno si era portato
   dietro la sua copia di questa funzione. Alla terza copia si smette.

   Clash Grotesk e Satoshi arrivano da fontshare, come su ogni pagina; il
   singalese e il tamil dai Noto di Google, che non stanno nel repo. Tutto
   finisce in .cache-font/ al primo giro e non si scarica piu'.               */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(RADICE, '.cache-font');

const SITO = 'https://api.fontshare.com/v2/css?f[]=clash-grotesk@500,600,700&f[]=satoshi@400,500,700&display=swap';
const NOTO = {
  si: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&display=swap',
  ta: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap',
};
const AGENTE = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

async function scarica(url, dove) {
  if (existsSync(dove)) return readFileSync(dove);
  const r = await fetch(url, { headers: { 'User-Agent': AGENTE } });
  if (!r.ok) throw new Error('font non scaricato: ' + url + ' → ' + r.status);
  const b = Buffer.from(await r.arrayBuffer());
  writeFileSync(dove, b);
  return b;
}

const faccia = (fam, peso, buf) =>
  `@font-face{font-family:'${fam}';font-weight:${peso};font-display:block;` +
  `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`;

/* Restituisce il CSS con i font incorporati, pronto da infilare in <style>.
   `scritture`: quali Noto servono, es. ['si','ta']. Vuoto = solo i font del sito. */
export async function fontIncorporati(scritture = ['si', 'ta']) {
  mkdirSync(CACHE, { recursive: true });
  const pezzi = [];

  const css = (await scarica(SITO, path.join(CACHE, 'fontshare.css'))).toString();
  for (const blocco of [...css.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0])) {
    const fam = (blocco.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1];
    const peso = (blocco.match(/font-weight:\s*(\d+)/) || [])[1];
    // fontshare scrive gli indirizzi senza protocollo e fra apici
    let url = (blocco.match(/url\(['"]?((?:https:)?\/\/[^'")]+\.woff2)['"]?\)/) || [])[1];
    if (url && url.startsWith('//')) url = 'https:' + url;
    if (!fam || !peso || !url) continue;
    if (!/Clash Grotesk|Satoshi/i.test(fam)) continue;
    const b = await scarica(url, path.join(CACHE, `${fam.replace(/\s+/g, '')}-${peso}.woff2`));
    pezzi.push(faccia(fam.trim(), peso, b));
  }
  if (!pezzi.length) throw new Error('nessun font del sito scaricato da fontshare');

  for (const lg of scritture) {
    if (!NOTO[lg]) continue;
    const foglio = (await scarica(NOTO[lg], path.join(CACHE, `noto-${lg}.css`))).toString();
    // il primo blocco e' il sottoinsieme della scrittura, ed e' l'unico che serve
    const urls = [...foglio.matchAll(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g)].map((m) => m[0]);
    const fam = lg === 'si' ? 'Noto Sans Sinhala' : 'Noto Sans Tamil';
    for (let i = 0; i < Math.min(2, urls.length); i++) {
      const b = await scarica(urls[i], path.join(CACHE, `noto-${lg}-${i}.woff2`));
      pezzi.push(faccia(fam, 400, b), faccia(fam, 700, b));
    }
  }
  return pezzi.join('\n');
}

/* La famiglia da mettere davanti alle altre per una data lingua. */
export function famigliaLocale(lg) {
  return lg === 'si' ? `'Noto Sans Sinhala',` : lg === 'ta' ? `'Noto Sans Tamil',` : '';
}
