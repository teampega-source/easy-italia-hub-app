'use strict';

/* Digest settimanale della newsletter.
   Non è una rotta: viene chiamato da api/email.js?tipo=newsletter, così non
   aggiungiamo la tredicesima funzione serverless (il piano Hobby ne consente 12).

   Flusso:
   1. legge gli iscritti confermati da Supabase (solo service role);
   2. prende le ultime notizie dalle fonti ufficiali tramite /api/news;
   3. costruisce una mail nella lingua dell'iscritto;
   4. invia con Resend, con link di disiscrizione firmato e header
      List-Unsubscribe.

   Senza credenziali risponde { demo:true } e non invia nulla. Con ?dry=1
   costruisce il messaggio e restituisce solo un riepilogo. */

const { escapeHtml, safeUrl, logError } = require('./_security');

const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND = process.env.RESEND_API_KEY || '';
const SITE = 'https://easyitaliahub.it';
const FROM = 'Easy Italia Hub <notifiche@easyitaliahub.it>';
const MAX_DESTINATARI = 500;
const MAX_NOTIZIE = 5;

const TESTI = {
  it: {
    oggetto: 'Le novità della settimana — Easy Italia Hub',
    titolo: 'Le novità della settimana',
    intro: 'Le notizie ufficiali e le guide da leggere questa settimana.',
    notizie: 'Dalle fonti ufficiali',
    guide: 'Guide utili',
    cta: 'Apri Easy Italia Hub',
    fonte: 'Fonte',
    nota: 'Informazioni orientative: verifica sempre la fonte ufficiale prima di agire.',
    disdici: 'Non ricevere più questa email',
  },
  en: {
    oggetto: 'This week at Easy Italia Hub',
    titolo: 'This week at Easy Italia Hub',
    intro: 'Official news and guides worth reading this week.',
    notizie: 'From official sources',
    guide: 'Useful guides',
    cta: 'Open Easy Italia Hub',
    fonte: 'Source',
    nota: 'General information: always check the official source before acting.',
    disdici: 'Unsubscribe',
  },
  si: {
    oggetto: 'මේ සතියේ Easy Italia Hub',
    titolo: 'මේ සතියේ Easy Italia Hub',
    intro: 'මේ සතියේ කියවිය යුතු නිල පුවත් සහ මාර්ගෝපදේශ.',
    notizie: 'නිල මූලාශ්‍රවලින්',
    guide: 'ප්‍රයෝජනවත් මාර්ගෝපදේශ',
    cta: 'Easy Italia Hub විවෘත කරන්න',
    fonte: 'මූලාශ්‍රය',
    nota: 'සාමාන්‍ය තොරතුරු: ක්‍රියා කිරීමට පෙර සැමවිටම නිල මූලාශ්‍රය පරීක්ෂා කරන්න.',
    disdici: 'මෙම ඊමේල් නොලැබීමට',
  },
  ta: {
    oggetto: 'இந்த வாரம் Easy Italia Hub',
    titolo: 'இந்த வாரம் Easy Italia Hub',
    intro: 'இந்த வாரம் படிக்க வேண்டிய அதிகாரப்பூர்வ செய்திகள் மற்றும் வழிகாட்டிகள்.',
    notizie: 'அதிகாரப்பூர்வ ஆதாரங்களிலிருந்து',
    guide: 'பயனுள்ள வழிகாட்டிகள்',
    cta: 'Easy Italia Hub திறக்க',
    fonte: 'ஆதாரம்',
    nota: 'பொதுத் தகவல்: நடவடிக்கை எடுக்கும் முன் எப்போதும் அதிகாரப்பூர்வ ஆதாரத்தைச் சரிபார்க்கவும்.',
    disdici: 'இந்த மின்னஞ்சலை நிறுத்த',
  },
};

const GUIDE = [
  { it: 'Rinnovare il permesso di soggiorno', path: '/permesso-tracker' },
  { it: 'ISEE e Assegno Unico', path: '/assegno-unico' },
  { it: 'Dove trovare CAF e patronato', path: '/mappa' },
  { it: 'Conto in banca senza sorprese', path: '/guida-conti' },
];

function testo(lang) {
  return TESTI[lang] || TESTI.it;
}

function langOf(sub) {
  return ['it', 'en', 'si', 'ta'].includes(sub && sub.lang) ? sub.lang : 'it';
}

async function fetchLatestNews() {
  try {
    const r = await fetch(`${SITE}/api/news`, {
      headers: { Accept: 'application/json', 'User-Agent': 'EasyItaliaHub-newsletter/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (Array.isArray(d.items) ? d.items : []).slice(0, MAX_NOTIZIE);
  } catch (e) {
    logError('newsletter/news', e);
    return [];
  }
}

async function subscribers() {
  const base = 'newsletter_subscribers?confirmed=eq.true&select=email,name,lang,unsub_token';
  let r = await fetch(`${SB_URL}/rest/v1/${base}&unsubscribed_at=is.null&limit=${MAX_DESTINATARI}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    signal: AbortSignal.timeout(10000),
  });
  // Prima della migration-012 le colonne lang/unsubscribed_at possono mancare.
  if (!r.ok) {
    r = await fetch(`${SB_URL}/rest/v1/newsletter_subscribers?confirmed=eq.true&select=email,name&limit=${MAX_DESTINATARI}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
  }
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

function buildHtml(sub, notizie) {
  const lang = langOf(sub);
  const T = testo(lang);
  const unsub = sub.unsub_token
    ? `${SITE}/api/newsletter?action=unsubscribe&token=${encodeURIComponent(sub.unsub_token)}`
    : `${SITE}/contatti`;

  const newsRows = notizie.map((n) => {
    const url = safeUrl(n.src && n.src.url) || (SITE + '/news');
    const label = n.src && n.src.label ? n.src.label : T.fonte;
    return `<tr><td style="padding:14px 0;border-bottom:1px solid #eee">` +
      `<a href="${escapeHtml(url)}" style="color:#1c1a17;text-decoration:none;font-weight:600">${escapeHtml(n.title || '')}</a>` +
      `<div style="margin-top:4px;color:#777;font-size:13px;line-height:1.5">${escapeHtml(String(n.summary || '').slice(0, 180))}</div>` +
      `<div style="margin-top:4px;color:#9a7d45;font-size:11px">${escapeHtml(label)}</div></td></tr>`;
  }).join('');

  const guideRows = GUIDE.map((g) =>
    `<li style="margin:0 0 8px"><a href="${SITE}${g.path}" style="color:#9a7d45">${escapeHtml(g.it)}</a></li>`
  ).join('');

  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>` +
    `<body style="margin:0;padding:0;background:#f5f0e8;font-family:system-ui,-apple-system,sans-serif;color:#1c1a17">` +
    `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">` +
    `<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border-top:3px solid #c8a96e">` +
    `<tr><td style="padding:30px 34px 10px"><p style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a7d45">Easy Italia Hub</p>` +
    `<h1 style="margin:0;font-size:24px;line-height:1.3">${escapeHtml(T.titolo)}</h1>` +
    `<p style="margin:10px 0 0;color:#6b6254;font-size:14px;line-height:1.6">${escapeHtml(T.intro)}</p></td></tr>` +
    `<tr><td style="padding:8px 34px 0"><h2 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#9a7d45;margin:18px 0 4px">${escapeHtml(T.notizie)}</h2>` +
    `<table width="100%" cellpadding="0" cellspacing="0">${newsRows || `<tr><td style="padding:12px 0;color:#777">—</td></tr>`}</table>` +
    `<h2 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#9a7d45;margin:22px 0 8px">${escapeHtml(T.guide)}</h2>` +
    `<ul style="padding-left:18px;margin:0;font-size:14px;line-height:1.6">${guideRows}</ul></td></tr>` +
    `<tr><td style="padding:24px 34px 8px;text-align:center"><a href="${SITE}" style="display:inline-block;background:#c8a96e;color:#0e0b06;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:99px">${escapeHtml(T.cta)} →</a></td></tr>` +
    `<tr><td style="padding:8px 34px 28px"><p style="margin:14px 0 0;color:#8a8174;font-size:12px;line-height:1.6">${escapeHtml(T.nota)}</p>` +
    `<p style="margin:14px 0 0;color:#8a8174;font-size:11px;line-height:1.6">${escapeHtml(T.disdici)}: <a href="${escapeHtml(unsub)}" style="color:#8a8174">${escapeHtml(unsub)}</a></p></td></tr>` +
    `</table></td></tr></table></body></html>`;
}

function buildMessage(sub, notizie) {
  const T = testo(langOf(sub));
  const unsub = sub.unsub_token
    ? `${SITE}/api/newsletter?action=unsubscribe&token=${encodeURIComponent(sub.unsub_token)}`
    : null;
  const payload = {
    from: FROM,
    to: [sub.email],
    subject: T.oggetto,
    html: buildHtml(sub, notizie),
  };
  if (unsub) payload.headers = { 'List-Unsubscribe': `<${unsub}>` };
  return payload;
}

module.exports = {
  buildMessage,
  buildHtml,
  fetchLatestNews,
  subscribers,

  async run(req, res) {
    const dry = String((req.query && req.query.dry) || '') === '1';
    if (!SB_URL || !SB_KEY || !RESEND) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ demo: true, motivo: 'credenziali Supabase/Resend assenti' }));
    }

    try {
      const [notizie, destinatari] = await Promise.all([fetchLatestNews(), subscribers()]);
      if (dry) {
        const esempio = destinatari[0] || { email: 'dry-run@example.invalid', name: 'Dry Run', lang: 'it' };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          ok: true, dry: true, destinatari: destinatari.length,
          notizie: notizie.length,
          esempio: buildMessage(esempio, notizie),
        }));
      }

      let sent = 0, failed = 0;
      for (const sub of destinatari) {
        if (!sub || !sub.email) continue;
        try {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(buildMessage(sub, notizie)),
            signal: AbortSignal.timeout(15000),
          });
          if (r.ok) sent++;
          else { failed++; logError('newsletter/resend', new Error(`resend ${r.status}`)); }
        } catch (e) {
          failed++;
          logError('newsletter/send', e);
        }
        // Resend consente circa 2 richieste/secondo: niente raffiche.
        await new Promise((r) => setTimeout(r, 550));
      }

      try { require('./_battito').battito('newsletter'); } catch { /* il monitor non blocca */ }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true, destinatari: destinatari.length, sent, failed }));
    } catch (e) {
      try { require('./_battito').battito('newsletter', 'fail'); } catch { /* ignore */ }
      logError('newsletter/run', e);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: false, error: 'invio non completato' }));
    }
  },
};
