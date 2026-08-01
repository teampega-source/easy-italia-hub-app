/* Controlla che la cornice del sito — testata, piede, barra laterale, modali,
   tutto cio' che sta fuori da <main> — sia tradotta in singalese e tamil.
   Uso: npx serve . -l 3100 &  node scripts/audit-cornice.mjs [porta]
   Esce con codice 1 se resta italiano non giustificato. */
import { chromium } from 'playwright';

const PORTA = process.argv[2] || 3100;
const PAGINE = ['', 'servizi', 'guide', 'percorso', 'community', 'contatti', 'mappa', 'moduli', 'academy', 'news'];
const SCRITTURA = { si: /[඀-෿]/, ta: /[஀-௿]/ };
// Nomi propri e marchio: restano com'e' in ogni lingua, di proposito.
const AMMESSI = /^(Italiano|English|EASY ITALIA HUB|Easy Italia Hub|AI Assistant|CAF & Patronati|Lombardia|Piemonte|Emilia-Romagna|Campania|Lazio|Veneto|Toscana|Sicilia|[A-Z][a-z]+ Poya|email@gmail\.com)$/;

const b = await chromium.launch();
let guasti = 0;
for (const lg of ['si', 'ta']) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.addInitScript(([l]) => { try { localStorage.setItem('eih-lang', l); } catch (e) {} }, [lg]);
  const p = await ctx.newPage();
  for (const pg of PAGINE) {
    try { await p.goto(`http://localhost:${PORTA}/${pg}`, { waitUntil: 'domcontentloaded', timeout: 15000 }); }
    catch (e) { console.log(lg, pg || 'index', 'IRRAGGIUNGIBILE'); guasti++; continue; }
    await p.waitForTimeout(2600);
    const resti = await p.evaluate(([lg, ammessi]) => {
      const scr = new RegExp(lg === 'si' ? '[\\u0D80-\\u0DFF]' : '[\\u0B80-\\u0BFF]');
      const ok = new RegExp(ammessi);
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const t = (n.nodeValue || '').trim();
        if (t.length < 8 || scr.test(t) || ok.test(t)) continue;
        if (!/[a-zàèéìòù]{3}/i.test(t)) continue;
        const el = n.parentElement;
        if (!el || el.closest('script,style,noscript,main')) continue;
        if (!el.getClientRects().length || el.closest('[hidden]')) continue;
        out.push(t.slice(0, 60));
      }
      return out;
    }, [lg, AMMESSI.source]);
    if (resti.length) { guasti += resti.length; console.log(lg, (pg || 'index').padEnd(10), resti.length, '·', resti.join(' | ')); }
  }
  await ctx.close();
}
await b.close();
console.log(guasti ? `NON TRADOTTO: ${guasti} frammenti` : 'Cornice tradotta in si e ta.');
process.exit(guasti ? 1 : 0);
