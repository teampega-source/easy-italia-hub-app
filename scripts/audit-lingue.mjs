/* Controllo incrociato delle traduzioni: ogni pagina in ogni lingua.

   Per ciascuna combinazione misura tre cose diverse, che si guastano in modi
   diversi:
     1. chiavi data-i18n rimaste in italiano (dizionario di eih.js o di pagina)
     2. frammenti del corpo non coperti dal dizionario di /assets/i18n/
     3. quanto testo latino resta visibile in <main> (il sintomo che vede l'utente)

   Uso: node scripts/audit-lingue.mjs [base-url] [pagina,...] [lingua,...]      */
import pw from 'playwright';
const { chromium } = pw;
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:3100';
const PAGINE = process.argv[3]
  ? process.argv[3].split(',')
  : readdirSync('.').filter(f => f.endsWith('.html')).map(f => f.slice(0, -5))
      .filter(n => !['404', 'offline'].includes(n));
const LINGUE = (process.argv[4] || 'en,si,ta').split(',');

const SCRITTURA = { si: /[඀-෿]/, ta: /[஀-௿]/ };
const b = await chromium.launch();
const esito = [];

for (const lg of LINGUE) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1200 }, serviceWorkers: 'block' });
  await ctx.addInitScript((l) => {
    try {
      localStorage.setItem('eih-lang', l);
      localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: true, marketing: true }));
    } catch (e) {}
  }, lg);
  const p = await ctx.newPage();
  p.setDefaultTimeout(30000);

  for (const nome of PAGINE) {
    const url = BASE + '/' + (nome === 'index' ? '' : nome);
    try { await p.goto(url, { waitUntil: 'domcontentloaded' }); }
    catch (e) { esito.push({ lg, nome, errore: 'caricamento' }); continue; }
    await p.waitForTimeout(2600);
    // eih-i18n-page.js si carica da solo fuori dall'italiano; se manca lo aggiungo
    if (!(await p.evaluate(() => !!window.EIHPageI18N))) {
      await p.addScriptTag({ path: resolve('assets/eih-i18n-page.js') }).catch(() => {});
      await p.waitForTimeout(1200);
    }

    const r = await p.evaluate((lang) => {
      const re = { si: /[඀-෿]/, ta: /[஀-௿]/ }[lang];
      // In inglese la spia dell'italiano rimasto sono le vocali accentate. Due
      // classi di stringa non c'entrano e vanno tolte prima del confronto:
      //   · × e ÷ stanno nello stesso tratto Latin-1 ma non sono lettere
      //     («Sworn translations (3 docs × €80)» e' gia' inglese);
      //   · i nomi propri tengono i loro accenti anche tradotti
      //     («Abarekà Nandree (non-profit) — Via Venini, Milan»).
      // Si guardano solo le vocali accentate che l'italiano usa davvero: la û
      // di «vesak kûdu» e' una traslitterazione dal singalese, non italiano.
      const ACCENTI_IT = /[àèéìíòóùúÀÈÉÌÍÒÓÙÚ]/;
      const senzaNomi = (t) => t.replace(/\p{Lu}[\p{L}'’-]*/gu, ' ');
      const tradotto = (t) => (re ? re.test(t) : !ACCENTI_IT.test(senzaNomi(t)));

      // 1. chiavi data-i18n ferme all'italiano
      // Un elemento con data-i18n e data-no-tr insieme dichiara che il valore
      // resta com'e' di proposito (SPID, SIM / eSIM, nomi di programmi).
      const chiavi = [...document.querySelectorAll('[data-i18n],[data-i18n-html]')]
        .filter(el => !el.closest('[data-no-tr]'));
      const ferme = [];
      for (const el of chiavi) {
        const k = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-html');
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length < 3 || /^[\d\s€%.,:/–—-]+$/.test(t)) continue;
        if (!tradotto(t)) ferme.push(k + ' → ' + t.slice(0, 30));
      }

      // 2. frammenti del corpo non tradotti
      const api = window.EIHPageI18N;
      let corpoTot = 0, corpoFermi = 0;
      const esempiCorpo = [];
      if (api) {
        for (const v of api.raccogli()) {
          corpoTot++;
          if (!tradotto(v.testo)) {
            corpoFermi++;
            if (esempiCorpo.length < 3) esempiCorpo.push(v.testo.slice(0, 40));
          }
        }
      }

      // 3. sintomo visibile: parole latine in main
      const main = document.querySelector('main') || document.body;
      const parole = (main.innerText || '').split(/\s+/).filter(w => w.length > 3);
      const latine = parole.filter(w => /^[A-Za-zÀ-ÿ'’]+$/.test(w));

      return {
        chiaviTot: chiavi.length, chiaviFerme: ferme.length, esempiChiavi: ferme.slice(0, 3),
        corpoTot, corpoFermi, esempiCorpo,
        parole: parole.length, latine: latine.length,
        avviso: !!document.getElementById('eih-tr-avviso')
      };
    }, lg);
    esito.push({ lg, nome, ...r });
  }
  await ctx.close();
}
await b.close();

writeFileSync('/tmp/audit-lingue.json', JSON.stringify(esito, null, 1));

for (const lg of LINGUE) {
  const righe = esito.filter(e => e.lg === lg && !e.errore);
  righe.sort((a, b2) => (b2.corpoFermi + b2.chiaviFerme) - (a.corpoFermi + a.chiaviFerme));
  console.log('\n═══ ' + lg.toUpperCase() + ' ═══');
  console.log('pagina'.padEnd(22), 'chiavi ferme', ' corpo non tradotto', ' latino in main', ' avviso');
  for (const r of righe) {
    if (!r.chiaviFerme && !r.corpoFermi) continue;
    const perc = r.parole ? Math.round(r.latine * 100 / r.parole) : 0;
    console.log(
      r.nome.padEnd(22),
      String(r.chiaviFerme + '/' + r.chiaviTot).padStart(12),
      String(r.corpoFermi + '/' + r.corpoTot).padStart(19),
      String(perc + '%').padStart(15),
      String(r.avviso ? 'sì' : '—').padStart(7));
  }
  const pulite = righe.filter(r => !r.chiaviFerme && !r.corpoFermi).map(r => r.nome);
  console.log('senza carenze:', pulite.length ? pulite.join(', ') : 'nessuna');
}
