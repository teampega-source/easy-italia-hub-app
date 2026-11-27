'use strict';

/* Helper di sicurezza condiviso dalle funzioni serverless.
   Non aggiunge una rotta: il file inizia con "_" e non viene contato come
   funzione da scripts/conta-funzioni.mjs.

   Regole:
   - la service role key non esce mai da qui;
   - l'identità dell'utente si ricava SOLO dal Bearer token Supabase, mai dal body;
   - le risposte di errore non espongono dettagli interni;
   - i link di ritorno accettano solo il sito e il loopback di sviluppo. */

const crypto = require('crypto');

const SITE = 'https://easyitaliahub.it';
const LOOPBACK = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/;

function siteOrigin() {
  return (process.env.APP_ORIGIN || SITE).replace(/\/+$/, '');
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const o = String(origin).replace(/\/+$/, '');
  return o === siteOrigin() || o === SITE || o === 'https://www.easyitaliahub.it' || LOOPBACK.test(o);
}

/* Le mutazioni da browser devono arrivare dal nostro sito. Se Origin manca
   (curl, webhook, chiamata server-server) non blocchiamo: la richiesta non è
   un form cross-site. Se c'è ed è estranea, rispondiamo 403. */
function isSameOrigin(req) {
  try {
    const origin = req.headers && (req.headers.origin || req.headers.Origin);
    if (origin) return isAllowedOrigin(origin);
    const referer = req.headers && (req.headers.referer || req.headers.Referer);
    if (referer) {
      try { return isAllowedOrigin(new URL(referer).origin); } catch { return false; }
    }
    return true;
  } catch {
    return false;
  }
}

function originForRedirect(req) {
  try {
    const origin = req.headers && req.headers.origin;
    if (origin && isAllowedOrigin(origin)) return String(origin).replace(/\/+$/, '');
  } catch { /* ignore */ }
  return siteOrigin();
}

function bearer(req) {
  try {
    const raw = req.headers && (req.headers.authorization || req.headers.Authorization);
    const m = String(raw || '').match(/^Bearer\s+(.+)$/i);
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}

/* Verifica il JWT contro Supabase. Restituisce l'utente o null.
   Usa la chiave anon (pubblica): /auth/v1/user richiede comunque un token
   valido e non permette di leggere altri utenti. */
async function userFromRequest(req) {
  const token = bearer(req);
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  try {
    const r = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u : null;
  } catch {
    return null;
  }
}

function publicUser(user) {
  if (!user || !user.id) return null;
  return {
    id: String(user.id),
    email: typeof user.email === 'string' ? user.email.slice(0, 254) : '',
    lang: user.user_metadata && ['it', 'en', 'si', 'ta'].includes(user.user_metadata.lang)
      ? user.user_metadata.lang : null,
  };
}

function validEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function text(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function cleanLang(value, fallback) {
  return ['it', 'en', 'si', 'ta'].includes(value) ? value : (fallback || 'it');
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/* Solo URL http(s) con host esplicito. Per i redirect interni si usa
   safePath(), che non accetta "//" né schemi. */
function safeUrl(value) {
  try {
    const u = new URL(String(value));
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function safePath(value, fallback) {
  const p = String(value || '').trim();
  if (!p || !p.startsWith('/') || p.startsWith('//') || p.includes('\\') || /[\r\n]/.test(p)) return fallback || '/';
  return p;
}

function json(res, status, body, extra) {
  try {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (extra) for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
    return res.end(JSON.stringify(body));
  } catch {
    return res.end('{}');
  }
}

function redirect(res, location, status) {
  const target = safePath(location, '/');
  res.statusCode = status || 302;
  res.setHeader('Location', target);
  res.setHeader('Cache-Control', 'no-store');
  return res.end();
}

function isCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = String((req.headers && req.headers.authorization) || '');
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch { return false; }
}

/* Turnstile è obbligatorio solo quando il secret è configurato. Sulle form
   pubbliche (newsletter/contatti) il token è facoltativo finché non viene
   montato il widget; su registrazione lo verifica Supabase Auth. */
async function verifyTurnstile(req, token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  /* Il solo secret non basta: senza widget montato ogni form verrebbe
     rifiutata. L'attivazione esplicita evita di rompere newsletter e contatti
     mentre si configura Cloudflare. */
  if (!secret || process.env.TURNSTILE_REQUIRED !== '1') return true;
  if (!token) return false;
  try {
    const ip = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim();
    const body = new URLSearchParams({ secret, response: String(token).slice(0, 4096) });
    if (ip) body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return false;
    const d = await r.json();
    return d && d.success === true;
  } catch {
    return false;
  }
}

/* Log senza segreti, token o email complete. */
function logError(label, err) {
  const msg = err && err.message ? String(err.message).slice(0, 300) : 'errore';
  console.error(`[${label}] ${msg}`);
}

module.exports = {
  SITE,
  siteOrigin,
  isAllowedOrigin,
  isSameOrigin,
  originForRedirect,
  bearer,
  userFromRequest,
  publicUser,
  validEmail,
  text,
  cleanLang,
  escapeHtml,
  safeUrl,
  safePath,
  json,
  redirect,
  isCron,
  verifyTurnstile,
  logError,
};
