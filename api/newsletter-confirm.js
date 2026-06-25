// api/newsletter-confirm.js — GET: conferma token double opt-in
'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const SITE         = 'https://easyitaliahub.it';
const FROM         = 'Easy Italia Hub <notifiche@easyitaliahub.it>';
const ADMIN        = process.env.CONTACT_TO_EMAIL || 'info@easyitaliahub.it';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = String(req.query?.token || '').replace(/[^a-f0-9]/gi, '').slice(0, 64);
  if (!token) return res.redirect(302, `${SITE}/conferma-newsletter?e=invalid`);

  if (!SUPABASE_URL || !SUPABASE_KEY)
    return res.redirect(302, `${SITE}/conferma-newsletter?ok=1&demo=1`);

  // Trova il subscriber con questo token
  const lookup = await sbFetch('GET',
    `newsletter_subscribers?token=eq.${token}&select=id,email,name,confirmed,token_expires_at`);
  if (!lookup.ok) return res.redirect(302, `${SITE}/conferma-newsletter?e=server`);

  const rows = await lookup.json();
  if (!rows.length) return res.redirect(302, `${SITE}/conferma-newsletter?e=invalid`);

  const sub = rows[0];
  if (sub.confirmed) return res.redirect(302, `${SITE}/conferma-newsletter?ok=1&already=1`);

  if (new Date(sub.token_expires_at) < new Date())
    return res.redirect(302, `${SITE}/conferma-newsletter?e=expired`);

  // Conferma
  const update = await sbFetch('PATCH',
    `newsletter_subscribers?id=eq.${sub.id}`,
    { confirmed: true, confirmed_at: new Date().toISOString(), token: null, token_expires_at: null });

  if (!update.ok) {
    console.error('[nl-confirm] patch failed', update.status, await update.text());
    return res.redirect(302, `${SITE}/conferma-newsletter?e=server`);
  }

  // Email benvenuto + notifica admin (fire-and-forget)
  if (RESEND_KEY) {
    sendWelcome(sub.email, sub.name).catch(console.error);
    notifyAdmin(sub.email, sub.name).catch(console.error);
  }

  return res.redirect(302, `${SITE}/conferma-newsletter?ok=1`);
};

async function sendWelcome(email, name) {
  const greeting = name ? `Ciao ${escHtml(name)},` : 'Ciao,';
  const html = wrap('Sei iscritto alla newsletter!', `
    <p style="margin:0 0 18px;font-size:15px;color:#e8dcc8;line-height:1.7;">${greeting}<br>
    La tua iscrizione a <strong>Easy Italia Hub</strong> è confermata.</p>
    <p style="margin:0 0 18px;font-size:14px;color:#a89070;line-height:1.7;">Riceverai aggiornamenti su novità burocratiche, opportunità selezionate e risorse per la tua vita in Italia. Nessuno spam, promesso.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE}" style="display:inline-block;background:#c8a96e;color:#0e0b06;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:99px;">Visita Easy Italia Hub →</a>
    </div>
    <p style="margin:0;font-size:11px;color:#7d7058;">Per disdire in qualsiasi momento rispondi a questa email con oggetto "Disdici".</p>`);

  await resendSend({ to: [email], subject: 'Benvenuto in Easy Italia Hub 🎉', html });
}

async function notifyAdmin(email, name) {
  const html = wrap('Nuova iscrizione confermata', `
    <p style="margin:0 0 4px;font-size:13px;color:#a89070;">Email</p>
    <p style="margin:0 0 14px;font-size:15px;color:#e8dcc8;font-weight:600;">${escHtml(email)}</p>
    ${name ? `<p style="margin:0 0 4px;font-size:13px;color:#a89070;">Nome</p><p style="margin:0;font-size:15px;color:#e8dcc8;font-weight:600;">${escHtml(name)}</p>` : ''}
    <p style="margin:16px 0 0;font-size:12px;color:#7d7058;">Double opt-in completato.</p>`);

  await resendSend({ to: [ADMIN], subject: `Nuova iscrizione newsletter — ${escHtml(email)}`, html });
}

async function resendSend(payload) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, ...payload }),
  });
}

function sbFetch(method, path, body) {
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal',
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
