/* Controlla che il sito si presenti in inglese a chi non ha mai scelto una
   lingua: nessun localStorage, come un visitatore nuovo.

   Misura due cose:
     1. che lingua risulta attiva (EIH_LANG, <html lang>, dizionario montato)
     2. quanto italiano resta visibile in <main> dopo la traduzione

   Uso: node scripts/audit-lingua-predefinita.mjs [base-url] [pagina,...]      */
import pw from 'playwright';
const { chromium } = pw;
import { readdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3100';
const PAGINE = process.argv[3]
  ? process.argv[3].split(',')
  : readdirSync('.').filter(f => f.endsWith('.html')).map(f => f.slice(0, -5))
      .filter(n => !['404', 'offline'].includes(n));

const b = await chromium.launch();
let guasti = 0;
for (const nome of PAGINE) {
  // contesto nuovo per ogni pagina: nessuna preferenza si trascina dietro
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1200 }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.setDefaultTimeout(30000);
  const url = BASE + '/' + (nome === 'index' ? '' : nome);
  try { await p.goto(url, { waitUntil: 'domcontentloaded' }); }
  catch (e) { console.log(nome.padEnd(22), 'CARICAMENTO FALLITO'); guasti++; await ctx.close(); continue; }
  await p.waitForTimeout(2800);

  const r = await p.evaluate(() => {
    // l'italiano si riconosce dalle vocali accentate, saltando i nomi propri
    const senzaNomi = (t) => t.replace(/\p{Lu}[\p{L}'’-]*/gu, ' ');
    const ACCENTI_IT = /[àèéìíòóùúÀÈÉÌÍÒÓÙÚ]/;
    // Cio' che e' marcato data-no-tr resta in italiano di proposito: il
    // frasario medico e' fatto di frasi da far leggere al medico italiano,
    // tradurle svuoterebbe lo strumento. Si nasconde e si rimette a posto:
    // innerText vuole il nodo attaccato al documento per calcolare il testo
    // come lo vede l'utente, quindi non si puo' lavorare su una copia.
    const main = document.querySelector('main') || document.body;
    const nascosti = [...main.querySelectorAll('[data-no-tr]')].map(el => [el, el.style.display]);
    nascosti.forEach(([el]) => { el.style.display = 'none'; });
    const frasi = (main.innerText || '').split('\n').map(s => s.trim()).filter(s => s.length > 12);
    nascosti.forEach(([el, d]) => { el.style.display = d; });
    const italiane = frasi.filter(s => ACCENTI_IT.test(senzaNomi(s)));
    return {
      eihLang: window.EIH_LANG || '—',
      htmlLang: document.documentElement.lang || '—',
      salvata: (function () { try { return localStorage.getItem('eih-lang') || '—'; } catch (e) { return '?'; } })(),
      scelta: (function () { try { return localStorage.getItem('eih-lang-scelta') || '—'; } catch (e) { return '?'; } })(),
      frasi: frasi.length,
      italiane: italiane.length,
      esempi: italiane.slice(0, 2).map(s => s.slice(0, 46))
    };
  });

  // La lingua salvata deve restare vuota: chi non sceglie non lascia tracce,
  // altrimenti domani non si distingue piu' da chi ha scelto davvero.
  const male = r.eihLang !== 'en' || r.htmlLang !== 'en' || r.salvata !== '—' || r.scelta !== '—' || r.italiane > 0;
  if (male) guasti++;
  console.log(
    nome.padEnd(22),
    ('EIH_LANG=' + r.eihLang).padEnd(14),
    ('<html lang>=' + r.htmlLang).padEnd(17),
    ('salvata=' + r.salvata).padEnd(13),
    (r.italiane + '/' + r.frasi + ' frasi italiane').padEnd(24),
    male ? '✗ ' + r.esempi.join(' | ') : 'ok');
  await ctx.close();
}
await b.close();
console.log(guasti ? `\n${guasti} pagine da sistemare` : '\nIl sito parte in inglese su tutte le pagine.');
process.exit(guasti ? 1 : 0);
