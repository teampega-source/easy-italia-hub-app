/* Ottimizza una foto per il sito: ritaglia a 5:4, converte in WebP e la pesa.
   Uso: node monta-hero.js <file-immagine> "<testo alternativo>" <destinazione>
   La hero mostra l'anteprima del Consigliere AI, non piu una foto: questo
   script serve quando si vuole rimettere una foto vera da qualche parte. */
const sharp = require('sharp');   // npm i sharp
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const [src, alt] = process.argv.slice(2);
if (!src || !alt) { console.error('Uso: node monta-hero.js <img> "<alt>"'); process.exit(1); }

const DEST = path.join(ROOT, 'assets/img/community-welcome.webp');
const IDX  = path.join(ROOT, 'index.html');

(async () => {
  const meta = await sharp(src).metadata();
  console.log('originale:', meta.width + 'x' + meta.height, meta.format);

  // 5:4 come l'attuale (1402x1122): si ritaglia al centro solo se serve
  const W = 1400, H = Math.round(W * 1122 / 1402);
  const info = await sharp(src)
    .resize(W, H, { fit: 'cover', position: 'attention' })
    .webp({ quality: 82 })
    .toFile(DEST);
  const kb = Math.round(info.size / 1024);
  console.log('nuova hero:', info.width + 'x' + info.height, kb + ' KB');
  if (kb > 150) console.log('ATTENZIONE: oltre i 150 KB, abbassare la qualità');

  let s = fs.readFileSync(IDX, 'utf8');
  const re = /(<img src="\/assets\/img\/community-welcome\.webp"[^>]*?)width="\d+" height="\d+"([^>]*?)alt="[^"]*"/;
  if (!re.test(s)) { console.error('FALLITO: tag immagine non trovato'); process.exit(1); }
  s = s.replace(re, `$1width="${info.width}" height="${info.height}"$2alt="${alt.replace(/"/g, '&quot;')}"`);
  fs.writeFileSync(IDX, s);
  console.log('index.html: dimensioni e testo alternativo aggiornati');
})();
