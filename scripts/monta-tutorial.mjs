/* Monta un tutorial per YouTube da una scheda di contenuti.

   Uso:  node scripts/monta-tutorial.mjs <contenuti.json> [lingua] [uscita.mp4]

   Perche' esistono questi video: «rinnovo permesso di soggiorno» e «come si fa
   lo SPID» sono ricerche che la gente fa ogni giorno. In italiano rispondono in
   cinquanta; in singalese e in tamil non risponde nessuno. Un video che occupa
   quel posto continua a portare persone per anni, senza pagare un euro di
   pubblicita' — e' l'unica parte della campagna che non si spegne quando finisce
   il budget.

   Formato orizzontale, 1920x1080: questi non sono Shorts, sono video che si
   trovano cercando, e la ricerca di YouTube vive ancora la' .

   I contenuti stanno in un JSON separato, uno per tutorial, con tutte le lingue
   dentro: chi scrive il testo non deve toccare il codice, e la stessa scheda
   produce quattro video identici in tutto tranne che nelle parole.            */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fontIncorporati, famigliaLocale } from './lib-font.mjs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FF = process.env.FFMPEG || path.join(RADICE, 'node_modules', 'ffmpeg-static', 'ffmpeg');

const argomenti = process.argv.slice(2);
const opzione = (nome, ripiego) => {
  const v = argomenti.find((a) => a.startsWith('--' + nome + '='));
  return v ? v.split('=')[1] : ripiego;
};
const liberi = argomenti.filter((a) => !a.startsWith('--'));
const SCHEDA = liberi[0];
const LG = liberi[1] || 'si';
if (!SCHEDA || !existsSync(SCHEDA)) {
  console.error('uso: node scripts/monta-tutorial.mjs <contenuti.json> [lingua] [uscita.mp4] [--ritmo=0.84] [--musica=no|<file>]');
  process.exit(1);
}
const dati = JSON.parse(readFileSync(SCHEDA, 'utf8'));
const c = dati[LG];
if (!c) { console.error('la scheda non ha la lingua ' + LG); process.exit(1); }
const USCITA = liberi[2] || path.join(RADICE, '.out', `${dati.id}.${LG}.mp4`);
const MUSICA = opzione('musica', 'genera');

const L = 1920, A = 1080, FPS = 24;

/* ── Durate: ogni schermata resta il tempo che serve a leggerla ───────────
   Non un tempo fisso: una schermata con quaranta parole in singalese non si
   legge nello stesso tempo di una con sei. Si parte da un minimo e si aggiunge
   in proporzione a quanto c'e' scritto.

   RITMO regola tutto insieme: sotto 1 il video scorre piu' svelto. Il primo
   montaggio era corretto ma lento — chi guarda un tutorial legge in fretta e
   riavvolge se gli serve, non aspetta che la schermata si decida a cambiare. */
const RITMO = Number(opzione('ritmo', '0.84'));
function durata(testo, minimo) {
  const n = String(testo || '').length;
  return RITMO * Math.max(minimo, Math.min(minimo + 9, minimo + n / 26));
}

const scene = [];
scene.push({ tipo: 'titolo', durata: 5.5 * RITMO });
scene.push({ tipo: 'intro', durata: durata(c.intro, 7) });
c.passi.forEach((p, i) => scene.push({ tipo: 'passo', i, durata: durata(p.testo, 7) }));
if (c.attenzione && c.attenzione.length) scene.push({ tipo: 'attenzione', durata: durata(c.attenzione.join(' '), 8) });
if (c.fonti && c.fonti.length) scene.push({ tipo: 'fonti', durata: 7 * RITMO });
scene.push({ tipo: 'finale', durata: 7 * RITMO });

let t0 = 0;
for (const s of scene) { s.da = t0; s.a = t0 + s.durata; t0 = s.a; }
const TOTALE = t0;

/* ── La pagina ────────────────────────────────────────────────────────── */
function pagina(font, logo) {
  const q = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const loc = famigliaLocale(LG);
  return `<style>
${font}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${L}px;height:${A}px;overflow:hidden;
  background:radial-gradient(115% 80% at 62% 12%,#2a2118 0%,#141109 60%,#0a0906 100%);
  font-family:${loc}'Satoshi',system-ui,sans-serif;color:#fdfbf7;-webkit-font-smoothing:antialiased}
.grana{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>");
  background-size:180px 180px}
.scena{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;
  padding:0 132px;opacity:0}
h1,h2,.numero{font-family:${loc}'Clash Grotesk',sans-serif;font-weight:700;letter-spacing:-.02em}
h1{font-size:86px;line-height:1.08}
h2{font-size:58px;line-height:1.14;margin-bottom:28px}
em{font-style:normal;color:#c2a15e}
p{font-size:44px;line-height:1.52;font-weight:400;color:#e8dfd2;max-width:1400px}
.occhiello{font-family:${loc}'Clash Grotesk',sans-serif;font-size:26px;font-weight:600;
  letter-spacing:.17em;text-transform:uppercase;color:#c2a15e;margin-bottom:22px}
.marchio{position:absolute;top:52px;right:60px;display:flex;align-items:center;gap:14px;
  font-family:'Clash Grotesk',sans-serif;font-weight:600;font-size:24px;color:rgba(253,251,247,.82)}
.marchio img{width:44px;height:44px;object-fit:contain;
  background:rgba(255,255,255,.94);border-radius:50%;padding:5px}
/* passo numerato */
.passo{display:flex;gap:44px;align-items:flex-start}
.numero{flex:0 0 auto;width:118px;height:118px;border-radius:50%;background:#c2a15e;color:#221a0e;
  display:flex;align-items:center;justify-content:center;font-size:54px}
.passo .corpo{flex:1 1 auto;min-width:0}
.passo h2{font-size:54px;margin-bottom:18px}
.passo p{max-width:none}
/* avvertenze */
.avvisi{display:flex;flex-direction:column;gap:20px;max-width:1200px}
.avviso{display:flex;gap:20px;align-items:flex-start;background:rgba(255,255,255,.055);
  border:1px solid rgba(255,255,255,.09);border-radius:18px;padding:26px 32px;
  font-size:38px;line-height:1.45;color:#efe7db}
.avviso .seg{color:#e0a84a;flex:0 0 auto;font-size:34px}
/* fonti */
.fonte{display:flex;align-items:center;gap:20px;font-size:38px;color:#e8dfd2;margin-bottom:18px}
.fonte .pun{width:10px;height:10px;border-radius:50%;background:#c2a15e;flex:0 0 auto}
.fonte b{font-weight:700;color:#fdfbf7}
/* finale */
.centro{align-items:center;text-align:center}
.pillola{display:inline-block;margin-top:30px;background:#c2a15e;color:#221a0e;border-radius:999px;
  padding:22px 58px;font-family:'Clash Grotesk',sans-serif;font-weight:700;font-size:40px}
.sito{margin-top:24px;font-family:'Clash Grotesk',sans-serif;font-weight:600;font-size:46px}
.minuta{position:absolute;left:0;right:0;bottom:44px;text-align:center;font-size:26px;
  color:rgba(255,255,255,.6)}
</style>
<div class="grana"></div>
<div class="marchio"><img src="${logo}" alt=""/>Easy Italia Hub</div>

<div class="scena" data-s="titolo">
  <div class="occhiello">${q(c.occhiello)}</div>
  <h1>${q(c.titolo)}</h1>
</div>

<div class="scena" data-s="intro"><p>${q(c.intro)}</p></div>

${c.passi.map((p, i) => `<div class="scena" data-s="passo" data-i="${i}"><div class="passo">
  <div class="numero">${i + 1}</div>
  <div class="corpo"><h2>${q(p.titolo)}</h2><p>${q(p.testo)}</p></div>
</div></div>`).join('\n')}

${c.attenzione && c.attenzione.length ? `<div class="scena" data-s="attenzione">
  <div class="occhiello">${q(c.attenzioneTitolo || '')}</div>
  <div class="avvisi">${c.attenzione.map((a) => `<div class="avviso"><span class="seg">▲</span>${q(a)}</div>`).join('')}</div>
</div>` : ''}

${c.fonti && c.fonti.length ? `<div class="scena" data-s="fonti">
  <div class="occhiello">${q(c.fontiTitolo || '')}</div>
  ${c.fonti.map((f) => `<div class="fonte"><span class="pun"></span><b>${q(f.nome)}</b> ${q(f.url)}</div>`).join('')}
</div>` : ''}

<div class="scena centro" data-s="finale">
  <h1 style="font-size:62px">${q(c.finale)}</h1>
  <div class="pillola">${q(c.invito)}</div>
  <div class="sito">easyitaliahub.it</div>
</div>
<div class="minuta" id="minuta">${q(c.avvertenza)}</div>`;
}

/* Lo stato al secondo `t`. Gira dentro il browser. */
const DISEGNA = `
window.disegna = function (t, scene) {
  var lisc = function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); };
  var tutte = document.querySelectorAll('.scena');
  for (var i = 0; i < tutte.length; i++) { tutte[i].style.opacity = 0; tutte[i].style.visibility = 'hidden'; }
  for (var j = 0; j < scene.length; j++) {
    var s = scene[j];
    if (t < s.da || t >= s.a) continue;
    var el = s.tipo === 'passo'
      ? document.querySelector('.scena[data-s="passo"][data-i="' + s.i + '"]')
      : document.querySelector('.scena[data-s="' + s.tipo + '"]');
    if (!el) continue;
    var r = t - s.da;
    // mezzo secondo per entrare, mezzo per uscire: si legge, non si rincorre
    var e = lisc(r / 0.5), u = 1 - lisc((r - (s.durata - 0.5)) / 0.5);
    el.style.visibility = 'visible';
    el.style.opacity = Math.min(e, u);
    el.style.transform = 'translateY(' + ((1 - e) * 22) + 'px)';
  }
};`;

/* La durata di un file, letta dal registro di ffmpeg. */
function durataFile(file) {
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

/* ── Montaggio ─────────────────────────────────────────────────────────── */
const font = await fontIncorporati([LG]);
const logo = 'data:image/webp;base64,' + readFileSync(path.join(RADICE, 'assets', 'img', 'logo-symbol.webp')).toString('base64');

mkdirSync(path.dirname(USCITA), { recursive: true });
const browser = await chromium.launch();
const pag = await browser.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
await pag.setContent(pagina(font, logo));
await pag.addScriptTag({ content: DISEGNA });
await pag.evaluate(() => document.fonts.ready);
await pag.waitForTimeout(400);

const ff = spawn(FF, ['-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '19',
  '-x264-params', 'aq-mode=3:aq-strength=1.1:deblock=-1,-1',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', USCITA]);
ff.stderr.on('data', (b) => process.stderr.write(b));
const finita = new Promise((ok, ko) => ff.on('close', (x) => (x === 0 ? ok() : ko(new Error('ffmpeg: ' + x)))));

const fotogrammi = Math.round(TOTALE * FPS);
for (let i = 0; i < fotogrammi; i++) {
  await pag.evaluate(([t, s]) => window.disegna(t, s), [i / FPS, scene]);
  const buf = await pag.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 200 === 0) process.stdout.write(`  ${i}/${fotogrammi}\r`);
}
ff.stdin.end();
await finita;
await browser.close();

/* ── Il tappeto sonoro ───────────────────────────────────────────────────
   Un video muto fa comparire l'icona dell'audio assente su parecchi lettori,
   e su YouTube il silenzio assoluto e' scomodo da guardare.

   Il tappeto e' la musica del promo, con la voce tolta: stessa identita'
   sonora di tutto il resto, e nessun diritto da chiedere a nessuno — che con
   la musica su YouTube e' meta' del problema. Sta in assets/audio/, e si e'
   ricavato separando le sorgenti del promo (demucs) e verificando col
   riconoscitore vocale che non restasse una parola.

   Dura meno del video, quindi si ripete: non tagliato di netto ma incrociato
   in dissolvenza, cosi' la giuntura non si sente.                          */
if (MUSICA !== 'no') {
  const tappeto = MUSICA === 'genera'
    ? path.join(RADICE, 'assets', 'audio', 'tappeto-promo.m4a')
    : MUSICA;
  if (!existsSync(tappeto)) {
    console.error('tappeto sonoro non trovato: ' + tappeto + ' — video lasciato muto');
  } else {
    const conAudio = USCITA.replace(/\.mp4$/, '.tmp.mp4');
    const INCROCIO = 2;
    // quante copie servono per coprire il video, tenuto conto che ogni
    // incrocio mangia due secondi
    const durataTappeto = await durataFile(tappeto);
    const copie = Math.max(1, Math.ceil((TOTALE + INCROCIO) / (durataTappeto - INCROCIO)));

    const ingressi = [];
    for (let i = 0; i < copie; i++) ingressi.push('-i', tappeto);
    let filtro = '', ultima = '[1:a]';
    for (let i = 2; i <= copie; i++) {
      const fuori = i === copie ? '[giro]' : `[c${i}]`;
      filtro += `${ultima}[${i}:a]acrossfade=d=${INCROCIO}:c1=tri:c2=tri${fuori};`;
      ultima = fuori;
    }
    if (copie === 1) filtro = '[1:a]anull[giro];';
    filtro += `[giro]atrim=0:${TOTALE.toFixed(2)},asetpts=N/SR/TB,` +
      `afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(0, TOTALE - 3).toFixed(2)}:d=3,` +
      `volume=${opzione('volume', '2')}dB[a]`;

    await new Promise((ok, ko) => {
      const p = spawn(FF, ['-v', 'error', '-i', USCITA, ...ingressi,
        '-filter_complex', filtro, '-map', '0:v', '-map', '[a]',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart', '-y', conAudio]);
      p.stderr.on('data', (b) => process.stderr.write(b));
      p.on('close', (x) => (x === 0 ? ok() : ko(new Error('ffmpeg audio: ' + x))));
    });
    renameSync(conAudio, USCITA);
  }
}

console.log(`${dati.id}.${LG} · ${TOTALE.toFixed(1)}s · ${USCITA}`);
