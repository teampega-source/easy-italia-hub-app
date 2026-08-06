/* Registra brevi riprese del sito, da usare come stacchi dentro il promo.

   Uso:  node scripts/registra-inserti.mjs [base-url] [cartella]

   Il promo mostra una persona che parla di una piattaforma che non si vede
   mai. Questi sono i due secondi in cui si vede: il sito vero, mosso davvero,
   senza finzioni. Niente mockup disegnati — quello che si registra qui e'
   quello che l'utente trovera' aprendo il sito.

   Formato verticale 1080x1920, per stare dentro l'inquadratura del promo.
   Si registra a 540x960 con il raddoppio dei pixel: a quella larghezza il
   sito mostra la sua veste da telefono, che e' come lo vedra' chi arriva
   dall'annuncio.                                                            */

import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'http://localhost:3100';
const FUORI = process.argv[3] || path.join(RADICE, '.out', 'inserti');

const L = 540, A = 960;   // 9:16 esatto

/* Ogni ripresa e' un gesto solo, leggibile in due secondi. Piu' di uno e non
   si capisce niente. */
const RIPRESE = [
  {
    nome: 'guida',
    pagina: '/guide',
    async gira(p) {
      // la guida del permesso, scorsa piano sui passi numerati
      await p.evaluate(() => {
        const s = document.getElementById('permesso-soggiorno');
        if (s) s.scrollIntoView({ block: 'start' });
      });
      await p.waitForTimeout(700);
      for (let i = 0; i < 9; i++) { await p.mouse.wheel(0, 30); await p.waitForTimeout(58); }
      await p.waitForTimeout(400);
    },
  },
  {
    nome: 'assistente',
    pagina: '/',
    async gira(p) {
      await p.waitForTimeout(500);
      const b = p.locator('#chat-btn');
      if (await b.count()) {
        await b.click();
        await p.waitForTimeout(1700);   // il pannello si apre e mostra i suggerimenti
      }
      await p.waitForTimeout(300);
    },
  },
  {
    nome: 'percorso',
    pagina: '/percorso',
    async gira(p) {
      await p.evaluate(() => window.scrollTo(0, 900));
      await p.waitForTimeout(600);
      for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 34); await p.waitForTimeout(58); }
      await p.waitForTimeout(400);
    },
  },
];

mkdirSync(FUORI, { recursive: true });
const browser = await chromium.launch();

for (const r of RIPRESE) {
  const tmp = path.join(FUORI, '.grezzo-' + r.nome);
  mkdirSync(tmp, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: L, height: A },
    deviceScaleFactor: 2,
    isMobile: true, hasTouch: true,
    recordVideo: { dir: tmp, size: { width: L * 2, height: A * 2 } },
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('eih-lang', 'en');
    localStorage.setItem('eih-lang-scelta', '1');
    localStorage.setItem('eih-registered', '1');
    // il banner dei cookie e il tema non devono comparire nella ripresa
    localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: false, marketing: false }));
    localStorage.setItem('eih-theme', 'light');
  });
  const p = await ctx.newPage();
  await p.goto(BASE + r.pagina, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  // via quello che non racconta il prodotto: il velo di transizione e i
  // pulsanti che galleggiano ai lati
  await p.evaluate(() => {
    ['wipe', 'preloader', 'eihp-fab', 'eiht-fab', 'eih-mascot', 'eih-mascot-bubble']
      .forEach((i) => { const e = document.getElementById(i); if (e) e.remove(); });
  });
  await p.waitForTimeout(400);

  await r.gira(p);

  await ctx.close();   // il file si chiude solo qui
  const grezzo = readdirSync(tmp).find((f) => f.endsWith('.webm'));
  renameSync(path.join(tmp, grezzo), path.join(FUORI, r.nome + '.webm'));
  rmSync(tmp, { recursive: true, force: true });
  console.log('ripresa', r.nome);
}

await browser.close();
console.log('riprese in', FUORI);
