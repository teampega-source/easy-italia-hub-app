// api/contact.js — Inoltra form contatti e iscrizioni newsletter via Resend
// Demo mode se RESEND_API_KEY non è impostato.
// Destinatario: env CONTACT_TO_EMAIL (fallback info@easyitaliahub.it).
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const MAX_NAME = 120;
const MAX_MSG = 5000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit BEFORE any work: this endpoint sends real email (Resend cost) and
  // notifies the owner, so a scripted flood is spam + quota burn. 8 req/min/IP.
  if (isRateLimited(clientIp(req), { name: 'contact', max: 8 })) {
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto e riprova.' });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.CONTACT_TO_EMAIL || 'info@easyitaliahub.it';

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).json({ error: 'JSON non valido.' });
  }

  // Honeypot anti-bot: campo invisibile, se compilato fingiamo successo.
  if (body.website) return res.status(200).json({ ok: true });

  const type = body.type === 'newsletter' ? 'newsletter' : 'contact';
  const email = String(body.email || '').trim().slice(0, 254);
  const name = String(body.name || '').trim().slice(0, MAX_NAME);
  const message = String(body.message || '').trim().slice(0, MAX_MSG);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email non valida.' });
  }
  if (type === 'contact' && (!name || !message)) {
    return res.status(400).json({ error: 'Nome e messaggio sono obbligatori.' });
  }

  if (!RESEND_KEY) {
    return res.status(200).json({
      demo: true,
      message: 'Demo: RESEND_API_KEY non impostato su Vercel — il messaggio NON è stato inviato.',
    });
  }

  const subject = type === 'newsletter'
    ? `Nuova iscrizione newsletter — ${email}`
    : `Nuovo messaggio dal sito — ${name}`;

  const html = type === 'newsletter'
    ? buildNewsletterHtml(email)
    : buildContactHtml(name, email, message);

  const payload = {
    from: 'Easy Italia Hub <notifiche@easyitaliahub.it>',
    to: [TO],
    subject,
    html,
  };
  // Per i messaggi di contatto, rispondi direttamente al mittente con "Rispondi".
  if (type === 'contact') payload.reply_to = email;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error('[contact] Resend error', resp.status, errBody);
    let reason = 'unknown';
    try { reason = JSON.parse(errBody).message || errBody.slice(0, 120); } catch {}
    return res.status(500).json({ error: 'Errore invio. Riprova più tardi.', _resend: reason });
  }

  res.status(200).json({ ok: true });
};

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function wrap(title, inner) {
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#080604;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080604;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#1a130a;border-radius:16px;padding:32px 36px;border-top:3px solid #c8a96e;">
        <p style="margin:0 0 6px;font-size:12px;color:#7d7058;letter-spacing:.1em;text-transform:uppercase;">Easy Italia Hub — notifica</p>
        <h1 style="margin:0 0 20px;font-size:21px;font-weight:700;color:#e8dcc8;">${title}</h1>
        ${inner}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function buildContactHtml(name, email, message) {
  return wrap('Nuovo messaggio dal form contatti', `
    <p style="margin:0 0 4px;font-size:13px;color:#a89070;">Da</p>
    <p style="margin:0 0 16px;font-size:15px;color:#e8dcc8;font-weight:600;">${escHtml(name)} &lt;${escHtml(email)}&gt;</p>
    <p style="margin:0 0 4px;font-size:13px;color:#a89070;">Messaggio</p>
    <p style="margin:0;font-size:14px;color:#e8dcc8;line-height:1.7;white-space:pre-wrap;">${escHtml(message)}</p>
    <p style="margin:24px 0 0;font-size:12px;color:#7d7058;">Rispondi a questa email per scrivere direttamente al mittente.</p>`);
}

function buildNewsletterHtml(email) {
  return wrap('Nuova iscrizione alla newsletter', `
    <p style="margin:0;font-size:15px;color:#e8dcc8;font-weight:600;">${escHtml(email)}</p>
    <p style="margin:16px 0 0;font-size:12px;color:#7d7058;">Iscrizione dal footer di easyitaliahub.it.</p>`);
}
