/* Infila nel promo brevi stacchi sul sito, a fine frase.

   Uso:  node scripts/monta-promo-stacchi.mjs <promo.mp4> <cartella-riprese> [uscita.mp4]

   Il promo mostra una persona che parla di una piattaforma che non si vede
   mai. Alla fine di ogni frase l'immagine si dissolve su due secondi di sito
   vero — la guida che scorre, l'assistente che si apre, il percorso — e poi
   torna.

   Stacchi, non inserimenti: il video resta della stessa durata e la voce
   continua sopra le riprese. Allungandolo, il parlato si sposterebbe rispetto
   alle labbra e il montaggio si vedrebbe tutto. E' anche il modo in cui si
   montano normalmente le riprese di appoggio: la voce tiene, l'immagine va a
   vedere di cosa sta parlando.

   I momenti sono le fini di frase, prese dalla trascrizione del parlato.     */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FF = process.env.FFMPEG || path.join(RADICE, 'node_modules', 'ffmpeg-static', 'ffmpeg');

const PROMO = process.argv[2];
const RIPRESE = process.argv[3];
const USCITA = process.argv[4] || path.join(RADICE, '.out', 'promo-stacchi.mp4');
if (!PROMO || !existsSync(PROMO) || !RIPRESE || !existsSync(RIPRESE)) {
  console.error('uso: node scripts/monta-promo-stacchi.mjs <promo.mp4> <cartella-riprese> [uscita.mp4]');
  process.exit(1);
}

const L = 1080, A = 1920, FPS = 24;
const TENUTA = 2.2;      // quanto si resta sul sito
const DISS = 0.35;       // dissolvenza, per lato
const PEZZO = TENUTA + DISS * 2;

/* Fini di frase del parlato, dalla trascrizione. Lo stacco parte un soffio
   prima, cosi' la dissolvenza comincia mentre la frase si posa. */
const STACCHI = [
  { a: 10.0, ripresa: 'guida' },
  { a: 22.0, ripresa: 'assistente' },
  { a: 33.0, ripresa: 'percorso' },
];

function durata(file) {
  return new Promise((ok, ko) => {
    const p = spawn(FF, ['-i', file, '-f', 'null', '-']);
    let log = '';
    p.stderr.on('data', (b) => (log += b));
    p.on('close', () => {
      const m = log.match(/time=(\d+):(\d+):(\d+\.\d+)/g);
      if (!m) return ko(new Error('durata non leggibile: ' + file));
      const u = m[m.length - 1].slice(5).split(':');
      ok(+u[0] * 3600 + +u[1] * 60 + +u[2]);
    });
  });
}

const ingressi = ['-i', PROMO];
const catene = [];
let sopra = '[0:v]';

for (let i = 0; i < STACCHI.length; i++) {
  const s = STACCHI[i];
  const file = path.join(RIPRESE, s.ripresa + '.webm');
  if (!existsSync(file)) { console.error('ripresa mancante: ' + file); process.exit(1); }
  // Si prende la coda della ripresa: e' li' che il gesto si compie. L'inizio
  // e' la pagina ferma che aspetta, e non racconta niente.
  const d = await durata(file);
  const da = Math.max(0, d - PEZZO);
  ingressi.push('-ss', da.toFixed(3), '-i', file);

  const n = i + 1;
  const inizio = s.a - 0.1;
  catene.push(
    `[${n}:v]fps=${FPS},scale=${L}:${A}:flags=lanczos,setsar=1,format=rgba,` +
    `trim=0:${PEZZO},setpts=PTS-STARTPTS,` +
    `fade=t=in:st=0:d=${DISS}:alpha=1,fade=t=out:st=${(PEZZO - DISS).toFixed(2)}:d=${DISS}:alpha=1,` +
    `setpts=PTS+${inizio.toFixed(3)}/TB[s${n}]`
  );
  const fuori = i === STACCHI.length - 1 ? '[v]' : `[m${n}]`;
  catene.push(`${sopra}[s${n}]overlay=0:0:eof_action=pass[${fuori.slice(1, -1)}]`);
  sopra = fuori;
}

mkdirSync(path.dirname(USCITA), { recursive: true });

await new Promise((ok, ko) => {
  const p = spawn(FF, [
    '-v', 'error', ...ingressi,
    '-filter_complex', catene.join(';'),
    '-map', '[v]', '-map', '0:a',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '19',
    '-x264-params', 'aq-mode=3:aq-strength=1.1:deblock=-1,-1',
    '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', '-y', USCITA,
  ]);
  p.stderr.on('data', (b) => process.stderr.write(b));
  p.on('close', (x) => (x === 0 ? ok() : ko(new Error('ffmpeg: ' + x))));
});

console.log('stacchi a ' + STACCHI.map((s) => s.a + 's · ' + s.ripresa).join(' | '));
console.log(USCITA);
