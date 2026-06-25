// api/newsletter.js — POST: iscrizione newsletter con double opt-in
'use strict';
const crypto = require('crypto');
const { isRateLimited, clientIp } = require('./_ratelimit');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const SITE         = 'https://easyitaliahub.it';
const FROM         = 'Easy Italia Hub <notifiche@easyitaliahub.it>';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'JSON non valido.' }); }

  if (body.website) return res.status(200).json({ ok: true }); // honeypot

  const ip = clientIp(req);
  if (isRateLimited(ip, { name: 'newsletter', max: 3 }))
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto.' });

  const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
  const name  = String(body.name  || '').trim().slice(0, 120);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email non valida.' });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Demo mode: non possiamo fare double opt-in senza storage
    if (RESEND_KEY) await sendConfirmEmail(email, name, 'DEMO_TOKEN_NO_DB');
    return res.status(200).json({ pending: true, demo: true });
  }

  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  // Upsert: se email esiste e non confermata → aggiorna token; se confermata → 200 silenzioso
  const existing = await sbFetch('GET', `newsletter_subscribers?email=eq.${encodeURIComponent(email)}&select=confirmed`);
  if (existing.ok) {
    const rows = await existing.json();
    if (rows.length && rows[0].confirmed) return res.status(200).json({ pending: true }); // già iscritto, no leak
  }

  const upsert = await sbFetch('POST', 'newsletter_subscribers?on_conflict=email', {
    email, name: name || null, token, token_expires_at: expires, confirmed: false,
  }, { 'Prefer': 'resolution=merge-duplicates' });

  if (!upsert.ok) {
    console.error('[newsletter] supabase upsert failed', upsert.status, await upsert.text());
    return res.status(500).json({ error: 'Errore. Riprova.' });
  }

  if (RESEND_KEY) await sendConfirmEmail(email, name, token);

  return res.status(200).json({ pending: true });
};

async function sendConfirmEmail(email, name, token) {
  const link = `${SITE}/api/newsletter-confirm?token=${token}`;
  const greeting = name ? `Ciao ${escHtml(name)},` : 'Ciao,';
  const html = wrap('Conferma la tua iscrizione', `
    <p style="margin:0 0 18px;font-size:15px;color:#e8dcc8;line-height:1.7;">${greeting}<br>
    Hai richiesto di iscriverti alla newsletter di <strong>Easy Italia Hub</strong>. Clicca il tasto qui sotto per confermare.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}" style="display:inline-block;background:#c8a96e;color:#0e0b06;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:99px;">Conferma iscrizione →</a>
    </div>
    <p style="margin:0;font-size:12px;color:#7d7058;line-height:1.7;">Il link è valido per 24 ore. Se non hai richiesto l'iscrizione, ignora questa email.</p>
    <p style="margin:12px 0 0;font-size:11px;color:#7d7058;word-break:break-all;">Oppure copia: ${escHtml(link)}</p>`);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [email], subject: 'Conferma la tua iscrizione — Easy Italia Hub', html }),
  });
}

function sbFetch(method, path, body, extraHeaders = {}) {
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', ...extraHeaders,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
}

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

function wrap(title, inner) {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#080604;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080604;">
<tr><td align="center" style="padding:32px 16px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#1a130a;border-radius:16px;padding:32px 36px;border-top:3px solid #c8a96e;">
    <p style="margin:0 0 6px;font-size:12px;color:#7d7058;letter-spacing:.1em;text-transform:uppercase;">Easy Italia Hub — newsletter</p>
    <h1 style="margin:0 0 20px;font-size:21px;font-weight:700;color:#e8dcc8;">${title}</h1>
    ${inner}
  </td></tr></table>
</td></tr></table></body></html>`;
}
