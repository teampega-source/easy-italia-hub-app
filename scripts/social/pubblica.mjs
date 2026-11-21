#!/usr/bin/env node
/**
 * Pubblica in automatico le pagine nuove o aggiornate del sito.
 *
 * Come funziona, in breve:
 *   1. legge la sitemap (che è già la verità sulle pagine e sulle date);
 *   2. raggruppa le quattro lingue di una stessa pagina in una sola notizia;
 *   3. tiene traccia in state.json di cosa ha già annunciato;
 *   4. per ogni pagina nuova prepara un post bilingue — italiano dalla pagina
 *      italiana, inglese dalle traduzioni della stessa pagina — e lo manda ai
 *      canali configurati.
 *
 * Da dove viene l'inglese. Le pagine /en non hanno meta inglesi: il testo è
 * tradotto nel browser da assets/eih-i18n-page.js, che pesca in
 * traduzioni/<pagina>.en.json (italiano → inglese) e dai blocchi
 * window.EIH_I18N_EXTRA scritti dentro le pagine. Qui si usano le stesse due
 * fonti: si prende il titolo italiano della pagina, lo si cerca nella
 * traduzione e si tiene l'inglese. Niente testo inventato: se una pagina non
 * è tradotta, il post resta solo in italiano e il log lo dice.
 *
 * Canali: Telegram, Bluesky e Facebook Page, tutti gratuiti via API.
 * Senza segreti configurati il lavoro gira in prova: stampa cosa avrebbe
 * pubblicato e non tocca lo stato, così quando aggiungi le chiavi parte
 * tutto quello che era rimasto indietro.
 *
 * Uso:
 *   node scripts/social/pubblica.mjs            # pubblica davvero
 *   node scripts/social/pubblica.mjs --dry-run  # solo stampa
 *   MAX_POST=3 node scripts/social/pubblica.mjs # più di due pagine per giro
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITEMAP = join(RADICE, 'sitemap.xml');
const STATO = join(RADICE, 'scripts', 'social', 'state.json');
const TRADUZIONI = join(RADICE, 'traduzioni');

const SITO = 'https://easyitaliahub.it';
const MAX_POST = Math.max(1, Number(process.env.MAX_POST || 2));
const DRY = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

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
    const it = (b.match(/hreflang="it"\s+href="([^"]+)"[^>]*>/) || [])[1];
    const ing = (b.match(/hreflang="en"\s+href="([^"]+)"[^>]*>/) || [])[1];
    if (!loc) continue;
    voci.push({ loc, lastmod, canonico: it || loc, inglese: ing || '' });
  }
  return voci;
}

// Le quattro lingue sono la stessa notizia: si annuncia la versione italiana
// una volta sola, con il lastmod più recente fra le varianti. Della variante
// inglese interessa l'indirizzo, che è quello da mettere nel blocco inglese.
function raggruppa(voci) {
  const perPagina = new Map();
  for (const v of voci) {
    let chiave;
    try { chiave = new URL(v.canonico).pathname; } catch { continue; }
    const attuale = perPagina.get(chiave);
    if (!attuale) {
      perPagina.set(chiave, { chiave, url: v.canonico, urlEn: v.inglese, lastmod: v.lastmod });
      continue;
    }
    if ((v.lastmod || '') > (attuale.lastmod || '')) attuale.lastmod = v.lastmod;
    if (v.inglese) attuale.urlEn = v.inglese;
  }
  return [...perPagina.values()];
}

// ── testo della pagina ─────────────────────────────────────────────────────

const normalizza = (t) => String(t || '').replace(/\s+/g, ' ').trim();

function pulisciTitolo(t) {
  return normalizza(t).split(/\s+[—|·]\s+/)[0].trim();   // "Pagina — Easy Italia Hub"
}

function decodifica(html) {
  return String(html || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

function senzaTag(html) {
  return normalizza(decodifica(String(html || '').replace(/<[^>]+>/g, ' ')));
}

/* Le pagine più recenti portano le traduzioni dentro di sé, in blocchi
   `en:{...}` accanto a it/si/ta. Sono oggetti JavaScript ma con chiavi e
   valori fra doppi apici, quindi quasi sempre JSON valido: si prova a leggerli
   così, e se il blocco ha qualcosa di strano si rinuncia invece di sbagliare. */
function dizionarioInline(html) {
  const inglese = {};
  for (const m of html.matchAll(/\ben:\s*\{/g)) {
    // I dizionari sono uno dopo l'altro nella stessa forma: it:{...} en:{...}
    // si:{...} ta:{...}. Il blocco inglese finisce dove comincia la lingua
    // successiva, e questo evita di dover bilanciare le graffe dentro le
    // stringhe (ci sono testi con { e } dentro).
    const dopo = html.slice(m.index + m[0].length - 1);
    const fine = dopo.search(/\n\s*(?:it|si|ta):\s*\{/);
    const blocco = fine === -1 ? dopo : dopo.slice(0, fine);
    for (const c of blocco.matchAll(/"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
      try { inglese[JSON.parse('"' + c[1] + '"')] = JSON.parse('"' + c[2] + '"'); } catch { /* coppia strana */ }
    }
  }
  return inglese;
}

async function leggiPagina(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return {};
    const html = await res.text();
    const titolo = decodifica((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    // Titolo e primo paragrafo possono essere marcati data-i18n: in quel caso
    // la traduzione sta nel dizionario della pagina, non nei file hash.
    const h1Tag = (html.match(/<h1([^>]*)>/i) || [])[1] || '';
    const h1Html = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
    const chiaveH1 = (h1Tag.match(/data-i18n(?:-html)?="([^"]+)"/i) || [])[1] || '';
    const h1 = senzaTag(h1Html);
    const descrizione = senzaTag(
      (html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) ||
       html.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/i) || [])[1] || ''
    );

    // Il primo paragrafo vero serve quando la descrizione non è tradotta: è
    // testo del corpo, e il corpo è quello che i dizionari coprono meglio.
    const paragrafi = [...html.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)]
      .map((m) => ({ testo: senzaTag(m[2]), chiave: (m[1].match(/data-i18n(?:-html)?="([^"]+)"/) || [])[1] || '' }));
    // Meglio un paragrafo con chiave, anche se non è il primo: senza chiave
    // non c'è modo di risalire alla traduzione inglese.
    const primo = paragrafi.find((p) => p.chiave && p.testo.length >= 40) ||
      paragrafi.find((p) => p.testo.length >= 60) || { testo: '', chiave: '' };

    // Alcune pagine scrivono le traduzioni direttamente nell'HTML, in un
    // blocco window.EIH_I18N_EXTRA: sono le stesse che usa il browser.
    let extraEn = null;
    const extra = html.match(/window\.EIH_I18N_EXTRA=(\{[\s\S]*?\});/);
    if (extra) {
      try { extraEn = JSON.parse(extra[1]).en || null; } catch { /* blocco rotto: si ignora */ }
    }

    return {
      titolo: pulisciTitolo(titolo), h1, chiaveH1,
      descrizione, primoParagrafo: primo.testo, chiaveParagrafo: primo.chiave, extraEn,
      inlineEn: dizionarioInline(html),
    };
  } catch {
    return {};
  }
}

// ── italiano → inglese ─────────────────────────────────────────────────────
//
// Stessa coppia di fonti usata dal browser: traduzioni/<pagina>.en.json per il
// corpo, EIH_I18N_EXTRA per le pagine che se la cavano da sole. Le chiavi sono
// il testo italiano, quindi il confronto si fa sul testo normalizzato: spazi
// multipli e a capo non devono contare.

/** Il dizionario italiano→inglese dentro eih.js (le chiavi data-i18n). */
let DIZIONARIO_EIH = null;
function dizionarioEih() {
  if (DIZIONARIO_EIH) return DIZIONARIO_EIH;
  const mappa = new Map();
  try {
    const src = readFileSync(join(RADICE, 'eih.js'), 'utf8');
    const inizio = src.indexOf('en:{');
    if (inizio !== -1) {
      let livello = 0, fine = -1;
      for (let i = src.indexOf('{', inizio); i < src.length; i++) {
        if (src[i] === '{') livello++;
        else if (src[i] === '}') { livello--; if (!livello) { fine = i; break; } }
      }
      const blocco = src.slice(inizio, fine + 1);
      for (const c of blocco.matchAll(/"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)"/g)) {
        try { mappa.set(JSON.parse('"' + c[1] + '"'), JSON.parse('"' + c[2] + '"')); } catch { /* coppia strana */ }
      }
    }
  } catch { /* eih.js assente: si prosegue */ }
  DIZIONARIO_EIH = mappa;
  return mappa;
}

function leggiTraduzioni(base) {
  const mappa = new Map();
  for (const file of ['_comuni.en.json', `${base}.en.json`]) {
    try {
      const dati = JSON.parse(readFileSync(join(TRADUZIONI, file), 'utf8'));
      for (const [it, en] of Object.entries(dati)) {
        if (typeof en === 'string' && en.trim()) mappa.set(normalizza(it), en);
      }
    } catch { /* pagina senza traduzioni: si va avanti */ }
  }
  return mappa;
}

function versioneInglese(info, base) {
  const mappa = leggiTraduzioni(base);
  const candidatiTitolo = [info.h1, info.titolo].filter(Boolean);
  let titolo = '';
  for (const c of candidatiTitolo) {
    const trovato = mappa.get(normalizza(c));
    if (trovato) { titolo = senzaTag(trovato); break; }
  }
  if (!titolo && info.extraEn) {
    titolo = senzaTag(info.extraEn['page.h1'] || info.extraEn['page.title'] || '');
  }

  if (!titolo && info.chiaveH1) {
    titolo = senzaTag((info.inlineEn && info.inlineEn[info.chiaveH1]) || dizionarioEih().get(info.chiaveH1) || '');
  }

  let descrizione = mappa.get(normalizza(info.descrizione)) ||
    mappa.get(normalizza(info.primoParagrafo)) || '';
  if (!descrizione && info.chiaveParagrafo) {
    descrizione = senzaTag((info.inlineEn && info.inlineEn[info.chiaveParagrafo]) || dizionarioEih().get(info.chiaveParagrafo) || '');
  }
  if (!descrizione && info.extraEn) {
    descrizione = senzaTag(info.extraEn['page.lead'] || '');
  }

  if (!titolo) return null;   // niente inglese vero: meglio nessun blocco
  return { titolo, descrizione: senzaTag(descrizione) };
}

// ── testo del post ─────────────────────────────────────────────────────────

// Ogni blocco ha il link della propria lingua: chi legge in inglese finisce
// sulla pagina inglese, non su quella italiana.
function corpoBilingue(testo) {
  const righe = [`🇮🇹 ${testo.it.titolo}`];
  if (testo.it.descrizione) righe.push(testo.it.descrizione);
  righe.push(testo.it.url);
  if (testo.en) {
    righe.push('');
    righe.push(`🇬🇧 ${testo.en.titolo}`);
    if (testo.en.descrizione) righe.push(testo.en.descrizione);
    righe.push(testo.en.url);
  }
  return righe.join('\n');
}

function testoBase(testo) {
  return corpoBilingue(testo);
}

function tronca(testo, max) {
  if (testo.length <= max) return testo;
  return testo.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

// ── canali ─────────────────────────────────────────────────────────────────

const escapaHtml = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Ogni canale porta il suo UTM: senza, non si sa quale porta visite.
function conUta(url, canale) {
  const u = new URL(url);
  u.searchParams.set('utm_source', canale);
  u.searchParams.set('utm_medium', 'social');
  u.searchParams.set('utm_campaign', 'novita');
  return u.toString();
}

async function telegram(testo) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { canale: 'telegram', esito: 'saltato', motivo: 'segreti assenti' };

  const itUrl = conUta(testo.it.url, 'telegram');
  const righe = [`🇮🇹 <b>${escapaHtml(testo.it.titolo)}</b>`];
  if (testo.it.descrizione) righe.push(escapaHtml(testo.it.descrizione));
  righe.push(escapaHtml(itUrl));
  if (testo.en) {
    righe.push('', `🇬🇧 <b>${escapaHtml(testo.en.titolo)}</b>`);
    if (testo.en.descrizione) righe.push(escapaHtml(testo.en.descrizione));
    righe.push(escapaHtml(conUta(testo.en.url, 'telegram')));
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text: righe.join('\n').slice(0, 4000),
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

  // Bluesky conta 300 caratteri in tutto, URL compreso: due descrizioni non ci
  // stanno. Restano i due titoli e il link alla pagina italiana, che ha il
  // selettore lingua in cima.
  const url = conUta(testo.it.url, 'bluesky');
  const spazio = 300 - url.length - 2;
  const titoli = [`🇮🇹 ${testo.it.titolo}`];
  if (testo.en) titoli.push(`🇬🇧 ${testo.en.titolo}`);
  const corpo = tronca(titoli.join('\n'), Math.max(40, spazio));
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
        langs: testo.en ? ['it', 'en'] : ['it'],
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

  const messaggio = corpoBilingue({
    it: { ...testo.it, url: conUta(testo.it.url, 'facebook') },
    en: testo.en ? { ...testo.en, url: conUta(testo.en.url, 'facebook') } : null,
  });

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: messaggio, link: conUta(testo.it.url, 'facebook'), access_token: token }),
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

  const candidate = raggruppa(leggiSitemap(xml))
    .filter((p) => !ESCLUSE.has(p.chiave))
    .filter((p) => p.lastmod && (!stato.pubblicati[p.chiave] || p.lastmod > stato.pubblicati[p.chiave]))
    .sort((a, b) => (a.lastmod < b.lastmod ? 1 : -1))
    .slice(0, MAX_POST);

  if (!candidate.length) {
    console.log('Nessuna pagina nuova o aggiornata da annunciare.');
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
    const titoloIt = info.titolo || pagina.chiave;
    const descrizioneIt = info.descrizione || '';

    const base = pagina.chiave === '/' ? 'index' : pagina.chiave.replace(/^\//, '');
    const enBase = versioneInglese({ ...info, titolo: titoloIt, descrizione: descrizioneIt }, base);
    const en = enBase ? { ...enBase, url: pagina.urlEn || url } : null;
    if (!en) console.log('  · nessuna traduzione inglese per questa pagina: post solo in italiano');
    else if (!en.descrizione) {
      console.log(`  · inglese senza descrizione (chiave ${info.chiaveParagrafo || '—'}, voci inline ${Object.keys(info.inlineEn || {}).length})`);
    }

    const testo = {
      it: { titolo: titoloIt, descrizione: descrizioneIt, url },
      en,
    };

    if (DRY || !canaliConfigurati) {
      console.log('  [prova] ' + testoBase(testo).replace(/\n+/g, ' / '));
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
    await writeFile(STATO, JSON.stringify(stato, null, 2) + '\n', 'utf8');
    console.log('\nStato salvato in scripts/social/state.json');
  }
}

main().catch((e) => {
  console.error('Errore imprevisto:', e);
  process.exit(1);
});
