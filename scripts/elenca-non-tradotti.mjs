/* Elenca, pagina per pagina, i frammenti del corpo che restano in italiano
   nella lingua scelta. E' l'audit visto dal lato di chi deve tradurre: invece
   del conteggio stampa i testi, gia' pronti per finire in traduzioni/.

   Uso: node scripts/elenca-non-tradotti.mjs [base-url] [pagina,...] [lingua]
   Scrive  /tmp/non-tradotti.<lingua>.json  =  { pagina: [testo, ...] }        */
import pw from 'playwright';
const { chromium } = pw;
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:3100';
const PAGINE = process.argv[3]
  ? process.argv[3].split(',')
  : readdirSync('.').filter(f => f.endsWith('.html')).map(f => f.slice(0, -5))
      .filter(n => !['404', 'offline'].includes(n));
const LG = process.argv[4] || 'si';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 1200 }, serviceWorkers: 'block' });
await ctx.addInitScript((l) => {
  try {
    // vale come scelta esplicita: altrimenti vince l'inglese predefinito
    localStorage.setItem('eih-lang', l);
    localStorage.setItem('eih-lang-scelta', '1');
    // Corsi e percorso mostrano il contenuto solo a chi e' iscritto, e le
    // lezioni avanzate solo a chi ha il badge: da visitatore anonimo quei
    // testi non entrano mai nel giro delle traduzioni e restano in italiano
    // a chi il sito lo usa davvero. Qui si guarda la pagina come la vede un
    // iscritto: le lezioni base si leggono, le avanzate mostrano il loro
    // titolo e il motivo per cui sono ancora chiuse.
    localStorage.setItem('eih-registered', '1');
    localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: true, marketing: true }));
  } catch (e) {}
}, LG);
const p = await ctx.newPage();
p.setDefaultTimeout(30000);

const fuori = {};
let totale = 0;
for (const nome of PAGINE) {
  const url = BASE + '/' + (nome === 'index' ? '' : nome);
  try { await p.goto(url, { waitUntil: 'domcontentloaded' }); }
  catch (e) { console.log(nome.padEnd(24), 'CARICAMENTO FALLITO'); continue; }
  await p.waitForTimeout(2600);
  if (!(await p.evaluate(() => !!window.EIHPageI18N))) {
    await p.addScriptTag({ path: resolve('assets/eih-i18n-page.js') }).catch(() => {});
    await p.waitForTimeout(1200);
  }
  const voci = await p.evaluate((lang) => {
    const re = { si: /[඀-෿]/, ta: /[஀-௿]/ }[lang];
    // Stesso metro dell'audit: × e ÷ non sono lettere, e i nomi propri tengono
    // i loro accenti anche una volta tradotta la frase.
    const ACCENTI_IT = /[àèéìíòóùúÀÈÉÌÍÒÓÙÚ]/;
    const senzaNomi = (t) => t.replace(/\p{Lu}[\p{L}'’-]*/gu, ' ');
    const tradotto = (t) => (re ? re.test(t) : !ACCENTI_IT.test(senzaNomi(t)));
    const api = window.EIHPageI18N;
    if (!api) return [];
    const out = [];
    for (const v of api.raccogli()) if (!tradotto(v.testo)) out.push(v.testo);
    return [...new Set(out)];
  }, LG);
  if (voci.length) { fuori[nome] = voci; totale += voci.length; }
  console.log(nome.padEnd(24), String(voci.length).padStart(4), 'da tradurre');
}
writeFileSync('/tmp/non-tradotti.' + LG + '.json', JSON.stringify(fuori, null, 1) + '\n');
console.log('---', totale, 'frammenti in', Object.keys(fuori).length, 'pagine');
await b.close();
