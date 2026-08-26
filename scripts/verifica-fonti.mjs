/* Le fonti ufficiali delle guide: raccolta, controllo, registro.

   Perché esiste. La fascia «Aggiornato: giugno 2026 · Fonte: INPS» era scritta
   a mano dentro ogni pagina. Una data scritta a mano invecchia da sola: nessuno
   la aggiorna, e dopo un anno dice una bugia con l'aria di dire il vero. Peggio
   ancora il link: `interno.gov.it/.../ricongiungimento-familiare` rispondeva
   404 e nessuno se n'era accorto — su una guida al ricongiungimento familiare,
   cioè proprio dove chi legge sta per portare la famiglia in Italia.

   Cosa fa. Per ogni guida:
     1. raccoglie i link a domini ufficiali già presenti nella pagina;
     2. li chiama uno per uno e guarda che rispondano;
     3. legge da git quando il file è cambiato l'ultima volta;
     4. scrive tutto in `assets/eih-verifica-dati.js`.

   Cosa NON fa: non inventa date di verifica del contenuto. Il registro tiene
   `contenuto: null` finché una persona non ha riletto la guida davvero. Una
   data di verifica messa da un programma sarebbe la stessa bugia di prima, solo
   automatizzata.

   Uso:
     node scripts/verifica-fonti.mjs            # rigenera il registro
     node scripts/verifica-fonti.mjs --controlla # esce 1 se un link è rotto
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SOLO_CONTROLLO = process.argv.includes('--controlla');

/* Le pagine che parlano di norme, soldi, documenti o salute: quelle dove una
   fonte sbagliata non è un fastidio ma un danno. */
const GUIDE = [
  'ricongiungimento', 'assegno-unico', 'guida-ssn', 'patente', 'diritti-inps',
  'fisco', 'documenti', 'moduli', 'riconoscimento-titoli', 'certificazioni',
  'scuola', 'housing', 'permesso-tracker', 'guida-conti', 'money-transfer',
  'lavoro-diritti', 'emergenze', 'esame', 'cargo', 'dizionario-medico',
  'italia-srilanka', 'costruire-futuro', 'guide'
];

/* Un dominio è «ufficiale» se è dello Stato italiano o di un ente pubblico
   riconosciuto. L'elenco è esplicito di proposito: `*.it` non basta, e un
   carattere jolly qui vorrebbe dire prendere per ufficiale il primo blog. */
const UFFICIALI = [
  [/(^|\.)interno\.gov\.it$/,          'Ministero dell’Interno'],
  [/(^|\.)dlci\.interno\.it$/,         'Ministero dell’Interno'],
  [/(^|\.)poliziadistato\.it$/,        'Polizia di Stato'],
  [/(^|\.)inps\.it$/,                  'INPS'],
  [/(^|\.)agenziaentrate\.gov\.it$/,   'Agenzia delle Entrate'],
  [/(^|\.)salute\.gov\.it$/,           'Ministero della Salute'],
  [/(^|\.)istruzione\.gov\.it$/,       'Ministero dell’Istruzione'],
  [/(^|\.)miur\.gov\.it$/,             'Ministero dell’Istruzione'],
  [/(^|\.)mur\.gov\.it$/,              'Ministero dell’Università'],
  [/(^|\.)mit\.gov\.it$/,              'Ministero delle Infrastrutture'],
  [/(^|\.)lavoro\.gov\.it$/,           'Ministero del Lavoro'],
  [/(^|\.)ispettorato\.gov\.it$/,      'Ispettorato del Lavoro'],
  [/(^|\.)cliclavoro\.gov\.it$/,       'Cliclavoro'],
  [/(^|\.)anpal\.gov\.it$/,            'ANPAL'],
  [/(^|\.)esteri\.it$/,                'Ministero degli Esteri'],
  [/(^|\.)vistoperitalia\.esteri\.it$/,'Ministero degli Esteri'],
  [/(^|\.)prefettura\.it$/,            'Prefettura'],
  [/(^|\.)bancaditalia\.it$/,          'Banca d’Italia'],
  [/(^|\.)aci\.it$/,                   'ACI'],
  [/(^|\.)agid\.gov\.it$/,             'AgID'],
  [/(^|\.)spid\.gov\.it$/,             'SPID'],
  [/(^|\.)garanteprivacy\.it$/,        'Garante Privacy'],
  [/(^|\.)gov\.it$/,                   'Pubblica amministrazione'],
  /* Sri Lanka: domini di Stato. Il Consolato Generale a Milano ci ha chiesto
     di rimandare al proprio sito per tutto ciò che è consolare (agosto 2026). */
  [/(^|\.)cg-milan\.gov\.lk$/,        'Consolato Generale dello Sri Lanka a Milano'],
  [/(^|\.)immigration\.gov\.lk$/,     'Department of Immigration and Emigration'],
  [/(^|\.)mfa\.gov\.lk$/,             'Ministry of Foreign Affairs (Sri Lanka)'],
  [/(^|\.)gov\.lk$/,                  'Governo dello Sri Lanka']
];

function ente(host) {
  for (const [re, nome] of UFFICIALI) if (re.test(host)) return nome;
  return null;
}

/* Guide che parlano di una procedura dello Stato senza citare nessun ente.
   Qui la fonte si mette a mano — trovata, aperta e controllata una per una —
   perché il programma sa raccogliere i link che ci sono, non indovinare quelli
   che mancano. Ogni voce va accompagnata dalla pagina esatta della procedura,
   non dalla home dell'ente: «vai su inps.it e arrangiati» non è una fonte.
   Se una guida non riguarda una procedura pubblica (cargo, dizionario medico,
   archivio documenti) resta senza, ed è giusto così. */
const SEMI = {
  esame: [
    { n: 'Ministero dell’Interno',
      u: 'https://www.interno.gov.it/it/temi/immigrazione-e-asilo/modalita-dingresso/test-conoscenza-lingua-italiana' }
  ],
  certificazioni: [
    { n: 'Ministero dell’Interno',
      u: 'https://www.interno.gov.it/it/temi/immigrazione-e-asilo/modalita-dingresso/test-conoscenza-lingua-italiana' }
  ],
  scuola: [
    { n: 'Ministero dell’Istruzione', u: 'https://unica.istruzione.gov.it/it' }
  ],
  emergenze: [
    { n: 'Ministero dell’Interno',
      u: 'https://www.interno.gov.it/it/temi/sicurezza/numero-unico-emergenza-112' }
  ],
  'money-transfer': [
    { n: 'Banca d’Italia',
      u: 'https://www.bancaditalia.it/compiti/vigilanza/intermediari/index.html' }
  ]
};

function fontiDi(html) {
  const visti = new Map();
  const re = /href="(https?:\/\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1];
    let host;
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { continue; }
    const nome = ente(host);
    if (!nome) continue;
    /* Un ente, un link: se una guida cita INPS otto volte, in fascia ci va una
       volta sola, e ci va il primo — di solito è quello della procedura. */
    if (!visti.has(nome)) visti.set(nome, url);
  }
  return [...visti].map(([n, u]) => ({ n, u }));
}

/* Il sito del Consolato Generale a Milano risponde 503 a chi non si presenta
   come un browser, mentre a una persona si apre benissimo. Un controllo che
   grida «rotto» su un link sano è peggio di nessun controllo: si smette di
   guardarlo. Perciò l'ultimo tentativo usa un User-Agent da browser. */
const AGENTI = [
  'Mozilla/5.0 (compatible; EasyItaliaHub-linkcheck)',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
];

async function raggiungibile(url) {
  const tentativi = [['HEAD', 0], ['GET', 0], ['GET', 1]];
  let ultimo = { ok: false, stato: 'sconosciuto' };
  for (const [metodo, agente] of tentativi) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 20000);
      const r = await fetch(url, {
        method: metodo, redirect: 'follow', signal: c.signal,
        headers: { 'User-Agent': AGENTI[agente] }
      });
      clearTimeout(t);
      /* Diversi siti della pubblica amministrazione rifiutano HEAD e poi
         rispondono a GET: un 405 non è un link rotto. Lo stesso vale per il
         403 e per il 503 di chi filtra gli automatismi. */
      if (r.status === 405 || r.status === 403 || r.status === 503) {
        ultimo = { ok: false, stato: r.status };
        continue;
      }
      return { ok: r.ok, stato: r.status };
    } catch (e) {
      ultimo = { ok: false, stato: String(e.name || 'errore') };
    }
  }
  return ultimo;
}

function ultimaModifica(file) {
  try {
    return execSync(`git log -1 --format=%cs -- ${file}`, { encoding: 'utf8' }).trim() || null;
  } catch { return null; }
}

const registro = {};
const rotti = [];

for (const pagina of GUIDE) {
  const file = pagina + '.html';
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  const trovate = fontiDi(html);
  /* Prima quelle che la pagina cita davvero, poi gli innesti a mano per gli
     enti che non compaiono nel corpo. */
  const fonti = trovate.concat((SEMI[pagina] || []).filter(s => !trovate.some(t => t.n === s.n)));
  const esiti = await Promise.all(fonti.map(f => raggiungibile(f.u)));
  fonti.forEach((f, i) => {
    if (!esiti[i].ok) rotti.push({ pagina, ente: f.n, url: f.u, stato: esiti[i].stato });
  });
  registro[pagina] = {
    fonti,
    modificata: ultimaModifica(file),
    contenuto: null            // la mette una persona, quando rilegge davvero
  };
  const segno = esiti.every(e => e.ok) ? '·' : '✗';
  console.log(segno, pagina.padEnd(22), fonti.length + ' fonti',
    fonti.length ? '— ' + fonti.map(f => f.n).join(', ') : '— nessuna fonte ufficiale citata');
}

console.log('\nlink ufficiali rotti:', rotti.length);
for (const r of rotti) console.log('  ', r.stato, r.pagina, '→', r.url);

const senzaFonte = Object.entries(registro).filter(([, v]) => !v.fonti.length).map(([k]) => k);
if (senzaFonte.length) console.log('\nguide senza nessuna fonte ufficiale:', senzaFonte.join(', '));

if (SOLO_CONTROLLO) process.exit(rotti.length ? 1 : 0);

const oggi = new Date().toISOString().slice(0, 10);

/* ── La fascia, scritta dentro l'HTML e non disegnata dal JavaScript ──────────
   Sta nel documento perché la deve vedere anche chi arriva senza JavaScript, e
   soprattutto Google: una data di aggiornamento che compare solo dopo che è
   girato uno script, per un crawler non esiste. Stessa ragione per il JSON-LD.

   Fra i due marcatori non si scrive a mano: questo script riscrive tutto. */
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

function meseAnno(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return MESI[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}

/* Il prossimo controllo è una promessa, quindi va tenuta corta: sei mesi. */
function fraSeiMesi(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + 6);
  return d.toISOString().slice(0, 10);
}

const INIZIO = '<!-- fonti:inizio — generato da scripts/verifica-fonti.mjs, non scrivere qui -->';
const FINE = '<!-- fonti:fine -->';

function esc(t) {
  return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function fascia(pagina, v) {
  const agg = v.modificata ? meseAnno(v.modificata) : null;
  const pezzi = [];
  if (agg) pezzi.push(`      <span class="guide-meta-date">Aggiornato: ${agg}</span>`);
  for (const f of v.fonti) {
    /* «Fonte:» e il nome dell'ente stanno in due nodi separati: l'etichetta si
       traduce una volta sola, il nome dell'ente non si traduce mai. Tenendoli
       insieme sarebbero quattordici frasi da tradurre in tre lingue per dire
       quattordici volte la stessa parola. */
    pezzi.push(`      <a href="${esc(f.u)}" class="guide-meta-fonte" target="_blank" rel="noopener noreferrer"><span>Fonte:</span> <span data-no-tr>${esc(f.n)}</span> ↗</a>`);
  }
  if (v.fonti.length) {
    pezzi.push(`      <span class="guide-meta-next">Fonti controllate: ${meseAnno(oggi)} · prossimo controllo ${meseAnno(fraSeiMesi(oggi))}</span>`);
  }
  const dati = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: 'https://easyitaliahub.it/' + pagina,
    publisher: { '@type': 'Organization', name: 'Easy Italia Hub' }
  };
  if (v.modificata) dati.dateModified = v.modificata;
  if (v.fonti.length) dati.citation = v.fonti.map(f => ({ '@type': 'WebPage', name: f.n, url: f.u }));

  return INIZIO + '\n' +
    '    <div class="guide-meta reveal">\n' + pezzi.join('\n') + '\n    </div>\n' +
    '    <script type="application/ld+json">' + JSON.stringify(dati) + '</' + 'script>\n' +
    '    ' + FINE;
}

let scritte = 0, saltate = [];
for (const [pagina, v] of Object.entries(registro)) {
  const file = pagina + '.html';
  let html = readFileSync(file, 'utf8');
  const nuova = fascia(pagina, v);

  if (html.includes(INIZIO)) {
    html = html.replace(new RegExp(INIZIO.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '[\\s\\S]*?' + FINE), nuova);
  } else {
    /* Primo giro: al posto della fascia scritta a mano, se c'è; altrimenti
       subito sotto il sommario della pagina, che ogni guida ha. */
    const vecchia = /[ \t]*<div class="guide-meta[^"]*">[\s\S]*?<\/div>/;
    if (vecchia.test(html)) {
      html = html.replace(vecchia, '    ' + nuova);
    } else {
      const lead = /(<p class="lead[^"]*"[^>]*>[\s\S]*?<\/p>)/;
      if (!lead.test(html)) { saltate.push(pagina); continue; }
      html = html.replace(lead, '$1\n    ' + nuova);
    }
  }
  writeFileSync(file, html);
  scritte++;
}
console.log('\nfascia scritta in', scritte, 'guide');
if (saltate.length) console.log('senza punto d\'innesto (da guardare a mano):', saltate.join(', '));

const testa = `/* Registro delle fonti ufficiali — GENERATO, non scrivere qui a mano.

   Lo produce \`node scripts/verifica-fonti.mjs\`, che legge i link a enti
   pubblici già presenti in ogni guida, li chiama per vedere se rispondono, e
   prende da git la data dell'ultima modifica del file.

   \`contenuto\` resta null finché una persona non rilegge la guida: una data di
   verifica messa da un programma non verifica niente.

   Controllo dei link: ${oggi}
*/
window.EIH_VERIFICA = ${JSON.stringify({ controllo: oggi, pagine: registro }, null, 1)};
`;
writeFileSync('assets/eih-verifica-dati.js', testa);
console.log('\nscritto assets/eih-verifica-dati.js —', Object.keys(registro).length, 'guide');
