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
 * Da dove viene l'inglese. Quattro fonti, tutte già scritte nel sito:
 *   · window.EIH_I18N_EXTRA della pagina: page.h1/page.lead, oppure la voce
 *     della chiave data-i18n quando la pagina traduce così titolo e sommario;
 *   · i blocchi en:{...} accanto a it/si/ta dentro la pagina, per le pagine
 *     che si portano dietro il proprio dizionario;
 *   · traduzioni/<pagina>.en.json (italiano → inglese) per le pagine più
 *     vecchie, dove la traduzione è indicizzata sul testo italiano;
 *   · assets/i18n/<pagina>.en.json, il dizionario che usa il browser nel
 *     corpo della pagina: le impronte dei pezzi dell'h1 e del sommario danno
 *     la traduzione che il visitatore vede davvero.
 * Niente testo inventato: se nessuna delle quattro ha la pagina, il post
 * resta solo in italiano e il log lo dice. Una pagina che non risponde, o che
 * risponde senza titolo, viene saltata: non si annuncia il suo percorso.
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
const I18N = join(RADICE, 'assets', 'i18n');

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

/* Il dizionario che il browser usa per il corpo della pagina: impronta
   FNV-1a a 32 bit del testo italiano → inglese. Deve restare identica a
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

function dizionarioBrowser(base) {
  const mappa = new Map();
  try {
    const dati = JSON.parse(readFileSync(join(I18N, `${base}.en.json`), 'utf8'));
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

/* Le pagine più recenti portano le traduzioni dentro di sé, in blocchi
   `en:{...}` accanto a it/si/ta. Il blocco inglese finisce dove comincia la
   lingua successiva, così non si devono bilanciare le graffe dentro le
   stringhe (ci sono testi con { e } dentro). */
function dizionarioInline(html) {
  const inglese = {};
  for (const m of html.matchAll(/\ben:\s*\{/g)) {
    const dopo = html.slice(m.index + m[0].length - 1);
    const fine = dopo.search(/\n\s*(?:it|si|ta):\s*\{/);
    Object.assign(inglese, coppie(fine === -1 ? dopo : dopo.slice(0, fine)));
  }
  return inglese;
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
    const leadHtml = (html.match(/<p[^>]*class="[^"]*\blead\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '';
    const lead = senzaTag(leadHtml);
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
    // blocco window.EIH_I18N_EXTRA: sono le stesse che usa il browser. Il
    // blocco ha en/si/ta uno accanto all'altro, quindi si tiene solo en.
    let extraEn = null;
    const extra = html.match(/window\.EIH_I18N_EXTRA\s*=/);
    if (extra) {
      const resto = html.slice(extra.index + extra[0].length);
      const inizio = resto.search(/"en"\s*:\s*\{/);
      if (inizio !== -1) {
        const blocco = resto.slice(inizio);
        const fine = blocco.slice(1).search(/"\s*(?:si|ta)"\s*:\s*\{|\}\s*;/);
        extraEn = coppie(fine === -1 ? blocco : blocco.slice(0, fine + 1));
      }
    }

    return {
      titolo: pulisciTitolo(titolo), h1, h1Html, h1NoTr: /\bdata-no-tr\b/i.test(h1Tag), chiaveH1,
      descrizione, lead, primoParagrafo: primo.testo, chiaveParagrafo: primo.chiave, extraEn,
      inlineEn: dizionarioInline(html),
    };
  } catch {
    return null;
  }
}

// ── italiano → inglese ─────────────────────────────────────────────────────
//
// Prima la traduzione che la pagina porta con sé (EIH_I18N_EXTRA, blocchi
// en:{...}), poi traduzioni/<pagina>.en.json, dove le chiavi sono il testo
// italiano: il confronto si fa sul testo normalizzato, così spazi multipli e
// a capo non contano.

function leggiTraduzioni(base) {
  const mappa = new Map();
  try {
    const dati = JSON.parse(readFileSync(join(TRADUZIONI, `${base}.en.json`), 'utf8'));
    for (const [it, en] of Object.entries(dati)) {
      if (typeof en === 'string' && en.trim()) mappa.set(normalizza(it), en);
    }
  } catch { /* pagina senza traduzioni: si va avanti */ }
  return mappa;
}

function versioneInglese(info, base) {
  const mappa = leggiTraduzioni(base);
  const browser = dizionarioBrowser(base);
  const inline = info.inlineEn || {};
  const extra = info.extraEn || {};

  // Prima la traduzione scritta per questa pagina (page.h1/page.lead, poi la
  // chiave data-i18n quando la pagina traduce così titolo e sommario), poi
  // quella indicizzata sul testo italiano, infine il dizionario del browser.
  // Il dizionario globale di eih.js non entra: contiene solo le voci del menu
  // e del piede, mai il titolo o il sommario di una pagina.
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

  if (!titolo) return null;   // niente inglese vero: meglio nessun blocco
  return { titolo, descrizione: senzaTag(descrizione || '') };
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
    if (!info) {
      console.log('  · la pagina non risponde: salto (lo stato non avanza)');
      continue;
    }
    if (!info.titolo) {
      console.log('  · la pagina non ha un titolo: salto (lo stato non avanza)');
      continue;
    }
    const titoloIt = info.titolo;
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
