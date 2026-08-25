/* Gli indirizzi delle pagine tradotte: riscritture, redirezioni, sitemap.

   La mappa vive in un posto solo — `assets/eih-lang-url.js`, perché deve
   girare nel browser prima di tutto il resto. Questo script la legge da lì e
   ne fa scendere tre conseguenze:

     1. `vercel.json` · una riscrittura per pagina: /en/forms serve /moduli.
        Il file HTML resta uno, in italiano: non si duplica niente.
     2. `vercel.json` · una redirezione per pagina: /en/moduli → /en/forms,
        permanente. I vecchi indirizzi restano validi e portano al nuovo, così
        un link già condiviso non muore e Google non vede due pagine uguali.
     3. `sitemap.xml` · gli indirizzi sotto prefisso passano allo spicchio
        internazionale, negli <loc> e negli hreflang.

   Scritto a mano tutto questo sarebbero centoventi regole: la prima svista si
   nota il giorno in cui una pagina non si apre più.

   Uso:  node scripts/indirizzi-lingua.mjs [--controlla]
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const SOLO_CONTROLLO = process.argv.includes('--controlla');
const LINGUE = ['en', 'si', 'ta'];

/* ── la mappa, letta dalla sua unica casa ─────────────────────────────── */
const sorgente = readFileSync('assets/eih-lang-url.js', 'utf8');
const blocco = sorgente.match(/var SLUG = \{([\s\S]*?)\n  \};/);
if (!blocco) {
  console.error('mappa degli indirizzi non trovata in assets/eih-lang-url.js');
  process.exit(1);
}
const SLUG = {};
for (const m of blocco[1].matchAll(/'([^']+)':\s*'([^']+)'/g)) SLUG[m[1]] = m[2];
const voci = Object.entries(SLUG);
console.log(voci.length, 'pagine nella mappa');

const doppioni = voci.map(([, s]) => s).filter((s, i, a) => a.indexOf(s) !== i);
if (doppioni.length) {
  console.error('due pagine con lo stesso indirizzo:', [...new Set(doppioni)].join(', '));
  process.exit(1);
}

/* ── vercel.json ──────────────────────────────────────────────────────── */
const conf = JSON.parse(readFileSync('vercel.json', 'utf8'));

// Le regole generate si riconoscono e si rifanno da capo a ogni giro; quelle
// scritte a mano (dominio, abbonamenti) restano dove sono.
const miaRiscrittura = r => typeof r.source === 'string' &&
  /^\/\(en\|si\|ta\)\//.test(r.source) && r.source !== '/(en|si|ta)/:path*';
const miaRedirezione = r => typeof r.destination === 'string' && /^\/\$1\//.test(r.destination) &&
  /^\/\(en\|si\|ta\)\//.test(r.source);

const riscrittureTenute = (conf.rewrites || []).filter(r => !miaRiscrittura(r));
const redirezioniTenute = (conf.redirects || []).filter(r => !miaRedirezione(r));

const nuoveRiscritture = voci
  .filter(([it, ing]) => it !== ing)
  .map(([it, ing]) => ({ source: `/(en|si|ta)/${ing}`, destination: `/${it}` }));

const nuoveRedirezioni = voci
  .filter(([it, ing]) => it !== ing)
  .map(([it, ing]) => ({ source: `/(en|si|ta)/${it}`, destination: `/$1/${ing}`, permanent: true }));

/* L'ordine conta. Le riscritture specifiche vanno prima della generica
   `/(en|si|ta)/:path*`, altrimenti quella acchiappa tutto e /en/forms cerca
   un file forms.html che non esiste. */
const generiche = riscrittureTenute.filter(r => /:path\*/.test(r.source) || r.source === '/(en|si|ta)');
const altre = riscrittureTenute.filter(r => !generiche.includes(r));
conf.rewrites = [...altre, ...nuoveRiscritture, ...generiche];
/* Le redirezioni invece stanno davanti alle riscritture per definizione: qui
   basta accodarle a quelle scritte a mano. */
conf.redirects = [...redirezioniTenute, ...nuoveRedirezioni];

/* ── ogni pagina dichiara il proprio nome ─────────────────────────────────
   Lo snippet in cima al <head> fa partire la richiesta del dizionario prima di
   tutto il resto, e finora ricavava il nome della pagina dall'indirizzo. Con
   gli spicchi tradotti quel calcolo sbaglia: da /en/forms chiedeva
   forms.en.json, che non esiste, e la traduzione arrivava al secondo tentativo.

   Portarsi dietro la mappa in ogni pagina sarebbe stato pesante — è inline in
   sessantaquattro file. Molto meglio: ogni pagina sa già come si chiama, basta
   che lo dica. Qui si controlla che lo dica, e che dica il vero. */
const paginaHtml = readdirSync('.').filter(f => f.endsWith('.html'));
let dichiarate = 0, sistemate = 0;
for (const file of paginaHtml) {
  const nome = file.slice(0, -5);
  let html = readFileSync(file, 'utf8');
  if (!/window\.EIH_LANG=_l;/.test(html)) continue;
  const giusto = `window.EIH_LANG=_l;window.EIH_PAGINA=${JSON.stringify(nome)};`;
  const prima = html;
  html = html.replace(/window\.EIH_LANG=_l;(window\.EIH_PAGINA="[^"]*";)?/, giusto);
  // e il calcolo dal percorso lascia il posto al nome dichiarato
  html = html.replace(
    /var _p=location\.pathname\.replace\(\/\^\\\/\(en\|si\|ta\)\(\?=\\\/\|\$\)\/,""\)\.replace\(\/\^\\\/\+\|\\\/\+\$\/g,""\)\.replace\(\/\\\.html\$\/,""\)\|\|"index";/,
    'var _p=window.EIH_PAGINA||"index";');
  dichiarate++;
  if (html !== prima && !SOLO_CONTROLLO) { writeFileSync(file, html); sistemate++; }
}
console.log('pagine che dichiarano il proprio nome:', dichiarate, '· sistemate:', sistemate);

/* ── sitemap.xml ──────────────────────────────────────────────────────── */
let sitemap = readFileSync('sitemap.xml', 'utf8');
let cambi = 0;
for (const [it, ing] of voci) {
  if (it === ing) continue;
  for (const lg of LINGUE) {
    const da = new RegExp(`(https://easyitaliahub\\.it/${lg}/)${it}(?=["<])`, 'g');
    sitemap = sitemap.replace(da, (t, capo) => { cambi++; return capo + ing; });
  }
}

if (SOLO_CONTROLLO) {
  console.log('riscritture da scrivere:', nuoveRiscritture.length,
              '· redirezioni:', nuoveRedirezioni.length, '· indirizzi in sitemap:', cambi);
  process.exit(0);
}

writeFileSync('vercel.json', JSON.stringify(conf, null, 2) + '\n');
writeFileSync('sitemap.xml', sitemap);
console.log('vercel.json  ·', nuoveRiscritture.length, 'riscritture,', nuoveRedirezioni.length, 'redirezioni');
console.log('sitemap.xml  ·', cambi, 'indirizzi aggiornati');
