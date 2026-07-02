// ---------------------------------------------------------------------------
// gen-depth.mjs — deriva una depth-map (grayscale, BIANCO=vicino) da una foto.
//
// Fallback OFFLINE (nessuna rete): usa il Chromium preinstallato per elaborare
// l'immagine su <canvas> con un'euristica pensata per aerial/landscape golden-hour:
//   depth = gradiente verticale (basso=vicino) modulato dalla luminanza locale,
//   poi box-blur per morbidezza. Sufficiente per il displacement parallax.
//
// Per qualità HYPER-REAL usare invece Depth Anything V2 (vedi public/parallax/README.md);
// questo script è la rete di sicurezza quando l'egress non è disponibile.
//
// USO:  node scripts/gen-depth.mjs public/parallax/scene1_srilanka.jpg
//       (scrive accanto: scene1_srilanka_depth.png)
// ---------------------------------------------------------------------------

import { existsSync } from 'node:fs';
import { dirname, basename, join, extname } from 'node:path';
import pw from '/opt/node22/lib/node_modules/playwright/index.js';

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error('Uso: node scripts/gen-depth.mjs <path-immagine-colore>');
  process.exit(1);
}
const out = join(dirname(input), basename(input, extname(input)) + '_depth.png');

const { chromium } = pw;
const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage();

// Carico l'immagine come data URL così il canvas non incontra restrizioni cross-origin.
const fs = await import('node:fs/promises');
const buf = await fs.readFile(input);
const mime = extname(input).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;

const pngBase64 = await page.evaluate(async (src) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const src2 = ctx.getImageData(0, 0, W, H).data;
  const depth = new Float32Array(W * H);

  // 1) Euristica base: gradiente verticale (basso=vicino) + luminanza.
  for (let y = 0; y < H; y++) {
    const vert = y / (H - 1);                 // 0 in alto (lontano) → 1 in basso (vicino)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const lum = (0.299 * src2[i] + 0.587 * src2[i + 1] + 0.114 * src2[i + 2]) / 255;
      // il cielo/foschia (chiaro, in alto) resta lontano; il primo piano scuro/dettagliato è vicino
      const d = 0.72 * vert + 0.28 * (1 - lum) * vert;
      depth[y * W + x] = Math.max(0, Math.min(1, d));
    }
  }

  // 2) Box-blur separabile (raggio in % della larghezza) per morbidezza.
  const r = Math.max(2, Math.round(W * 0.012));
  const blur1D = (buf, w, h, horizontal) => {
    const res = new Float32Array(w * h);
    for (let a = 0; a < (horizontal ? h : w); a++) {
      let sum = 0;
      const line = (b) => (horizontal ? buf[a * w + b] : buf[b * w + a]);
      const len = horizontal ? w : h;
      for (let b = 0; b <= r && b < len; b++) sum += line(b);
      for (let b = 0; b < len; b++) {
        const cnt = Math.min(b + r, len - 1) - Math.max(b - r, 0) + 1;
        const v = sum / cnt;
        if (horizontal) res[a * w + b] = v; else res[b * w + a] = v;
        const add = b + r + 1, sub = b - r;
        if (add < len) sum += line(add);
        if (sub >= 0) sum -= line(sub);
      }
    }
    return res;
  };
  let d2 = blur1D(depth, W, H, true);
  d2 = blur1D(d2, W, H, false);

  // 3) Scrittura grayscale.
  const outImg = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const v = Math.round(d2[i] * 255);
    outImg.data[i * 4] = v;
    outImg.data[i * 4 + 1] = v;
    outImg.data[i * 4 + 2] = v;
    outImg.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(outImg, 0, 0);
  return c.toDataURL('image/png').split(',')[1];
}, dataUrl);

await fs.writeFile(out, Buffer.from(pngBase64, 'base64'));
await browser.close();
console.log('OK →', out);
