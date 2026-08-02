/* Estrae i frammenti di testo italiano traducibili da ogni pagina.
   Usa lo stesso codice che poi applica le traduzioni nel browser, quindi
   quello che si estrae e quello che si sostituisce coincidono per costruzione.

   Uso:  node scripts/estrai-testi.mjs [base-url] [pagina,pagina,...]
   Scrive  i18n-src/<pagina>.json  =  { impronta: "testo italiano" }         */
import pw from 'playwright';   // in questo contenitore: /opt/node22/lib/node_modules/playwright
const { chromium } = pw;
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:3100';
const PAGINE = process.argv[3]
  ? process.argv[3].split(',')
  : readdirSync('.').filter(f => f.endsWith('.html')).map(f => f.slice(0, -5))
      .filter(n => !['404', 'offline'].includes(n));

mkdirSync('i18n-src', { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 1400 }, serviceWorkers: 'block' });
// La tipografia cinetica spezza i titoli in una <span> per parola. In italiano
// non c'e' nessun traduttore da aspettare, quindi lo fa subito e l'estrazione
// registrerebbe «Aprire | un | conto» invece del titolo intero: impronte che
// nessuna traduzione potra' mai agganciare. Qui il movimento non serve.
await ctx.route('**/eih-motion.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('eih-lang', 'it');
    localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: true, marketing: true }));
  } catch (e) {}
});
const p = await ctx.newPage();
p.setDefaultTimeout(30000);

let totale = 0;
for (const nome of PAGINE) {
  const url = BASE + '/' + (nome === 'index' ? '' : nome);
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (e) { console.log(nome.padEnd(24), 'CARICAMENTO FALLITO'); continue; }
  await p.waitForTimeout(2200);
  await p.addScriptTag({ path: resolve('assets/eih-i18n-page.js') });
  const voci = await p.evaluate(() => {
    const api = window.EIHPageI18N;
    const out = {};
    for (const v of api.raccogli()) out[api.impronta(v.testo)] = v.testo;
    return out;
  });
  const n = Object.keys(voci).length;
  totale += n;
  writeFileSync('i18n-src/' + nome + '.json', JSON.stringify(voci, null, 1) + '\n');
  console.log(nome.padEnd(24), String(n).padStart(4), 'frammenti');
}
console.log('---', totale, 'frammenti in', PAGINE.length, 'pagine');
await b.close();
