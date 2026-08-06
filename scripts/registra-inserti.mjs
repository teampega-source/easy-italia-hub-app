/* Registra brevi riprese del sito, da usare come stacchi dentro il promo.

   Uso:  node scripts/registra-inserti.mjs [base-url] [cartella]

   Il promo mostra una persona che parla di una piattaforma che non si vede
   mai. Questi sono i due secondi in cui si vede: il sito vero, mosso davvero.
   Niente mockup disegnati — quello che si registra qui e' quello che l'utente
   trovera' aprendo il sito.

   Perche' a fotogrammi e non con la registrazione video di Playwright:
   `recordVideo` ridimensiona la finestra solo verso il basso, mai in su.
   Chiedendo un video 1080x1920 da una finestra di 540x960 metteva la pagina
   in un angolo e lasciava il resto vuoto. Fotografando fotogramma per
   fotogramma con il raddoppio dei pixel si ottiene 1080x1920 pieno e nitido,
   e in piu' lo scorrimento lo si governa: parte piano, accelera, si ferma
   dolce, invece di sobbalzare a scatti di rotellina.                        */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FF = process.env.FFMPEG || path.join(RADICE, 'node_modules', 'ffmpeg-static', 'ffmpeg');
const BASE = process.argv[2] || 'http://localhost:3100';
const FUORI = process.argv[3] || path.join(RADICE, '.out', 'inserti');

const L = 540, A = 960, SCALA = 2, FPS = 24, DURATA = 2.9;

/* Ogni ripresa e' un gesto solo, leggibile in due secondi. Piu' di uno e non
   si capisce niente.

   `prepara` porta la pagina al punto di partenza; `da`/`a` sono le posizioni
   di scorrimento fra cui muoversi. Chi non scorre resta fermo — e va bene:
   un pannello che si e' appena aperto ha gia' il suo movimento dentro. */
const RIPRESE = [
  {
    nome: 'guida',
    pagina: '/guide',
    async prepara(p) {
      const y = await p.evaluate(() => {
        const s = document.getElementById('permesso-soggiorno');
        return s ? s.getBoundingClientRect().top + window.scrollY : 0;
      });
      return { da: y - 40, a: y + 620 };
    },
  },
  {
    nome: 'assistente',
    pagina: '/',
    async prepara(p) {
      const b = p.locator('#chat-btn');
      if (await b.count()) { await b.click(); await p.waitForTimeout(1400); }
      return { da: 0, a: 0 };
    },
  },
  {
    nome: 'percorso',
    pagina: '/percorso',
    async prepara(p) {
      const y = await p.evaluate(() => {
        const f = document.querySelector('.phase-card, .ph-card, [class*="phase"]');
        return f ? f.getBoundingClientRect().top + window.scrollY - 120 : 900;
      });
      return { da: y, a: y + 700 };
    },
  },
];

// parte piano e si ferma dolce: uno scorrimento a velocita' costante sembra
// meccanico, e in due secondi si nota
const morbido = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

mkdirSync(FUORI, { recursive: true });
const browser = await chromium.launch();

for (const r of RIPRESE) {
  const ctx = await browser.newContext({
    viewport: { width: L, height: A },
    deviceScaleFactor: SCALA,
    isMobile: true, hasTouch: true,
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('eih-lang', 'en');
    localStorage.setItem('eih-lang-scelta', '1');
    localStorage.setItem('eih-registered', '1');
    // il banner dei cookie non deve comparire nella ripresa
    localStorage.setItem('eih-cookie-consent', JSON.stringify({ v: 1, ts: Date.now(), analytics: false, marketing: false }));
    localStorage.setItem('eih-theme', 'light');
  });
  const p = await ctx.newPage();
  await p.goto(BASE + r.pagina, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  // via quello che non racconta il prodotto
  await p.evaluate(() => {
    ['wipe', 'preloader', 'eihp-fab', 'eiht-fab', 'eih-mascot', 'eih-mascot-bubble']
      .forEach((i) => { const e = document.getElementById(i); if (e) e.remove(); });
    // Lenis anima lo scorrimento per conto suo: qui la posizione la decide il
    // fotogramma, e due padroni sullo stesso scorrimento litigano.
    try { if (window.EIH_LENIS) window.EIH_LENIS.destroy(); } catch (e) {}
  });
  await p.waitForTimeout(300);

  const { da, a } = await r.prepara(p);
  await p.evaluate((y) => window.scrollTo(0, y), da);
  await p.waitForTimeout(600);   // le sezioni che compaiono allo scorrimento si accendono

  const uscita = path.join(FUORI, r.nome + '.mp4');
  const ff = spawn(FF, ['-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-y', uscita]);
  ff.stderr.on('data', (b) => process.stderr.write(b));
  const finita = new Promise((ok, ko) => ff.on('close', (x) => (x === 0 ? ok() : ko(new Error('ffmpeg: ' + x)))));

  const n = Math.round(DURATA * FPS);
  for (let i = 0; i < n; i++) {
    if (a !== da) await p.evaluate((y) => window.scrollTo(0, y), da + (a - da) * morbido(i / (n - 1)));
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((res) => ff.stdin.once('drain', res));
  }
  ff.stdin.end();
  await finita;
  await ctx.close();
  console.log('ripresa', r.nome, '·', (L * SCALA) + 'x' + (A * SCALA), '·', DURATA + 's');
}

await browser.close();
console.log('riprese in', FUORI);
