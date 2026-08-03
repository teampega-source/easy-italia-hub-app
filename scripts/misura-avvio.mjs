/* Misura il ritardo percepito all'apertura di una pagina.

   Interessano quattro cose diverse, che si confondono facilmente:
     FCP   quando compare il primo pixel di contenuto
     LCP   quando compare l'elemento piu' grande
     CLS   quanto la pagina salta dopo essere comparsa
     tradotta  quando il testo passa dall'italiano alla lingua scelta

   L'ultima e' quella nuova: se arriva molto dopo la FCP, l'utente vede
   l'italiano e poi lo vede cambiare — ed e' esattamente il "lag" che si nota.

   Uso: node scripts/misura-avvio.mjs [base-url] [pagina,...] [lingua]        */
import pw from 'playwright';
const { chromium } = pw;

const BASE = process.argv[2] || 'http://localhost:3100';
const PAGINE = (process.argv[3] || ',guide,italia-srilanka,housing').split(',');
const LINGUA = process.argv[4] || 'si';
const GIRI = 3;

const b = await chromium.launch();

for (const nome of PAGINE) {
  const url = BASE + '/' + nome;
  const acc = { fcp: [], lcp: [], cls: [], tr: [], lunghi: [], bloccoJs: [] };

  for (let g = 0; g < GIRI; g++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.addInitScript((l) => {
      try {
        localStorage.setItem('eih-lang', l);
        localStorage.setItem('eih-lang-scelta', '1');
        localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: true, marketing: true }));
      } catch (e) {}
      // marca il momento in cui il testo di pagina viene sostituito
      // Si controlla a intervalli brevi invece di usare un osservatore: al
      // momento in cui questo codice gira documentElement puo' non esistere
      // ancora, e un osservatore agganciato dopo perderebbe l'evento.
      window.__trQuando = null;
      const spia = setInterval(() => {
        if (document.documentElement && document.documentElement.hasAttribute('data-tr')) {
          window.__trQuando = performance.now();
          clearInterval(spia);
        }
      }, 8);
    }, LINGUA);

    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });          // telefono medio
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8
    });

    await p.addInitScript(() => {
      window.__lunghi = [];
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lunghi.push(Math.round(e.duration)); })
        .observe({ type: 'longtask', buffered: true });
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    });

    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(6000);

    const m = await p.evaluate(() => {
      const pe = (t) => { const e = performance.getEntriesByType(t); return e.length ? e[e.length - 1] : null; };
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const lcp = pe('largest-contentful-paint');
      return {
        fcp: fcp ? Math.round(fcp.startTime) : null,
        lcp: lcp ? Math.round(lcp.startTime) : null,
        cls: Math.round((window.__cls || 0) * 1000) / 1000,
        tr: window.__trQuando ? Math.round(window.__trQuando) : null,
        lunghi: (window.__lunghi || []).filter(x => x >= 50),
      };
    });
    acc.fcp.push(m.fcp); acc.lcp.push(m.lcp); acc.cls.push(m.cls); acc.tr.push(m.tr);
    acc.lunghi.push(m.lunghi.reduce((a, x) => a + x, 0));
    await ctx.close();
  }

  const med = (a) => { const v = a.filter(x => x != null).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
  const tr = med(acc.tr), fcp = med(acc.fcp);
  console.log(
    (nome || 'home').padEnd(18),
    'FCP', String(fcp).padStart(5),
    'LCP', String(med(acc.lcp)).padStart(5),
    'CLS', String(med(acc.cls)).padStart(6),
    'blocco', String(med(acc.lunghi)).padStart(5) + 'ms',
    'tradotta', String(tr).padStart(5),
    tr && fcp ? '(' + (tr - fcp) + 'ms dopo il primo pixel)' : ''
  );
}
await b.close();
