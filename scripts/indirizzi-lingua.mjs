/* Gli indirizzi delle pagine tradotte: riscritture, redirezioni, sitemap.

   La mappa vive in un posto solo — `assets/eih-lang-url.js`, perche' deve
   girare nel browser prima di tutto il resto. Questo script la legge da li' e
   ne fa scendere le conseguenze:

     · la radice e' la versione inglese, quella predefinita;
     · /it e' la versione italiana (stessi nomi di pagina);
     · /si e /ta usano gli spicchi internazionali (/si/forms, /ta/jobs);
     · /en non e' piu' una seconda copia dell'inglese: redirige alla radice
       con un 301, cosi' non resta un doppione da indicizzare;
     · sitemap.xml elenca le quattro lingue, con `en` e `x-default` sulla
       radice.

   Scritto a mano tutto questo sarebbero centinaia di regole: la prima svista
   si nota il giorno in cui una pagina non si apre piu'.

   Uso:  node scripts/indirizzi-lingua.mjs [--controlla]
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const SOLO_CONTROLLO = process.argv.includes('--controlla');
const BASE = 'https://easyitaliahub.it';

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
const generata = s => typeof s === 'string' &&
  (/^\/(it|en|si|ta)(\/|$)/.test(s) ||
   s.startsWith('/(en|si|ta)') || s.startsWith('/(si|ta)'));

const riscrittureTenute = (conf.rewrites || []).filter(r => !generata(r.source));
const redirezioniTenute = (conf.redirects || []).filter(r => !generata(r.source));

/* /en era la copia inglese; ora l'inglese e' la radice. Le regole precise
   vengono prima della regola generale, che resta come rete di sicurezza per
   un indirizzo non mappato. */
const nuoveRedirezioni = [];
for (const [it, ing] of voci) {
  nuoveRedirezioni.push({ source: `/en/${ing}`, destination: `/${it}`, permanent: true });
}
nuoveRedirezioni.push({ source: '/en', destination: '/', permanent: true });
nuoveRedirezioni.push({ source: '/en/:path*', destination: '/:path*', permanent: true });

/* Sotto /it si tengono i nomi italiani: uno spicchio inglese (/it/guides)
   porta al nome giusto con un 301 invece di sparire. Sotto /si e /ta vale la
   stessa regola di sempre: i vecchi nomi italiani portano allo spicchio
   internazionale. */
for (const [it, ing] of voci) {
  if (it === ing) continue;
  nuoveRedirezioni.push({ source: `/it/${ing}`, destination: `/it/${it}`, permanent: true });
  nuoveRedirezioni.push({ source: `/(si|ta)/${it}`, destination: `/$1/${ing}`, permanent: true });
}

/* Le riscritture specifiche vanno prima della generica `/si/:path*`, altrimenti
   quella acchiappa tutto e /si/forms cerca un file forms.html che non esiste. */
const nuoveRiscritture = [];
for (const [it, ing] of voci) {
  if (it !== ing) nuoveRiscritture.push({ source: `/(si|ta)/${ing}`, destination: `/${it}` });
}
nuoveRiscritture.push({ source: '/it', destination: '/' });
nuoveRiscritture.push({ source: '/it/:path*', destination: '/:path*' });
nuoveRiscritture.push({ source: '/(si|ta)', destination: '/' });
nuoveRiscritture.push({ source: '/(si|ta)/:path*', destination: '/:path*' });

conf.rewrites = [...riscrittureTenute, ...nuoveRiscritture];
conf.redirects = [...redirezioniTenute, ...nuoveRedirezioni];

/* Le home non possono dichiarare il canonical nell'HTML: lo stesso file serve
   la radice e il prefisso. Lo dice l'header Link, che vede l'indirizzo vero. */
const linkCasa = r => (r.headers || []).some(h => h.key === 'Link' && /rel="canonical"/.test(h.value));
const headersTenuti = (conf.headers || []).filter(r =>
  !(['/', '/it', '/si', '/ta'].includes(r.source) && linkCasa(r)));
conf.headers = [
  ...headersTenuti,
  { source: '/', headers: [{ key: 'Link', value: `<${BASE}/>; rel="canonical"` }] },
  { source: '/it', headers: [{ key: 'Link', value: `<${BASE}/it>; rel="canonical"` }] },
  { source: '/si', headers: [{ key: 'Link', value: `<${BASE}/si>; rel="canonical"` }] },
  { source: '/ta', headers: [{ key: 'Link', value: `<${BASE}/ta>; rel="canonical"` }] }
];

/* ── ogni pagina dichiara il proprio nome ─────────────────────────────────
   Lo snippet in cima al <head> fa partire la richiesta del dizionario prima di
   tutto il resto, e finora ricavava il nome della pagina dall'indirizzo. Con
   gli spicchi tradotti quel calcolo sbaglia: da /si/forms chiedeva
   forms.si.json, che non esiste, e la traduzione arrivava al secondo tentativo.

   Portarsi dietro la mappa in ogni pagina sarebbe stato pesante — e' inline in
   sessantaquattro file. Molto meglio: ogni pagina sa gia' come si chiama, basta
   che lo dica. Qui si controlla che lo dica, e che dica il vero. */
const paginaHtml = readdirSync('.').filter(f => f.endsWith('.html'));
let dichiarate = 0, sistemate = 0;
for (const file of paginaHtml) {
  const nome = file.slice(0, -5);
  let html = readFileSync(file, 'utf8');
  if (!/window\.EIH_LANG=_l;/.test(html)) continue;
  const prima = html;
  /* Il canonical statico non può portare la radice assoluta: sotto /it
     dichiarerebbe inglese la pagina italiana. Relativo allo spicchio,
     risolve alla radice o a /it/... a seconda dell'indirizzo. La home non
     ce l'ha: senza tag ogni suo indirizzo è canonico di sé (e l'header Link
     qui sotto lo dice esplicitamente). */
  html = html.replace(/<link\s+rel="canonical"\s+href="https:\/\/easyitaliahub\.it\/([^"]*)"\s*\/?>/i,
    (m, p) => p ? `<link rel="canonical" href="${p}"/>` : '');
  html = html.replace(/<link\s+rel="canonical"\s+href="\/([^"]*)"\s*\/?>/i,
    (m, p) => p ? `<link rel="canonical" href="${p}"/>` : '');
  const giusto = `window.EIH_LANG=_l;window.EIH_PAGINA=${JSON.stringify(nome)};`;
  html = html.replace(/window\.EIH_LANG=_l;(window\.EIH_PAGINA="[^"]*";)?/, giusto);
  // e il calcolo dal percorso lascia il posto al nome dichiarato
  html = html.replace(
    /var _p=location\.pathname\.replace\(\/\^\\\/\(en\|si\|ta\)\(\?=\\\/\|\$\)\/,""\)\.replace\(\/\^\\\/\+\|\\\/\+\$\/g,""\)\.replace\(\/\\\.html\$\/,""\)\|\|"index";/,
    'var _p=window.EIH_PAGINA||"index";');
  dichiarate++;
  if (html !== prima && !SOLO_CONTROLLO) { writeFileSync(file, html); sistemate++; }
}
console.log('pagine che dichiarano il proprio nome:', dichiarate, '· sistemate:', sistemate);

/* ── sitemap.xml ──────────────────────────────────────────────────────────
   Non si riscrive da zero: si leggono i gruppi gia' presenti (una pagina,
   quattro lingue) e si rimette in ordine ogni gruppo. Cosi' restano le pagine
   scelte, le date e le priorita', e lo script e' ripetibile. */
const xml = readFileSync('sitemap.xml', 'utf8');
const testa = xml.slice(0, xml.indexOf('<url>')).replace(/\s+$/, '') + '\n';
const coda = '</urlset>\n';
const grezzi = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => m[1]);
const gruppi = [];
const indice = new Map();
for (const b of grezzi) {
  const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1];
  const itHref = (b.match(/hreflang="it" href="([^"]+)"/) || [])[1];
  if (!loc || !itHref) continue;
  if (!indice.has(itHref)) {
    const g = { chiave: itHref, lingue: {} };
    indice.set(itHref, g);
    gruppi.push(g);
  }
  let percorso = '';
  try { percorso = new URL(loc).pathname; } catch (e) { continue; }
  const m = percorso.match(/^\/(en|it|si|ta)(?=\/|$)/);
  indice.get(itHref).lingue[m ? m[1] : 'radice'] = b;
}

const valore = (b, tag) => b ? ((b.match(new RegExp(`<${tag}>([^<]+)</${tag}>`)) || [])[1] || '') : '';

let cambiati = 0;
const nuoveUrl = [];
for (const g of gruppi) {
  /* La chiave e' l'indirizzo italiano: nella prima versione era la radice,
     dopo il primo giro e' /it/... */
  let percorso = new URL(g.chiave).pathname;
  if (percorso === '/it') percorso = '/';
  else if (percorso.startsWith('/it/')) percorso = percorso.slice(3);
  const nome = percorso === '/' ? 'index' : percorso.slice(1);
  const ing = SLUG[nome] || nome;
  const enUrl = BASE + percorso;
  const itUrl = BASE + '/it' + (percorso === '/' ? '' : percorso);
  const siUrl = BASE + '/si' + (percorso === '/' ? '' : '/' + ing);
  const taUrl = BASE + '/ta' + (percorso === '/' ? '' : '/' + ing);

  const alternati = [['en', enUrl], ['it', itUrl], ['si', siUrl], ['ta', taUrl], ['x-default', enUrl]]
    .map(([l, h]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`).join('');

  const radice = g.lingue.radice || g.lingue.en;
  const italiano = g.lingue.it || g.lingue.radice;
  const righe = [
    [radice, enUrl, valore(radice, 'priority') || '0.8'],
    [italiano, itUrl, valore(italiano, 'priority') || '0.8'],
    [g.lingue.si, siUrl, valore(g.lingue.si, 'priority') || '0.7'],
    [g.lingue.ta, taUrl, valore(g.lingue.ta, 'priority') || '0.7']
  ];

  for (const [b, loc, priorita] of righe) {
    if (!b) continue;
    const lastmod = valore(b, 'lastmod');
    const changefreq = valore(b, 'changefreq');
    nuoveUrl.push(`  <url><loc>${loc}</loc>` +
      (lastmod ? `<lastmod>${lastmod}</lastmod>` : '') +
      (changefreq ? `<changefreq>${changefreq}</changefreq>` : '') +
      `<priority>${priorita}</priority>${alternati}</url>`);
  }
  cambiati++;
}
const nuovoSitemap = testa + nuoveUrl.join('\n') + '\n' + coda;

if (SOLO_CONTROLLO) {
  console.log('riscritture da scrivere:', nuoveRiscritture.length,
              '· redirezioni:', nuoveRedirezioni.length, '· pagine in sitemap:', cambiati);
  process.exit(0);
}

writeFileSync('vercel.json', JSON.stringify(conf, null, 2) + '\n');
writeFileSync('sitemap.xml', nuovoSitemap);
console.log('vercel.json  ·', nuoveRiscritture.length, 'riscritture,', nuoveRedirezioni.length, 'redirezioni');
console.log('sitemap.xml  ·', cambiati, 'pagine,', nuoveUrl.length, 'indirizzi');
