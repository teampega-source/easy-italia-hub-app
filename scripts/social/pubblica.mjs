#!/usr/bin/env node
/**
 * Pubblica in automatico le pagine nuove o aggiornate del sito.
 *
 * Come funziona, in breve:
 *   1. legge la sitemap (che è già la verità sulle pagine e sulle date);
 *   2. raggruppa le quattro lingue di una stessa pagina in una sola notizia;
 *   3. tiene traccia in state.json di cosa ha già annunciato;
 *   4. per ogni pagina nuova o con lastmod più recente prepara un testo
 *      bilingue — italiano dalla pagina italiana, inglese dalla sua versione
 *      /en — e lo manda ai canali configurati.
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
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITEMAP = join(RADICE, 'sitemap.xml');
const STATO = join(RADICE, 'scripts', 'social', 'state.json');

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
// inglese interessa l'indirizzo: da lì si legge il testo da affiancare.
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

// ── testo del post ─────────────────────────────────────────────────────────

function pulisciTitolo(t) {
  return String(t || '')
    .replace(/\s+/g, ' ')
    .split(/\s+[—|·]\s+/)[0]   // "Pagina — Easy Italia Hub" → "Pagina"
    .trim();
}

function decodifica(html) {
  return String(html || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

async function leggiPagina(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return {};
    const html = await res.text();
    const titolo = decodifica((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const descrizione = decodifica(
      (html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) ||
       html.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/i) || [])[1] || ''
    );
    return { titolo: pulisciTitolo(titolo), descrizione: descrizione.replace(/\s+/g, ' ').trim() };
  } catch {
    return {};
  }
}

// Un'AI gratuita è un di più, non un requisito: se c'è una chiave il testo
// suona più naturale, altrimenti titolo e descrizione bastano. La richiesta
// si fa una volta per lingua, così ogni blocco resta nella sua lingua invece
// di mescolarle in un testo solo.
async function conAI(titolo, descrizione, url, lingua) {
  const istruzioni = lingua === 'en'
    ? 'Write a social post in English for Easy Italia Hub, a reference point for the Sri Lankan ' +
      'community in Italy. Concrete, friendly tone, no advertising hype, no hashtags, at most 240 ' +
      'characters, one short call to action. Do not invent facts beyond the ones given. Reply with ' +
      'the post text only.'
    : 'Scrivi un post sociale in italiano per Easy Italia Hub, il punto di riferimento ' +
      'della comunità srilankese in Italia. Tono concreto e amichevole, niente enfasi da ' +
      'pubblicità, niente hashtag, massimo 240 caratteri, una sola frase di invito. ' +
      'Non inventare dati che non ti do. Rispondi solo con il testo del post.';
  const richiesta = `Titolo: ${titolo}\nDescrizione: ${descrizione}\nIndirizzo: ${url}`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
          encodeURIComponent(process.env.GEMINI_API_KEY),
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: istruzioni }] },
            contents: [{ role: 'user', parts: [{ text: richiesta }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
          }),
          signal: AbortSignal.timeout(25000),
        }
      );
      if (res.ok) {
        const dati = await res.json();
        const testo = dati?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (testo) return testo.trim();
      } else {
        console.log(`  · Gemini ha risposto ${res.status} (${lingua}), uso il testo base`);
      }
    } catch (e) {
      console.log(`  · Gemini non raggiungibile (${e.message}), uso il testo base`);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 200,
          messages: [
            { role: 'system', content: istruzioni },
            { role: 'user', content: richiesta },
          ],
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        const dati = await res.json();
        const testo = dati?.choices?.[0]?.message?.content;
        if (testo) return testo.trim();
      } else {
        console.log(`  · Groq ha risposto ${res.status} (${lingua}), uso il testo base`);
      }
    } catch (e) {
      console.log(`  · Groq non raggiungibile (${e.message}), uso il testo base`);
    }
  }

  return null;
}

// Due blocchi con la bandierina davanti: si legge subito chi parla italiano e
// chi inglese, senza etichette tipo "IT:" che sembrano un telegiornale.
function corpoBilingue(testo) {
  const blocchi = [];
  blocchi.push(`🇮🇹 ${testo.it.titolo}`);
  if (testo.it.descrizione) blocchi.push(testo.it.descrizione);
  if (testo.en) {
    blocchi.push('');
    blocchi.push(`🇬🇧 ${testo.en.titolo}`);
    if (testo.en.descrizione) blocchi.push(testo.en.descrizione);
  }
  return blocchi.join('\n');
}

function testoBase(testo, url) {
  return `${corpoBilingue(testo)}\n\n${url}`;
}

function tronca(testo, max) {
  if (testo.length <= max) return testo;
  return testo.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

// ── canali ─────────────────────────────────────────────────────────────────

const escapaHtml = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Ogni canale porta il suo UTM: senza, non si sa quale dei due porta visite.
function conUta(url, canale) {
  const u = new URL(url);
  u.searchParams.set('utm_source', canale);
  u.searchParams.set('utm_medium', 'social');
  u.searchParams.set('utm_campaign', 'novita');
  return u.toString();
}

async function telegram(testo, url) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { canale: 'telegram', esito: 'saltato', motivo: 'segreti assenti' };

  const link = conUta(url, 'telegram');
  const righe = [`🇮🇹 <b>${escapaHtml(testo.it.titolo)}</b>`];
  if (testo.it.descrizione) righe.push(escapaHtml(testo.it.descrizione));
  if (testo.en) {
    righe.push('', `🇬🇧 <b>${escapaHtml(testo.en.titolo)}</b>`);
    if (testo.en.descrizione) righe.push(escapaHtml(testo.en.descrizione));
  }
  righe.push('', escapaHtml(link));

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

async function bluesky(testo, url) {
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
  // stanno. Restano i due titoli, che dicono già di cosa si tratta, e il link.
  url = conUta(url, 'bluesky');
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
        langs: ['it', 'en'],
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
async function facebook(testo, url) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageId || !token) return { canale: 'facebook', esito: 'saltato', motivo: 'segreti assenti' };

  const link = conUta(url, 'facebook');
  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: corpoBilingue(testo),
      link,
      access_token: token,
    }),
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

    // La versione inglese è un'altra pagina, non una traduzione a mano: si
    // legge da lì, così il post inglese dice quello che il sito dice in inglese.
    let infoEn = {};
    if (pagina.urlEn && pagina.urlEn !== pagina.url) {
      infoEn = await leggiPagina(pagina.urlEn);
    }
    const en = (infoEn.titolo || infoEn.descrizione)
      ? { titolo: infoEn.titolo || titoloIt, descrizione: infoEn.descrizione || '' }
      : null;
    if (!en) console.log('  · versione inglese non trovata: post solo in italiano');

    const scrittoIt = await conAI(titoloIt, descrizioneIt, url, 'it');
    const scrittoEn = en ? await conAI(en.titolo, en.descrizione, pagina.urlEn || url, 'en') : null;

    const testo = {
      it: scrittoIt ? { titolo: scrittoIt, descrizione: '' } : { titolo: titoloIt, descrizione: descrizioneIt },
      en: en
        ? (scrittoEn ? { titolo: scrittoEn, descrizione: '' } : en)
        : null,
    };

    if (DRY || !canaliConfigurati) {
      console.log('  [prova] ' + testoBase(testo, url).replace(/\n+/g, ' / '));
      continue;
    }

    const esiti = [];
    for (const canale of [telegram, bluesky, facebook]) {
      try {
        esiti.push(await canale(testo, url));
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
