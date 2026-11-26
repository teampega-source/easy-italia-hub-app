#!/usr/bin/env node
/**
 * Pubblica in automatico le pagine nuove o aggiornate del sito.
 *
 * Come funziona, in breve:
 *   1. legge la sitemap (che è già la verità sulle pagine e sulle date);
 *   2. raggruppa le quattro lingue di una stessa pagina in una sola notizia;
 *   3. tiene traccia in state.json di cosa ha già annunciato;
 *   4. per ogni pagina prepara un post in italiano, sinhala, tamil e inglese,
 *      con il link della lingua giusta, e lo manda ai canali configurati.
 *
 * Primo giro. Con lo stato vuoto non annuncia l'archivio: parte da dieci guide
 * scelte a mano e segna tutte le altre come già viste. Senza questo, due post
 * al giorno per un mese avrebbero presentato come nuove anche pagine ferme da
 * agosto. `--semina` salta il primo giro e segna tutto come già visto.
 *
 * Da dove vengono le traduzioni. Quattro fonti, tutte già scritte nel sito:
 *   · window.EIH_I18N_EXTRA della pagina: page.h1/page.lead, oppure la voce
 *     della chiave data-i18n quando la pagina traduce così titolo e sommario;
 *   · i blocchi en/si/ta accanto a it dentro la pagina, per le pagine che si
 *     portano dietro il proprio dizionario;
 *   · traduzioni/<pagina>.<lingua>.json (italiano → lingua) per le pagine più
 *     vecchie, dove la traduzione è indicizzata sul testo italiano;
 *   · assets/i18n/<pagina>.<lingua>.json, il dizionario che usa il browser nel
 *     corpo della pagina: le impronte dei pezzi dell'h1 e del sommario danno
 *     la traduzione che il visitatore vede davvero.
 * Niente testo inventato: se una lingua non c'è, il blocco non compare e il
 * log lo dice. Una pagina che non risponde, o che risponde senza titolo, viene
 * saltata e non finisce nello stato.
 *
 * Canali: Telegram, Bluesky e Facebook Page, tutti gratuiti via API.
 * Senza segreti configurati il lavoro gira in prova: stampa cosa avrebbe
 * pubblicato e non tocca lo stato, così quando aggiungi le chiavi parte
 * tutto quello che era rimasto indietro.
 *
 * Uso:
 *   node scripts/social/pubblica.mjs            # pubblica davvero
 *   node scripts/social/pubblica.mjs --dry-run  # solo stampa
 *   node scripts/social/pubblica.mjs --semina   # segna tutto come già visto
 *   MAX_POST=10 node ... --dry-run              # tutto il primo giro
 *   MAX_POST=100 node ... --dry-run --tutte     # guarda l'arretrato
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITEMAP = join(RADICE, 'sitemap.xml');
// STATO_SOCIAL serve solo alle prove: permette di far girare il primo giro su
// un file diverso, senza toccare lo stato vero.
const STATO = process.env.STATO_SOCIAL ||
  join(RADICE, 'scripts', 'social', 'state.json');
const TRADUZIONI = join(RADICE, 'traduzioni');
const I18N = join(RADICE, 'assets', 'i18n');

const SITO = 'https://easyitaliahub.it';
const MAX_POST = Math.max(1, Number(process.env.MAX_POST || 2));
const DRY = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
const SEMINA = process.argv.includes('--semina');
const TUTTE = process.argv.includes('--tutte');

if (TUTTE && !DRY) {
  console.error('--tutte vale solo insieme a --dry-run: serve a guardare l\'arretrato, non a pubblicarlo.');
  process.exit(1);
}

const LINGUE = ['it', 'si', 'ta', 'en'];
const BANDIERE = { it: '🇮🇹', si: '🇱🇰', ta: '🇱🇰', en: '🇬🇧' };

// Le guide da cui parte il primo giro: i bisogni più frequenti, tutte con la
// traduzione in sinhala e tamil. Le altre pagine vengono segnate come già
// viste; se una di queste non è nella sitemap viene semplicemente saltata.
const PRIMO_GIRO = [
  '/assegno-unico',
  '/diritti-inps',
  '/lavoro',
  '/fisco',
  '/guida-ssn',
  '/ricongiungimento',
  '/patente',
  '/guida-conti',
  '/housing',
  '/scuola',
];

// Pagine che non hanno senso annunciare: la home cambia troppo spesso per
// essere una "novità", le legali non interessano a nessuno e le aree personali
// non si aprono senza account.
const ESCLUSE = new Set([
  '/', '/cerca', '/registrati', '/dashboard', '/abbonamenti',
  '/privacy', '/cookie', '/termini', '/note-legali', '/offline',
]);

// ── sitemap ────────────────────────────────────────────────────────────────

function leggiSitemap(xml) {
  const voci = [];
  const blocchi = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  for (const b of blocchi) {
    const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lastmod = (b.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || '';
    const it = (b.match(/hreflang="it"\s+href="([^"]+)"/) || [])[1];
    const en = (b.match(/hreflang="en"\s+href="([^"]+)"/) || [])[1];
    const si = (b.match(/hreflang="si"\s+href="([^"]+)"/) || [])[1];
    const ta = (b.match(/hreflang="ta"\s+href="([^"]+)"/) || [])[1];
    if (!loc) continue;
    voci.push({
      loc, lastmod, canonico: it || loc,
      inglese: en || '', sinhala: si || '', tamil: ta || '',
    });
  }
  return voci;
}

// Le quattro lingue sono la stessa notizia: si annuncia la versione italiana
// una volta sola, con il lastmod più recente fra le varianti. Degli altri
// indirizzi interessa il percorso, che è quello da mettere nel blocco lingua.
function raggruppa(voci) {
  const perPagina = new Map();
  for (const v of voci) {
    let chiave;
    try { chiave = new URL(v.canonico).pathname; } catch { continue; }
    const attuale = perPagina.get(chiave);
    if (!attuale) {
      perPagina.set(chiave, {
        chiave,
        url: { it: v.canonico, en: v.inglese, si: v.sinhala, ta: v.tamil },
        lastmod: v.lastmod,
      });
      continue;
    }
    if ((v.lastmod || '') > (attuale.lastmod || '')) attuale.lastmod = v.lastmod;
    if (v.inglese) attuale.url.en = v.inglese;
    if (v.sinhala) attuale.url.si = v.sinhala;
    if (v.tamil) attuale.url.ta = v.tamil;
  }
  return [...perPagina.values()];
}

// ── testo della pagina ─────────────────────────────────────────────────────

const normalizza = (t) => String(t || '').replace(/\s+/g, ' ').trim();

function pulisciTitolo(t) {
  return normalizza(t).split(/\s+[—|·]\s+/)[0].trim();   // "Pagina — Easy Italia Hub"
}

function decodifica(html) {
  const codice = (n) => {
    try { return String.fromCodePoint(n); } catch { return ''; }
  };
  return String(html || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => codice(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => codice(Number(n)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&hellip;/g, '…');
}

function senzaTag(html) {
  return normalizza(decodifica(String(html || '').replace(/<[^>]+>/g, ' ')))
    .replace(/\s+([,.;:!?])/g, '$1');
}

/* Coppie "chiave":"valore" di un dizionario JavaScript. Non si usa
   JSON.parse sul blocco intero: alcune pagine hanno una virgola di troppo
   prima della graffa finale e il parse fallirebbe tutto. Letta coppia per
   coppia, una voce strana si salta e le altre restano. */
function coppie(testo) {
  const mappa = {};
  for (const c of testo.matchAll(/"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    try {
      // In un blocco JavaScript l'apostrofo si può scrivere \' (su
      // /diritti-inps succede): JSON.parse da solo lo rifiuterebbe e la voce
      // andrebbe persa.
      const valore = c[2].replace(/\\'/g, "'");
      mappa[JSON.parse('"' + c[1] + '"')] = JSON.parse('"' + valore + '"');
    } catch { /* coppia strana */ }
  }
  return mappa;
}

/* Estrae un oggetto JavaScript/JSON da una graffa, rispettando le stringhe.
   Serve perché i blocchi lingua possono stare su una riga sola (JSON) o su
   più righe, e contengono virgole, graffe e parentesi dentro i testi. */
function estraiOggetto(testo, inizio) {
  if (testo[inizio] !== '{') return '';
  let profondita = 0;
  let stringa = false;
  let apice = '';
  let escape = false;
  for (let i = inizio; i < testo.length; i++) {
    const c = testo[i];
    if (stringa) {
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === apice) stringa = false;
      continue;
    }
    if (c === '"' || c === "'") { stringa = true; apice = c; continue; }
    if (c === '{') profondita++;
    else if (c === '}') {
      profondita--;
      if (profondita === 0) return testo.slice(inizio, i + 1);
    }
  }
  return testo.slice(inizio);
}

/* I blocchi en/si/ta di una pagina. Cerca la lingua seguita da `{` e prende
   l'oggetto bilanciato: niente più tagli "fino alla lingua successiva", che
   si rompevano appena un testo conteneva una graffa. */
function blocchiLingua(testo) {
  const risultato = {};
  for (const lingua of ['en', 'si', 'ta']) {
    const m = testo.match(new RegExp(`["']?${lingua}["']?\\s*:\\s*\\{`));
    if (!m) continue;
    const inizio = testo.indexOf('{', m.index + m[0].length - 1);
    const oggetto = estraiOggetto(testo, inizio);
    if (oggetto) risultato[lingua] = coppie(oggetto);
  }
  return risultato;
}

/* Il dizionario che il browser usa per il corpo della pagina: impronta
   FNV-1a a 32 bit del testo italiano → traduzione. Deve restare identica a
   quella di assets/eih-i18n-page.js, altrimenti le chiavi non combaciano. */
function improntaBrowser(testo) {
  const s = normalizza(testo);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
}

function dizionarioBrowser(base, lingua) {
  const mappa = new Map();
  try {
    const dati = JSON.parse(readFileSync(join(I18N, `${base}.${lingua}.json`), 'utf8'));
    for (const [k, v] of Object.entries(dati)) {
      if (typeof v === 'string' && v.trim()) mappa.set(k, v);
    }
  } catch { /* pagina senza dizionario: si va avanti */ }
  return mappa;
}

/* L'h1 è spezzato da <br> ed <em>: il browser lo traduce pezzo per pezzo e
   ricompone la frase. Si fa lo stesso. Il titolo si accetta solo se ogni
   pezzo ha la sua traduzione — un titolo mezzo italiano non serve. */
function titoloDaPezzi(html, dizionario) {
  const pezzi = [];
  for (const m of String(html || '').matchAll(/([^<]+)|(<[^>]+>)/g)) {
    if (m[1] === undefined) continue;
    const t = senzaTag(m[1]);
    if (t) pezzi.push(t);
  }
  if (!pezzi.length) return '';
  const tradotti = pezzi.map((p) => dizionario.get(improntaBrowser(p)));
  if (tradotti.some((t) => !t)) return '';
  // Su /riconoscimento-titoli il dizionario traduce "stranieri" con
  // "qualifications": unito a "Riconoscimento titoli" la parola usciva due
  // volte. Si toglie la ripetizione; la traduzione resta quella del sito.
  return senzaTag(tradotti.join(' ')).replace(/\b([\p{L}]+)(\s+\1\b)+/giu, '$1');
}

async function leggiPagina(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const html = await res.text();
    const titolo = decodifica((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    // Titolo e primo paragrafo possono essere marcati data-i18n: in quel caso
    // la traduzione sta nel dizionario della pagina, non nei file hash.
    const h1Tag = (html.match(/<h1([^>]*)>/i) || [])[1] || '';
    const h1Html = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
    const chiaveH1 = (h1Tag.match(/data-i18n(?:-html)?="([^"]+)"/i) || [])[1] || '';
    const h1 = senzaTag(h1Html);
    const leadTag = (html.match(/<p([^>]*class="[^"]*\blead\b[^"]*"[^>]*)>/i) || [])[1] || '';
    const chiaveLead = (leadTag.match(/data-i18n(?:-html)?="([^"]+)"/i) || [])[1] || '';
    const leadHtml = (html.match(/<p[^>]*class="[^"]*\blead\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '';
    const lead = senzaTag(leadHtml);

    // Il primo paragrafo vero serve quando la descrizione non è tradotta: è
    // testo del corpo, e il corpo è quello che i dizionari coprono meglio.
    const paragrafi = [...html.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)]
      .map((m) => ({ testo: senzaTag(m[2]), chiave: (m[1].match(/data-i18n(?:-html)?="([^"]+)"/) || [])[1] || '' }));
    // Meglio un paragrafo con chiave, anche se non è il primo: senza chiave
    // non c'è modo di risalire alla traduzione.
    const primo = paragrafi.find((p) => p.chiave && p.testo.length >= 40) ||
      paragrafi.find((p) => p.testo.length >= 60) || { testo: '', chiave: '' };

    // Alcune pagine scrivono le traduzioni direttamente nell'HTML, in un
    // blocco window.EIH_I18N_EXTRA: sono le stesse che usa il browser.
    let extra = {};
    const extraMarker = html.match(/window\.EIH_I18N_EXTRA\s*=\s*/);
    if (extraMarker && extraMarker.index !== undefined) {
      const inizio = html.indexOf('{', extraMarker.index + extraMarker[0].length);
      extra = blocchiLingua(estraiOggetto(html, inizio));
    }

    /* La testata delle pagine è in inglese (lingua predefinita del sito): il
       blocco italiano del post prende h1 e sommario, che nel markup restano
       scritti in italiano, e la stessa coppia serve da chiave di traduzione. */
    return {
      titolo: pulisciTitolo(h1) || pulisciTitolo(titolo), h1, h1Html, h1NoTr: /\bdata-no-tr\b/i.test(h1Tag),
      chiaveH1, chiaveLead, descrizione: lead || primo.testo, lead,
      primoParagrafo: primo.testo, chiaveParagrafo: primo.chiave, extra,
      inline: blocchiLingua(html),
    };
  } catch {
    return null;
  }
}

// ── italiano → lingua ──────────────────────────────────────────────────────
//
// Prima la traduzione che la pagina porta con sé (EIH_I18N_EXTRA, blocchi
// inline), poi traduzioni/<pagina>.<lingua>.json, dove le chiavi sono il testo
// italiano: il confronto si fa sul testo normalizzato, così spazi multipli e
// a capo non contano. Infine il dizionario del browser.

function leggiTraduzioni(base, lingua) {
  const mappa = new Map();
  try {
    const dati = JSON.parse(readFileSync(join(TRADUZIONI, `${base}.${lingua}.json`), 'utf8'));
    for (const [it, tradotto] of Object.entries(dati)) {
      if (typeof tradotto === 'string' && tradotto.trim()) mappa.set(normalizza(it), tradotto);
    }
  } catch { /* pagina senza traduzioni: si va avanti */ }
  return mappa;
}

function versioneLingua(info, base, lingua) {
  const mappa = leggiTraduzioni(base, lingua);
  const browser = dizionarioBrowser(base, lingua);
  const inline = (info.inline && info.inline[lingua]) || {};
  const extra = (info.extra && info.extra[lingua]) || {};

  // Prima la traduzione scritta per questa pagina (page.h1/page.lead, la
  // chiave data-i18n del titolo e quella del sommario), poi quella indicizzata
  // sul testo italiano, infine il dizionario del browser. Il dizionario
  // globale di eih.js non entra: contiene solo menu e piede.
  const titolo =
    senzaTag(extra['page.h1'] || '') ||
    (info.chiaveH1 ? senzaTag(extra[info.chiaveH1] || '') : '') ||
    (info.chiaveH1 ? senzaTag(inline[info.chiaveH1] || '') : '') ||
    mappa.get(normalizza(info.h1)) ||
    mappa.get(normalizza(info.titolo)) ||
    (info.h1NoTr ? info.h1 : '') ||
    titoloDaPezzi(info.h1Html, browser);

  const descrizione =
    senzaTag(extra['page.lead'] || '') ||
    (info.chiaveLead ? senzaTag(extra[info.chiaveLead] || '') : '') ||
    (info.chiaveLead ? senzaTag(inline[info.chiaveLead] || '') : '') ||
    (info.chiaveParagrafo ? senzaTag(extra[info.chiaveParagrafo] || '') : '') ||
    (info.chiaveParagrafo ? senzaTag(inline[info.chiaveParagrafo] || '') : '') ||
    mappa.get(normalizza(info.descrizione)) ||
    mappa.get(normalizza(info.primoParagrafo)) ||
    browser.get(improntaBrowser(info.descrizione)) ||
    browser.get(improntaBrowser(info.lead)) ||
    // Senza un paragrafo "lead" esplicito vale il primo paragrafo del corpo,
    // ma solo se il dizionario lo traduce: l'avviso AI, che spesso è il primo
    // paragrafo lungo, non è un sommario.
    (!info.lead ? browser.get(improntaBrowser(info.primoParagrafo)) : '');

  if (!titolo) return null;   // niente traduzione vera: meglio nessun blocco
  return { titolo, descrizione: senzaTag(descrizione || '') };
}

// ── testo del post ─────────────────────────────────────────────────────────

const escapaHtml = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const DESCRIZIONE_MAX = 320;   // con quattro lingue, oltre si sfonda Telegram

function tronca(testo, max) {
  if (testo.length <= max) return testo;
  return testo.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

// Ogni blocco ha il link della propria lingua: chi legge in inglese finisce
// sulla pagina inglese, chi legge in tamil su quella tamil. Con html il testo
// va a Telegram, che vuole i titoli in grassetto e il resto protetto.
function corpoPost(testo, html = false) {
  const esc = html ? escapaHtml : String;
  const blocchi = [];
  for (const lingua of LINGUE) {
    const b = testo[lingua];
    if (!b) continue;
    const titolo = esc(b.titolo);
    const righe = [`${BANDIERE[lingua]} ${html ? `<b>${titolo}</b>` : titolo}`];
    if (b.descrizione) righe.push(esc(tronca(b.descrizione, DESCRIZIONE_MAX)));
    righe.push(esc(b.url));
    blocchi.push(righe.join('\n'));
  }
  return blocchi.join('\n\n');
}

// ── canali ─────────────────────────────────────────────────────────────────

// Ogni canale porta il suo UTM: senza, non si sa quale porta visite. Il primo
// giro usa una campagna sua, così i numeri dell'avvio non si mescolano alle
// novità normali.
function conUta(url, canale, campagna) {
  const u = new URL(url);
  u.searchParams.set('utm_source', canale);
  u.searchParams.set('utm_medium', 'social');
  u.searchParams.set('utm_campaign', campagna);
  return u.toString();
}

function testoPerCanale(testo, canale) {
  const copia = { ...testo };
  for (const lingua of LINGUE) {
    if (testo[lingua]) {
      copia[lingua] = {
        ...testo[lingua],
        url: conUta(testo[lingua].url, canale, testo.campagna),
      };
    }
  }
  return copia;
}

async function telegram(testo) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { canale: 'telegram', esito: 'saltato', motivo: 'segreti assenti' };

  const messaggio = corpoPost(testoPerCanale(testo, 'telegram'), true).slice(0, 4000);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text: messaggio,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
    signal: AbortSignal.timeout(20000),
  });
  const dati = await res.json().catch(() => ({}));
  if (!res.ok || dati.ok === false) {
    return { canale: 'telegram', esito: 'errore', motivo: dati.description || res.status };
  }
  return { canale: 'telegram', esito: 'pubblicato' };
}

async function bluesky(testo) {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) return { canale: 'bluesky', esito: 'saltato', motivo: 'segreti assenti' };

  const sessione = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password }),
    signal: AbortSignal.timeout(20000),
  });
  const dati = await sessione.json().catch(() => ({}));
  if (!sessione.ok) {
    return { canale: 'bluesky', esito: 'errore', motivo: dati.message || sessione.status };
  }

  // Bluesky conta 300 caratteri in tutto, URL compreso. Si parte dalle lingue
  // della community e si aggiunge l'inglese solo se avanza spazio: meglio due
  // titoli veri in sinhala/tamil che quattro titoli tagliati a metà.
  const url = conUta(testo.it.url, 'bluesky', testo.campagna);
  const spazio = Math.max(40, 300 - url.length - 2);
  // L'italiano c'è sempre; le altre lingue entrano finché lo spazio basta.
  const righe = [tronca(`${BANDIERE.it} ${testo.it.titolo}`, spazio)];
  const lingueIncluse = ['it'];
  for (const lingua of LINGUE.slice(1)) {
    const b = testo[lingua];
    if (!b) continue;
    const riga = `${BANDIERE[lingua]} ${tronca(b.titolo, 90)}`;
    if (righe.join('\n').length + 1 + riga.length <= spazio) {
      righe.push(riga);
      lingueIncluse.push(lingua);
    }
  }

  const corpo = righe.join('\n');
  const text = `${corpo}\n\n${url}`;
  const prima = text.slice(0, text.lastIndexOf(url));
  const facet = [{
    index: {
      byteStart: Buffer.byteLength(prima, 'utf8'),
      byteEnd: Buffer.byteLength(prima + url, 'utf8'),
    },
    features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
  }];

  const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${dati.accessJwt}`,
    },
    body: JSON.stringify({
      repo: dati.did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text,
        facets: facet,
        langs: lingueIncluse,
        createdAt: new Date().toISOString(),
      },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const errore = await res.json().catch(() => ({}));
    return { canale: 'bluesky', esito: 'errore', motivo: errore.message || res.status };
  }
  return { canale: 'bluesky', esito: 'pubblicato' };
}

// Facebook Page: l'API è gratuita, ma serve un token di pagina a lunga
// durata preso da un'app Meta. Senza token il canale viene saltato.
async function facebook(testo) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageId || !token) return { canale: 'facebook', esito: 'saltato', motivo: 'segreti assenti' };

  const messaggio = corpoPost(testoPerCanale(testo, 'facebook'));
  const link = conUta(testo.it.url, 'facebook', testo.campagna);

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: messaggio, link, access_token: token }),
    signal: AbortSignal.timeout(20000),
  });
  const dati = await res.json().catch(() => ({}));
  if (!res.ok || dati.error) {
    return { canale: 'facebook', esito: 'errore', motivo: (dati.error && dati.error.message) || res.status };
  }
  return { canale: 'facebook', esito: 'pubblicato' };
}

// ── giro completo ──────────────────────────────────────────────────────────

async function main() {
  const xml = await readFile(SITEMAP, 'utf8');
  let stato = { pubblicati: {} };
  try {
    stato = JSON.parse(await readFile(STATO, 'utf8'));
    if (!stato.pubblicati) stato.pubblicati = {};
  } catch { /* primo giro: stato vuoto */ }

  const tutte = raggruppa(leggiSitemap(xml)).filter((p) => !ESCLUSE.has(p.chiave));
  const primoGiro = Object.keys(stato.pubblicati).length === 0;

  if (SEMINA) {
    let quante = 0;
    for (const p of tutte) {
      if (!p.lastmod) continue;
      stato.pubblicati[p.chiave] = p.lastmod;
      quante++;
    }
    if (DRY) {
      console.log(`[prova] seminerei ${quante} pagine: il prossimo giro annuncerebbe solo ciò che cambia da adesso.`);
      return;
    }
    await salvaStato(stato);
    console.log(`Seminate ${quante} pagine: il prossimo giro annuncerà solo ciò che cambia da adesso.`);
    return;
  }

  let candidate;
  if (primoGiro && !TUTTE) {
    const perChiave = new Map(tutte.map((p) => [p.chiave, p]));
    candidate = PRIMO_GIRO.map((c) => perChiave.get(c)).filter(Boolean);
    const curate = new Set(PRIMO_GIRO);
    const altre = tutte.filter((p) => !curate.has(p.chiave) && p.lastmod);
    // Il seme si salva insieme allo stato: le pagine fuori dal primo giro non
    // verranno mai annunciate come nuove, nemmeno fra un mese.
    for (const p of altre) stato.pubblicati[p.chiave] = p.lastmod;
    console.log(`Primo giro: ${candidate.length} guide scelte a mano, ${altre.length} pagine segnate come già viste.`);
  } else {
    candidate = tutte
      .filter((p) => p.lastmod && (!stato.pubblicati[p.chiave] || p.lastmod > stato.pubblicati[p.chiave]))
      .sort((a, b) => (a.lastmod < b.lastmod ? 1 : -1));
  }

  candidate = candidate.slice(0, MAX_POST);

  if (!candidate.length) {
    console.log('Nessuna pagina nuova o aggiornata da annunciare.');
    // Se il primo giro non ha candidate (per esempio perché le guide scelte
    // non sono più nella sitemap), il seme va salvato lo stesso: altrimenti il
    // giro dopo riproverebbe lo stesso elenco all'infinito.
    if (primoGiro && !TUTTE && !DRY) {
      await salvaStato(stato);
      console.log('Stato seminato: le pagine attuali non verranno annunciate come nuove.');
    }
    return;
  }

  const canaliConfigurati =
    Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) ||
    Boolean(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD) ||
    Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN);

  if (!canaliConfigurati) {
    console.log('Nessun canale configurato: giro di prova, non pubblico nulla.');
    console.log('Segreti attesi: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID, BLUESKY_HANDLE + BLUESKY_APP_PASSWORD, FACEBOOK_PAGE_ID + FACEBOOK_PAGE_TOKEN.');
  }

  for (const pagina of candidate) {
    console.log(`\n▸ ${pagina.chiave} (aggiornata il ${pagina.lastmod})`);
    const url = new URL(pagina.chiave, SITO).toString();
    const info = await leggiPagina(url);
    if (!info) {
      console.log('  · la pagina non risponde: salto (lo stato non avanza)');
      continue;
    }
    if (!info.titolo) {
      console.log('  · la pagina non ha un titolo: salto (lo stato non avanza)');
      continue;
    }

    const base = pagina.chiave === '/' ? 'index' : pagina.chiave.replace(/^\//, '');
    const testo = {
      it: { titolo: info.titolo, descrizione: info.descrizione || '', url },
      campagna: primoGiro && !TUTTE ? 'avvio' : 'novita',
    };

    for (const lingua of ['en', 'si', 'ta']) {
      const urlLingua = pagina.url[lingua];
      if (!urlLingua) {
        console.log(`  · niente URL ${lingua} nella sitemap: blocco saltato`);
        continue;
      }
      const versione = versioneLingua(info, base, lingua);
      if (!versione) {
        console.log(`  · nessuna traduzione ${lingua}: blocco saltato`);
        continue;
      }
      testo[lingua] = { ...versione, url: urlLingua };
    }

    const presenti = LINGUE.filter((l) => testo[l]);
    console.log(`  · lingue nel post: ${presenti.join(', ')}`);
    if (!testo.si && !testo.ta) console.log('  · attenzione: mancano sinhala e tamil');

    if (DRY || !canaliConfigurati) {
      console.log('  [prova] ' + corpoPost(testo).replace(/\n+/g, ' / '));
      continue;
    }

    const esiti = [];
    for (const canale of [telegram, bluesky, facebook]) {
      try {
        esiti.push(await canale(testo));
      } catch (e) {
        esiti.push({ canale: canale.name, esito: 'errore', motivo: e.message });
      }
    }

    for (const e of esiti) {
      console.log(`  · ${e.canale}: ${e.esito}${e.motivo ? ' — ' + e.motivo : ''}`);
    }

    // Lo stato avanza solo se almeno un canale ha davvero pubblicato:
    // così un errore temporaneo non fa perdere la notizia per sempre.
    if (esiti.some((e) => e.esito === 'pubblicato')) {
      stato.pubblicati[pagina.chiave] = pagina.lastmod;
    }
  }

  if (!DRY && canaliConfigurati) {
    await salvaStato(stato);
    console.log('\nStato salvato in ' + STATO);
  }
}

async function salvaStato(stato) {
  const testo = JSON.stringify(stato, null, 2).replace(/\r?\n/g, '\r\n') + '\r\n';
  await writeFile(STATO, testo, 'utf8');
}

main().catch((e) => {
  console.error('Errore imprevisto:', e);
  process.exit(1);
});
