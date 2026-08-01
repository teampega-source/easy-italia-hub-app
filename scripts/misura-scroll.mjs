/* Misura la fluidità dello scorrimento e il lavoro di composizione.

   Non basta togliere animazioni: conta se lo scroll diventa piu' fluido e se
   il thread principale respira. Si misurano tre cose:
     fps        fotogrammi al secondo durante uno scroll continuo
     peggiore   il fotogramma piu' lento (quello che si sente come scatto)
     anim       animazioni ancora in corso a pagina ferma

   Uso: node scripts/misura-scroll.mjs [base-url] [pagina,...] [larghezza]    */
import pw from 'playwright';
const { chromium } = pw;

const BASE = process.argv[2] || 'http://localhost:3100';
const PAGINE = (process.argv[3] || ',guide,housing').split(',');
const LARG = parseInt(process.argv[4] || '390', 10);

const b = await chromium.launch();
console.log('pagina           fps  peggiore  anim in corso');

for (const nome of PAGINE) {
  const ctx = await b.newContext({ viewport: { width: LARG, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: true, marketing: true })); } catch (e) {}
  });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });   // telefono medio

  await p.goto(BASE + '/' + nome, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);

  const anim = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);

  await p.evaluate(() => {
    window.__f = [];
    let ultimo = performance.now();
    window.__stop = false;
    (function giro() {
      const ora = performance.now();
      window.__f.push(ora - ultimo);
      ultimo = ora;
      if (!window.__stop) requestAnimationFrame(giro);
    })();
  });
  for (let i = 0; i < 24; i++) {
    await p.mouse.wheel(0, 320);
    await p.waitForTimeout(90);
  }
  const m = await p.evaluate(() => {
    window.__stop = true;
    const f = window.__f.slice(3);
    if (!f.length) return null;
    const media = f.reduce((a, x) => a + x, 0) / f.length;
    return { fps: Math.round(1000 / media), peggiore: Math.round(Math.max.apply(null, f)) };
  });

  console.log((nome || 'home').padEnd(16), String(m ? m.fps : '—').padStart(3), String(m ? m.peggiore + 'ms' : '—').padStart(9), String(anim).padStart(9));
  await ctx.close();
}
await b.close();
