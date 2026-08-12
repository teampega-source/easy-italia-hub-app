/* Quello che i motori di ricerca devono poter leggere, scritto dentro le pagine.

   Due buchi, trovati contando:

   1. **Le lingue.** La mappa del sito dichiara che ogni pagina esiste in
      italiano, inglese, sinhala e tamil. Le pagine no: l'unica che lo diceva
      era la home. Per Google la mappa è un suggerimento, il collegamento
      `hreflang` dentro la pagina è la prova — senza, le quattro versioni non
      risultano la stessa pagina, si fanno concorrenza fra loro e chi cerca in
      sinhala non trova la versione in sinhala.

   2. **Il dato strutturato.** Ce l'avevano 21 pagine su 61, e sono le guide,
      dove l'ha messo `verifica-fonti.mjs`. Alle altre mancava tutto: nessuna
      briciola di pane, nessuna identità del sito, nessuna data.

   Cosa scrive, per ogni pagina indicizzabile:
     - i cinque collegamenti di lingua (it, en, si, ta, x-default);
     - una `BreadcrumbList` — Home › pagina;
     - una `WebPage` con `dateModified` presa da git, ma **solo** se la pagina
       non ha già un `Article` (le guide ce l'hanno: due schede per la stessa
       pagina si contraddicono a vicenda);
     - sulla sola home, `WebSite` con la ricerca interna e `Organization`.

   Le pagine `noindex` restano fuori: dichiarare le lingue di una pagina che
   chiedi di non indicizzare è la stessa contraddizione che
   `audit-indicizzazione.py` va a caccia di trovare.

   Fra i due marcatori non si scrive a mano: al giro dopo viene sovrascritto.

   Uso: node scripts/dati-strutturati.mjs
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const BASE = 'https://easyitaliahub.it';
const LINGUE = ['en', 'si', 'ta'];
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
  /* Il titolo della scheda è «Pagina — Easy Italia Hub»: nella briciola di pane
     ci va solo la prima metà, o si legge «Home › Mappa — Easy Italia Hub». */
  return m[1].split('—')[0].trim() || m[1].trim();
}

function ultimaModifica(file) {
  try { return execSync(`git log -1 --format=%cs -- ${file}`, { encoding: 'utf8' }).trim() || null; }
  catch { return null; }
}

function indirizzo(nome, lg) {
  const coda = nome === 'index' ? '' : '/' + nome;
  if (lg === 'it') return BASE + (coda || '/');
  return BASE + '/' + lg + coda;
}

function testo(html) {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function domande(html) {
  const fuori = [];

  /* Due forme nel sito, entrambe legittime: la home usa <details><summary>,
     community e guida-conti un <button> con `aria-controls` che punta alla
     risposta. Si leggono tutte e due invece di uniformare il markup: cambiare
     l'HTML di tre pagine per far contento un generatore è il verso sbagliato. */
  const dettagli = /<summary class="faq-q">([\s\S]*?)<\/summary>\s*<div class="faq-a"[^>]*>([\s\S]*?)<\/div>/g;
  let m;
  while ((m = dettagli.exec(html))) {
    const d = testo(m[1]), r = testo(m[2]);
    if (d && r) fuori.push({ d, r });
  }

  /* Terza forma, in guida-conti: pulsante senza `aria-controls`, con la
     risposta nel div subito dopo. Qui «il div che viene dopo» è l'unica cosa
     che c'è, quindi si prende quello — ma solo se attacca subito. */
  const vicini = /<button class="faq-q"[^>]*>([\s\S]*?)<\/button>\s*<div class="faq-a">([\s\S]*?)<\/div>\s*<\/div>/g;
  while ((m = vicini.exec(html))) {
    const d = testo(m[1]), r = testo(m[2]);
    if (d && r) fuori.push({ d, r });
  }

  const bottoni = /<button class="faq-q"[^>]*aria-controls="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g;
  while ((m = bottoni.exec(html))) {
    const d = testo(m[2]);
    if (!d) continue;
    /* La risposta si trova dall'identificativo dichiarato dal pulsante: si
       prende quella vera, non «il div che viene dopo». */
    const attributo = html.indexOf('id="' + m[1] + '"');
    if (attributo === -1) continue;
    /* Si parte dopo la chiusura del tag: partendo dall'attributo, dentro la
       risposta finivano `role="region" aria-labelledby="..."` e compagnia. */
    const dopo = html.indexOf('>', attributo);
    if (dopo === -1) continue;
    const fine = html.indexOf('</div></div>', dopo);
    const r = testo(html.slice(dopo + 1, fine === -1 ? dopo + 4000 : fine));
    if (r) fuori.push({ d, r });
  }

  return fuori;
}

function blocco(nome, html) {
  const t = titolo(nome === 'index' ? html : html) || nome;
  const righe = [
    `<link rel="alternate" hreflang="it" href="${indirizzo(nome, 'it')}"/>`,
    ...LINGUE.map(l => `<link rel="alternate" hreflang="${l}" href="${indirizzo(nome, l)}"/>`),
    `<link rel="alternate" hreflang="x-default" href="${indirizzo(nome, 'it')}"/>`
  ];

  const dati = [];

  /* La home aveva gia' un `@graph` scritto a mano con Organization, WebSite e
     WebPage. Aggiungerne altri due sarebbe stato dichiarare due volte chi
     siamo, con due schede che prima o poi divergono: si guarda cosa c'e' e si
     aggiunge solo quello che manca. */
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
      inLanguage: ['it', 'en', 'si', 'ta'],
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
      description: 'Guide, strumenti e community per la comunità srilankese in Italia.'
    });
  } else {
    dati.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Easy Italia Hub', item: BASE + '/' },
        { '@type': 'ListItem', position: 2, name: t, item: indirizzo(nome, 'it') }
      ]
    });
    /* Le guide hanno già il loro `Article` da verifica-fonti.mjs: aggiungere
       una `WebPage` sulla stessa pagina vorrebbe dire dichiarare due volte la
       stessa cosa con date che prima o poi divergono. */
    if (!gia('Article') && !gia('WebPage')) {
      const d = ultimaModifica(nome + '.html');
      const w = {
        '@context': 'https://schema.org', '@type': 'WebPage',
        name: t, url: indirizzo(nome, 'it'),
        isPartOf: { '@type': 'WebSite', name: 'Easy Italia Hub', url: BASE + '/' }
      };
      if (d) w.dateModified = d;
      dati.push(w);
    }
  }

  /* Domande frequenti: dove ci sono davvero, si dichiarano. È l'unico dato
     strutturato che cambia come la pagina appare fra i risultati — Google
     mostra le domande sotto il titolo — e finora nessuna delle tre pagine che
     le hanno lo diceva. Si legge il markup che c'è (`<summary class="faq-q">`
     + `<div class="faq-a">`), non si inventa: se una risposta non si trova,
     quella domanda si salta. */
  const faq = domande(html);
  if (faq.length && !gia('FAQPage')) {
    dati.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.map(q => ({
        '@type': 'Question', name: q.d,
        acceptedAnswer: { '@type': 'Answer', text: q.r }
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
    /* Se una pagina è diventata noindex dopo un giro precedente, il blocco
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
       il sorgente le trova insieme. La home ha già i suoi hreflang scritti a
       mano: si tolgono, o finirebbero doppi. */
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
