/* Ripulisce il promo e gli attacca la scheda finale.

   Uso:  node scripts/monta-promo-finale.mjs <promo.mp4> [uscita.mp4] [lingua]
                                             [--taglia-alto=px] [--larghezza=1440]

   Tre cose in un passaggio solo: via il watermark dello strumento che ha
   generato il video, l'inquadratura portata a 9:16 e ingrandita, e in coda la
   scheda con i servizi e l'invito.

   Il promo si chiudeva sulla modella e finiva li'. Chi lo guarda fino in fondo
   e' esattamente chi vorrebbe sapere cosa c'e' dentro il sito e come entrarci:
   qui arriva una coda di cinque secondi e mezzo con i servizi e l'invito, in
   dissolvenza dal video.

   La coda e' disegnata, non ripresa: le sei voci e il pulsante nascono in
   HTML, il browser fotografa fotogramma per fotogramma e ffmpeg incolla. La
   dichiarazione «AI-generated» resta anche qui, perche' il filmato di cui fa
   parte e' generato: l'obbligo dell'articolo 50 riguarda l'opera, non lo
   spezzone.                                                                  */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(RADICE, '.cache-font');
const FF = process.env.FFMPEG || path.join(RADICE, 'node_modules', 'ffmpeg-static', 'ffmpeg');

const argomenti = process.argv.slice(2);
const opzione = (nome, ripiego) => {
  const v = argomenti.find((a) => a.startsWith('--' + nome + '='));
  return v ? v.split('=')[1] : ripiego;
};
const liberi = argomenti.filter((a) => !a.startsWith('--'));
const PROMO = liberi[0];
const USCITA = liberi[1] || path.join(RADICE, '.out', 'promo-con-finale.mp4');
const LG = liberi[2] || 'en';
// Il watermark sta in un angolo: invece di sfocarlo si taglia la striscia che
// lo contiene. Una toppa interpolata su uno sfondo che si muove si vede;
// qualche pixel in meno di cielo, no.
const TAGLIA_ALTO = parseInt(opzione('taglia-alto', '0'), 10);
const USCITA_L = parseInt(opzione('larghezza', '1440'), 10);   // 1440x2560 = 2K verticale
if (!PROMO || !existsSync(PROMO)) {
  console.error('serve il promo: node scripts/monta-promo-finale.mjs <promo.mp4> [uscita.mp4] [lingua] [--taglia-alto=px] [--larghezza=1440]');
  process.exit(1);
}

// La scheda si disegna sempre a 720x1280 e si fotografa ingrandita: cosi' il
// foglio di stile non cambia quando cambia la risoluzione d'uscita.
const L = 720, A = 1280, FPS = 24, CODA = 5.6, DISSOLVENZA = 0.9;
const SCALA = USCITA_L / L;
const USCITA_A = Math.round(A * SCALA);

/* Icone di linea, non emoji: le emoji le disegna il sistema, ognuna con un
   suo stile e i suoi colori, e su una scheda sobria stonano fra loro. */
const ICO = {
  guide: '<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  chat:  '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.2-4A8 8 0 1 1 21 12z"/><path d="M9 11h6M9 15h3"/>',
  card:  '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4M6 16c.9-1.4 4.2-1.4 5 0"/>',
  corso: '<path d="M12 4 2 9l10 5 10-5-10-5z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>',
  gente: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9.5" r="2.4"/><path d="M16 14.4a5.5 5.5 0 0 1 5.5 5.6"/>',
  mappa: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>'
};
const svg = (n) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICO[n] + '</svg>';

/* ── I testi ──────────────────────────────────────────────────────────── */
const T = {
  it: {
    titolo: 'Tutta l\'Italia,', enfasi: 'in un posto solo.',
    voci: [
      ['guide', 'Guide passo passo'], ['chat', 'Consigliere AI, sempre'],
      ['card', 'Tracker del permesso'], ['corso', 'Corsi di italiano'],
      ['gente', 'Community srilankese'], ['mappa', 'Mappa dei servizi'],
    ],
    invito: 'Entra nella community', sito: 'easyitaliahub.it',
    gratis: 'Gratis · Nessuna carta di credito', ai: '✦ Video generato con l\'AI',
  },
  en: {
    titolo: 'All of Italy,', enfasi: 'in one place.',
    voci: [
      ['guide', 'Step-by-step guides'], ['chat', 'AI advisor, always on'],
      ['card', 'Permit tracker'], ['corso', 'Italian courses'],
      ['gente', 'Sri Lankan community'], ['mappa', 'Services map'],
    ],
    invito: 'Join the community', sito: 'easyitaliahub.it',
    gratis: 'Free · No credit card', ai: '✦ AI-generated video',
  },
};

/* ── I font: gli stessi del sito, presi da fontshare e tenuti da parte ──── */
const FONT_SITO = 'https://api.fontshare.com/v2/css?f[]=clash-grotesk@600,700&f[]=satoshi@500,700&display=swap';

async function scarica(url, dove) {
  if (existsSync(dove)) return readFileSync(dove);
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36' } });
  if (!r.ok) throw new Error('font non scaricato: ' + url + ' → ' + r.status);
  const b = Buffer.from(await r.arrayBuffer());
  writeFileSync(dove, b);
  return b;
}
async function raccogliFont() {
  mkdirSync(CACHE, { recursive: true });
  const css = (await scarica(FONT_SITO, path.join(CACHE, 'fontshare.css'))).toString();
  const pezzi = [];
  for (const blocco of [...css.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0])) {
    const fam = (blocco.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1];
    const peso = (blocco.match(/font-weight:\s*(\d+)/) || [])[1];
    let url = (blocco.match(/url\(['"]?((?:https:)?\/\/[^'")]+\.woff2)['"]?\)/) || [])[1];
    if (url && url.startsWith('//')) url = 'https:' + url;
    if (!fam || !peso || !url) continue;
    if (!/Clash Grotesk|Satoshi/i.test(fam) || !['500', '600', '700'].includes(peso)) continue;
    const b = await scarica(url, path.join(CACHE, `${fam.replace(/\s+/g, '')}-${peso}.woff2`));
    pezzi.push(`@font-face{font-family:'${fam.trim()}';font-weight:${peso};font-display:block;src:url(data:font/woff2;base64,${b.toString('base64')}) format('woff2')}`);
  }
  if (!pezzi.length) throw new Error('nessun font scaricato da fontshare');
  return pezzi.join('\n');
}

/* ── La scheda ─────────────────────────────────────────────────────────── */
function pagina(font, logo, d) {
  const q = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<style>
${font}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${L}px;height:${A}px;overflow:hidden;
  background:radial-gradient(120% 85% at 60% 16%,#2a2118 0%,#141109 62%,#0a0906 100%)}
body{font-family:'Satoshi',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:0 56px;text-align:center;color:#fdfbf7}
.marchio{width:74px;height:74px;border-radius:50%;background:rgba(255,255,255,.94);
  display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.marchio img{width:58px;height:58px;object-fit:contain}
h1{font-family:'Clash Grotesk',sans-serif;font-weight:700;font-size:56px;line-height:1.05;
  letter-spacing:-.025em;margin-top:26px}
h1 em{font-style:normal;color:#c2a15e}
.voci{display:grid;grid-template-columns:1fr;gap:13px;margin-top:38px;width:100%;max-width:430px}
.voce{display:flex;align-items:center;gap:14px;text-align:left;
  background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);
  border-radius:16px;padding:13px 18px;font-size:21px;font-weight:500;color:#efe7db}
.voce .ico{flex:0 0 auto;width:25px;height:25px;color:#c2a15e;display:flex}
.voce .ico svg{width:100%;height:100%}
.invito{margin-top:42px}
.pillola{display:inline-block;background:#c2a15e;color:#221a0e;border-radius:999px;
  padding:17px 44px;font-family:'Clash Grotesk',sans-serif;font-weight:700;font-size:26px;
  letter-spacing:-.01em;box-shadow:0 14px 40px rgba(194,161,94,.34)}
.sito{margin-top:18px;font-family:'Clash Grotesk',sans-serif;font-weight:600;
  font-size:30px;color:#fdfbf7;letter-spacing:-.01em}
.gratis{margin-top:9px;font-size:17px;color:#a2988a}
.ai{position:absolute;left:0;right:0;bottom:44px;font-size:15px;font-weight:500;
  color:rgba(255,255,255,.72);letter-spacing:.01em}
</style>
<div class="marchio" id="marchio"><img src="${logo}" alt=""/></div>
<h1 id="titolo">${q(d.titolo)}<br><em>${q(d.enfasi)}</em></h1>
<div class="voci" id="voci">
${d.voci.map(([i, t]) => `  <div class="voce"><span class="ico">${svg(i)}</span>${q(t)}</div>`).join('\n')}
</div>
<div class="invito" id="invito">
  <div class="pillola">${q(d.invito)}</div>
  <div class="sito">${q(d.sito)}</div>
  <div class="gratis">${q(d.gratis)}</div>
</div>
<div class="ai" id="ai">${q(d.ai)}</div>`;
}

/* Lo stato della scheda al secondo `t`. Gira dentro il browser. */
const DISEGNA = `
window.disegna = function (t) {
  var lisc = function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); };
  var su = function (el, ritardo, durata, spostamento, scala) {
    var p = lisc((t - ritardo) / durata);
    el.style.opacity = p;
    var s = scala ? (0.9 + 0.1 * p) : 1;
    el.style.transform = 'translateY(' + ((1 - p) * spostamento) + 'px) scale(' + s + ')';
  };
  su(document.getElementById('marchio'), 0.05, 0.6, 18, true);
  su(document.getElementById('titolo'), 0.25, 0.7, 26);
  var voci = document.querySelectorAll('#voci .voce');
  for (var i = 0; i < voci.length; i++) su(voci[i], 0.75 + i * 0.13, 0.6, 16);
  su(document.getElementById('invito'), 1.95, 0.7, 22, true);
  // il tasto respira piano: si nota senza distrarre
  var pil = document.querySelector('.pillola');
  var b = t > 2.6 ? 1 + 0.018 * Math.sin((t - 2.6) * 2.6) : 1;
  pil.style.transform = 'scale(' + b + ')';
  document.getElementById('ai').style.opacity = lisc((t - 1.2) / 0.8) * 0.95;
};`;

/* ── Montaggio ─────────────────────────────────────────────────────────── */
const font = await raccogliFont();
const logo = 'data:image/webp;base64,' + readFileSync(path.join(RADICE, 'assets', 'img', 'logo-symbol.webp')).toString('base64');
const d = T[LG] || T.en;

mkdirSync(path.dirname(USCITA), { recursive: true });
const coda = path.join(path.dirname(USCITA), '.coda-promo.mp4');

const browser = await chromium.launch();
const pag = await browser.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: SCALA });
await pag.setContent(pagina(font, logo, d));
await pag.addScriptTag({ content: DISEGNA });
await pag.evaluate(() => document.fonts.ready);
await pag.waitForTimeout(400);

const ff = spawn(FF, ['-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '19',
  '-pix_fmt', 'yuv420p', '-y', coda]);
ff.stderr.on('data', (b) => process.stderr.write(b));
const finita = new Promise((ok, ko) => ff.on('close', (c) => (c === 0 ? ok() : ko(new Error('ffmpeg coda: ' + c)))));

const totale = Math.round(CODA * FPS);
for (let i = 0; i < totale; i++) {
  await pag.evaluate((t) => window.disegna(t), i / FPS);
  const buf = await pag.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end();
await finita;

/* La dichiarazione sul filmato.
   Questo promo arriva senza etichetta, ed e' un video generato: una persona
   che non esiste che parla a chi guarda. L'articolo 50 del Reg. (UE)
   2024/1689 la vuole visibile accanto al contenuto, non nella descrizione del
   post — quindi si cuce sull'immagine, per tutta la durata del parlato. La
   scheda finale ha gia' la sua. */
const etichetta = path.join(path.dirname(USCITA), '.etichetta-ai.png');
await pag.setViewportSize({ width: L, height: A });
await pag.setContent(`<style>${font}
*{margin:0;padding:0}
html,body{width:${L}px;height:${A}px;background:transparent;overflow:hidden;
  font-family:'Satoshi',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.ai{position:absolute;left:0;right:0;bottom:34px;text-align:center;font-size:15px;
  font-weight:500;letter-spacing:.01em;color:rgba(255,255,255,.93);
  text-shadow:0 2px 12px rgba(0,0,0,.8),0 0 3px rgba(0,0,0,.6)}
</style><div class="ai">${d.ai}</div>`);
await pag.evaluate(() => document.fonts.ready);
await pag.waitForTimeout(250);
writeFileSync(etichetta, await pag.screenshot({ omitBackground: true, type: 'png' }));
await browser.close();

/* La durata del promo la chiede a ffprobe? Non serve: la si legge da ffmpeg
   stesso, che stampa la durata nel log. Piu' semplice contare i pacchetti. */
function durata(file) {
  return new Promise((ok, ko) => {
    const p = spawn(FF, ['-i', file, '-f', 'null', '-']);
    let log = '';
    p.stderr.on('data', (b) => (log += b));
    p.on('close', () => {
      const m = log.match(/time=(\d+):(\d+):(\d+\.\d+)/g);
      if (!m) return ko(new Error('durata non leggibile per ' + file));
      const u = m[m.length - 1].slice(5).split(':');
      ok(+u[0] * 3600 + +u[1] * 60 + +u[2]);
    });
  });
}

function dimensioni(file) {
  return new Promise((ok, ko) => {
    const p = spawn(FF, ['-i', file, '-f', 'null', '-']);
    let log = '';
    p.stderr.on('data', (b) => (log += b));
    p.on('close', () => {
      const m = log.match(/Video:.*?,\s(\d{2,5})x(\d{2,5})/);
      if (!m) return ko(new Error('dimensioni non leggibili per ' + file));
      ok({ l: +m[1], a: +m[2] });
    });
  });
}

const dPromo = await durata(PROMO);
const dim = await dimensioni(PROMO);

/* Ritaglio: prima via la striscia col watermark, poi si porta il fotogramma a
   9:16 togliendo il meno possibile, sempre dal centro. */
const restaA = dim.a - TAGLIA_ALTO;
let ritL = Math.min(dim.l, Math.round(restaA * 9 / 16));
let ritA = Math.min(restaA, Math.round(ritL * 16 / 9));
ritL -= ritL % 2; ritA -= ritA % 2;
const ritX = Math.round((dim.l - ritL) / 2);
const ritY = TAGLIA_ALTO + Math.round((restaA - ritA) / 2);
// L'ingrandimento non inventa dettaglio: lanczos tiene i bordi puliti e una
// punta di maschera di contrasto rimette il mordente che la scalatura toglie.
const PULISCI = `crop=${ritL}:${ritA}:${ritX}:${ritY},scale=${USCITA_L}:${USCITA_A}:flags=lanczos,` +
  `unsharp=5:5:0.55:5:5:0`;
console.log(`sorgente ${dim.l}x${dim.a} → ritaglio ${ritL}x${ritA}+${ritX}+${ritY} → uscita ${USCITA_L}x${USCITA_A}`);
const offset = (dPromo - DISSOLVENZA).toFixed(3);
const dTotale = (dPromo + CODA - DISSOLVENZA).toFixed(3);

await new Promise((ok, ko) => {
  const p = spawn(FF, ['-v', 'error', '-i', PROMO, '-i', coda, '-i', etichetta,
    '-filter_complex',
    // la coda non ha suono: si prolunga quello del promo con silenzio e lo si
    // spegne mentre l'immagine sfuma, cosi' non taglia di netto
    `[0:v]${PULISCI},fps=${FPS},setsar=1[a0];[2:v]format=rgba[et];[a0][et]overlay=0:0,format=yuv420p[a];` +
    `[1:v]fps=${FPS},format=yuv420p,setsar=1[b];` +
    `[a][b]xfade=transition=fade:duration=${DISSOLVENZA}:offset=${offset}[v];` +
    `[0:a]afade=t=out:st=${(dPromo - 1.4).toFixed(3)}:d=1.4,apad=whole_dur=${dTotale}[s]`,
    '-map', '[v]', '-map', '[s]',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-y', USCITA]);
  p.stderr.on('data', (b) => process.stderr.write(b));
  p.on('close', (c) => (c === 0 ? ok() : ko(new Error('ffmpeg montaggio: ' + c))));
});

for (const f of [coda, etichetta]) { try { unlinkSync(f); } catch (e) {} }
console.log('promo con finale:', USCITA, '·', dTotale + 's');
