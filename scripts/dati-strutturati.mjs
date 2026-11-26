/* Quello che i motori di ricerca devono poter leggere, scritto dentro le pagine.

   Due cose in un colpo solo:

   1. **Le lingue.** La pagina senza prefisso e' quella predefinita e parla
      inglese: la dichiarano `en` e `x-default`. L'italiano vive sotto /it, il
      sinhala sotto /si e il tamil sotto /ta. Il collegamento `hreflang` dentro
      la pagina e' la prova che le quattro versioni sono la stessa pagina:
      senza, si fanno concorrenza fra loro.

   2. **Il dato strutturato.** Una `BreadcrumbList` — Home › pagina — e una
      `WebPage` con `dateModified` presa da git, ma **solo** se la pagina non
      ha gia' un `Article` (le guide ce l'hanno: due schede per la stessa
      pagina si contraddicono a vicenda). Sulla sola home, `WebSite` con la
      ricerca interna e `Organization`.

   I nomi delle briciole e delle pagine vengono dal `<title>`, gia' inglese:
   cosi' non c'e' una seconda traduzione da tenere aggiornata. Le domande
   frequenti stanno in `scripts/faq-en.mjs`, perche' il testo italiano nel
   markup non e' quello che l'utente legge.

   Le pagine `noindex` restano fuori: dichiarare le lingue di una pagina che
   chiedi di non indicizzare e' la stessa contraddizione che
   `audit-indicizzazione.py` va a caccia di trovare.

   Fra i due marcatori non si scrive a mano: al giro dopo viene sovrascritto.

   Uso: node scripts/dati-strutturati.mjs
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { FAQ_EN } from './faq-en.mjs';

const BASE = 'https://easyitaliahub.it';
const LINGUE = ['en', 'it', 'si', 'ta'];

/* Gli indirizzi sotto /si e /ta hanno lo spicchio internazionale
   (/si/forms, non /si/moduli). /it invece tiene i nomi italiani, perche' e'
   la versione italiana. La mappa sta in assets/eih-lang-url.js, dove serve al
   browser: qui si legge da li', per non tenerne due copie che prima o poi
   divergono. */
const SLUG = (() => {
  const src = readFileSync('assets/eih-lang-url.js', 'utf8');
  const blocco = src.match(/var SLUG = \{([\s\S]*?)\n  \};/);
  const m = {};
  if (blocco) for (const v of blocco[1].matchAll(/'([^']+)':\s*'([^']+)'/g)) m[v[1]] = v[2];
  return m;
})();
const fuga = s => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
const INIZIO = '<!-- seo:inizio — generato da scripts/dati-strutturati.mjs, non scrivere qui -->';
const FINE = '<!-- seo:fine -->';

function pagine() {
  return readdirSync('.')
    .filter(f => f.endsWith('.html'))
    .map(f => f.slice(0, -5))
    .filter(n => !['404', 'offline'].includes(n));
}

function indicizzabile(html) {
  return !/<meta\s+name="robots"[^>]*content="[^"]*noindex/i.test(html);
}

function titolo(html) {
  const m = html.match(/<title>([^<]*)<\/title>/);
  if (!m) return null;
  /* Il titolo della scheda e' «Pagina — Easy Italia Hub»: nella briciola di
     pane ci va la pagina, non il nome del sito. Si toglie solo la coda, cosi'
     i titoli lunghi delle guide restano interi. */
  const senzaSito = m[1]
    .replace(/\s*—\s*Easy Italia Hub\s*$/, '')
    .replace(/\s*·\s*Easy Italia Hub\s*$/, '')
    .trim();
  return senzaSito || m[1].trim();
}

function ultimaModifica(file) {
  try { return execSync(`git log -1 --format=%cs -- ${file}`, { encoding: 'utf8' }).trim() || null; }
  catch { return null; }
}

function indirizzo(nome, lg) {
  const coda = nome === 'index' ? '' : '/' + nome;
  if (lg === 'en') return BASE + (coda || '/');
  if (lg === 'it') return BASE + '/it' + coda;
  const internazionale = nome === 'index' ? '' : '/' + (SLUG[nome] || nome);
  return BASE + '/' + lg + internazionale;
}

function blocco(nome, html) {
  const t = titolo(html) || nome;
  const righe = LINGUE.map(l =>
    `<link rel="alternate" hreflang="${l}" href="${indirizzo(nome, l)}"/>`
  ).concat([
    `<link rel="alternate" hreflang="x-default" href="${indirizzo(nome, 'en')}"/>`
  ]);

  const dati = [];

  /* La home ha gia' un `@graph` scritto a mano con Organization, WebSite e
     WebPage. Aggiungerne altri sarebbe dichiarare due volte chi siamo, con
     due schede che prima o poi divergono: si guarda cosa c'e' e si aggiunge
     solo quello che manca. */
  /* Si guarda la pagina SENZA il blocco generato: altrimenti al secondo giro
     il controllo trova quello che ha scritto lui al primo, conclude che c'e'
     gia' e non scrive piu' niente. Un generatore che si legge addosso si
     svuota da solo. */
  const proprio = html.replace(new RegExp(fuga(INIZIO) + '[\\s\\S]*?' + fuga(FINE)), '');
  const gia = t => new RegExp('"@type"\\s*:\\s*"' + t + '"').test(proprio);

  if (nome === 'index') {
    if (!gia('WebSite')) dati.push({
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: 'Easy Italia Hub', url: BASE + '/',
      inLanguage: ['en', 'it', 'si', 'ta'],
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: BASE + '/cerca?q={search_term_string}' },
        'query-input': 'required name=search_term_string'
      }
    });
    if (!gia('Organization')) dati.push({
      '@context': 'https://schema.org', '@type': 'Organization',
      name: 'Easy Italia Hub', url: BASE + '/',
      logo: BASE + '/assets/apple-touch-icon.png',
      description: 'Guides, multilingual AI assistant and community for the Sri Lankan community in Italy.'
    });
  } else {
    dati.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Easy Italia Hub', item: BASE + '/' },
        { '@type': 'ListItem', position: 2, name: t, item: indirizzo(nome, 'en') }
      ]
    });
    /* Le guide hanno gia' il loro `Article` da verifica-fonti.mjs: aggiungere
       una `WebPage` sulla stessa pagina vorrebbe dire dichiarare due volte la
       stessa cosa con date che prima o poi divergono. */
    if (!gia('Article') && !gia('WebPage')) {
      const d = ultimaModifica(nome + '.html');
      const w = {
        '@context': 'https://schema.org', '@type': 'WebPage',
        name: t, url: indirizzo(nome, 'en'), inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'Easy Italia Hub', url: BASE + '/' }
      };
      if (d) w.dateModified = d;
      dati.push(w);
    }
  }

  /* Domande frequenti: dove ci sono davvero, si dichiarano. I testi vengono
     da scripts/faq-en.mjs — la pagina si presenta in inglese, e il JSON-LD
     deve descrivere quello che si legge, non l'italiano del markup. */
  const faq = FAQ_EN[nome] || [];
  if (faq.length && !gia('FAQPage')) {
    dati.push({
      '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'en',
      mainEntity: faq.map(q => ({
        '@type': 'Question', name: q.q,
        acceptedAnswer: { '@type': 'Answer', text: q.a }
      }))
    });
  }

  return INIZIO + '\n' + righe.join('\n') + '\n' +
    dati.map(o => '<script type="application/ld+json">' + JSON.stringify(o) + '</' + 'script>').join('\n') +
    '\n' + FINE;
}

let scritte = 0, saltate = [], senzaAggancio = [];

for (const nome of pagine()) {
  const file = nome + '.html';
  let html = readFileSync(file, 'utf8');

  if (!indicizzabile(html)) {
    /* Se una pagina e' diventata noindex dopo un giro precedente, il blocco
       vecchio va tolto: resterebbe a dichiarare lingue di una pagina che
       chiediamo di ignorare. */
    if (html.includes(INIZIO)) {
      html = html.replace(new RegExp('\\n?' + fuga(INIZIO) + '[\\s\\S]*?' + fuga(FINE)), '');
      writeFileSync(file, html);
    }
    saltate.push(nome);
    continue;
  }

  const nuovo = blocco(nome, html);

  if (html.includes(INIZIO)) {
    html = html.replace(new RegExp(fuga(INIZIO) + '[\\s\\S]*?' + fuga(FINE)), nuovo);
  } else {
    /* Sotto il canonical: sono la stessa famiglia di dichiarazioni, e chi apre
       il sorgente le trova insieme. Se ci sono hreflang scritti a mano si
       tolgono, o finirebbero doppi. */
    const vecchi = /(?:[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\/>\n?)+/;
    if (vecchi.test(html)) html = html.replace(vecchi, '');
    const can = /(<link rel="canonical"[^>]*>)/;
    if (!can.test(html)) { senzaAggancio.push(nome); continue; }
    html = html.replace(can, '$1\n' + nuovo);
  }
  writeFileSync(file, html);
  scritte++;
}

console.log('pagine con dati strutturati e lingue:', scritte);
console.log('fuori indice, saltate:', saltate.length, '—', saltate.join(', '));
if (senzaAggancio.length) console.log('senza canonical, da guardare a mano:', senzaAggancio.join(', '));
