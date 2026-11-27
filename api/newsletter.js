'use strict';
const crypto = require('crypto');
const { isRateLimited, clientIp } = require('./_ratelimit');
const {
  isSameOrigin, validEmail, text, cleanLang, verifyTurnstile,
  json, redirect, logError,
} = require('./_security');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const SITE         = 'https://easyitaliahub.it';
const FROM         = 'Easy Italia Hub <notifiche@easyitaliahub.it>';
const ADMIN        = process.env.CONTACT_TO_EMAIL || 'info@easyitaliahub.it';

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    if (String((req.query && req.query.action) || '') === 'unsubscribe') return handleUnsubscribe(req, res);
    return handleConfirm(req, res);
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }, { Allow: 'POST' });
  res.setHeader('Cache-Control', 'no-store');

  // Doppia barriera contro form cross-site: origine + rate limit.
  if (!isSameOrigin(req)) return json(res, 403, { error: 'Origine non consentita.' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return json(res, 400, { error: 'JSON non valido.' }); }

  if (body.website) return json(res, 200, { ok: true }); // honeypot

  const ip = clientIp(req);
  if (isRateLimited(ip, { name: 'newsletter', max: 3 }))
    return json(res, 429, { error: 'Troppe richieste. Attendi un minuto.' });

  const email = text(body.email, 254).toLowerCase();
  const name  = text(body.name, 120);
  const lang  = cleanLang(body.lang, 'it');

  if (!validEmail(email))
    return json(res, 400, { error: 'Email non valida.' });

  const captchaOk = await verifyTurnstile(req, body.turnstileToken || body['cf-turnstile-response']);
  if (!captchaOk) return json(res, 400, { error: 'Verifica anti-bot non riuscita. Ricarica e riprova.' });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    if (RESEND_KEY) await sendConfirmEmail(email, name, 'DEMO_TOKEN_NO_DB');
    return json(res, 200, { pending: true, demo: true });
  }

  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const existing = await sbFetch('GET', `newsletter_subscribers?email=eq.${encodeURIComponent(email)}&select=confirmed`);
  if (existing.ok) {
    const rows = await existing.json();
    if (rows.length && rows[0].confirmed) return json(res, 200, { pending: true });
  }

  const base = { email, name: name || null, token, token_expires_at: expires, confirmed: false };
  let upsert = await sbFetch('POST', 'newsletter_subscribers?on_conflict=email',
    { ...base, lang, unsubscribed_at: null }, { 'Prefer': 'resolution=merge-duplicates' });

  /* La colonna lang arriva con migration-012. Se il database non è ancora
     aggiornato, non blocchiamo l'iscrizione: salviamo senza lingua e la
     migrazione la aggiungerà dopo. */
  if (!upsert.ok && upsert.status === 400) {
    const firstError = await upsert.text();
    logError('newsletter/upsert-lang', new Error(firstError));
    upsert = await sbFetch('POST', 'newsletter_subscribers?on_conflict=email',
      base, { 'Prefer': 'resolution=merge-duplicates' });
  }

  if (!upsert.ok) {
    logError('newsletter/upsert', new Error(`supabase ${upsert.status}`));
    return json(res, 500, { error: 'Errore. Riprova.' });
  }

  if (RESEND_KEY) await sendConfirmEmail(email, name, token);

  return json(res, 200, { pending: true });
};

async function handleConfirm(req, res) {
  const token = String(req.query?.token || '').replace(/[^a-f0-9]/gi, '').slice(0, 64);
  if (!token) return redirect(res, '/conferma-newsletter?e=invalid');

  if (!SUPABASE_URL || !SUPABASE_KEY)
    return redirect(res, '/conferma-newsletter?ok=1&demo=1');

  // unsub_token arriva con migration-012; se manca, la conferma funziona lo stesso.
  let lookup = await sbFetch('GET',
    `newsletter_subscribers?token=eq.${token}&select=id,email,name,confirmed,token_expires_at,unsub_token`);
  if (!lookup.ok) {
    lookup = await sbFetch('GET',
      `newsletter_subscribers?token=eq.${token}&select=id,email,name,confirmed,token_expires_at`);
  }
  if (!lookup.ok) return redirect(res, '/conferma-newsletter?e=server');

  const rows = await lookup.json();
  if (!rows.length) return redirect(res, '/conferma-newsletter?e=invalid');

  const sub = rows[0];
  if (sub.confirmed) return redirect(res, '/conferma-newsletter?ok=1&already=1');

  if (new Date(sub.token_expires_at) < new Date())
    return redirect(res, '/conferma-newsletter?e=expired');

  let update = await sbFetch('PATCH',
    `newsletter_subscribers?id=eq.${sub.id}`,
    { confirmed: true, confirmed_at: new Date().toISOString(), token: null, token_expires_at: null, unsubscribed_at: null });
  if (!update.ok && update.status === 400) {
    // Pre-migration-012: la colonna non esiste ancora, ma la conferma deve funzionare.
    update = await sbFetch('PATCH',
      `newsletter_subscribers?id=eq.${sub.id}`,
      { confirmed: true, confirmed_at: new Date().toISOString(), token: null, token_expires_at: null });
  }

  if (!update.ok) {
    logError('nl-confirm/patch', new Error(`supabase ${update.status}`));
    return redirect(res, '/conferma-newsletter?e=server');
  }

  if (RESEND_KEY) {
    sendWelcome(sub.email, sub.name, sub.unsub_token).catch((e) => logError('nl-welcome', e));
    notifyAdmin(sub.email, sub.name).catch((e) => logError('nl-admin', e));
  }

  return redirect(res, '/conferma-newsletter?ok=1');
}

/* Disiscrizione con token non indovinabile. Non usa email o id passati dal
   client: il token è l'unica chiave, e la risposta non conferma se l'indirizzo
   esiste davvero. */
async function handleUnsubscribe(req, res) {
  const token = String((req.query && req.query.token) || '').replace(/[^a-f0-9-]/gi, '').slice(0, 64);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token))
    return redirect(res, '/conferma-newsletter?e=invalid');

  if (SUPABASE_URL && SUPABASE_KEY) {
    const lookup = await sbFetch('GET',
      `newsletter_subscribers?unsub_token=eq.${encodeURIComponent(token)}&select=id`);
    if (!lookup.ok) {
      logError('nl-unsub/lookup', new Error(`supabase ${lookup.status}`));
      return redirect(res, '/conferma-newsletter?e=server');
    }
    const rows = await lookup.json();
    if (rows.length) {
      let patch = await sbFetch('PATCH',
        `newsletter_subscribers?id=eq.${rows[0].id}`,
        { confirmed: false, unsubscribed_at: new Date().toISOString() });
      if (!patch.ok) {
        // Se la colonna non è ancora stata aggiunta, almeno fermiamo gli invii.
        patch = await sbFetch('PATCH',
          `newsletter_subscribers?id=eq.${rows[0].id}`, { confirmed: false });
      }
      if (!patch.ok) return redirect(res, '/conferma-newsletter?e=server');
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"/>` +
    `<title>Iscrizione rimossa — Easy Italia Hub</title></head>` +
    `<body style="font-family:system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:0 1rem;color:#1c1a17">` +
    `<h1 style="font-size:1.4rem">Iscrizione rimossa</h1>` +
    `<p>Non riceverai più la newsletter di Easy Italia Hub. Se è stato un errore, puoi iscriverti di nuovo dalla home.</p>` +
    `<p><a href="/" style="color:#9a7d45">Torna a Easy Italia Hub →</a></p></body></html>`);
}

async function sendConfirmEmail(email, name, token) {
  const link = `${SITE}/api/newsletter?token=${token}`;
  const greeting = name ? `Ciao ${escHtml(name)},` : 'Ciao,';
  const html = wrap('Conferma la tua iscrizione', `
    <p style="margin:0 0 18px;font-size:15px;color:#e8dcc8;line-height:1.7;">${greeting}<br>
    Hai richiesto di iscriverti alla newsletter di <strong>Easy Italia Hub</strong>. Clicca il tasto qui sotto per confermare.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}" style="display:inline-block;background:#c8a96e;color:#0e0b06;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:99px;">Conferma iscrizione →</a>
    </div>
    <p style="margin:0;font-size:12px;color:#7d7058;line-height:1.7;">Il link è valido per 24 ore. Se non hai richiesto l'iscrizione, ignora questa email.</p>
    <p style="margin:12px 0 0;font-size:11px;color:#7d7058;word-break:break-all;">Oppure copia: ${escHtml(link)}</p>`);

  await resendSend({ to: [email], subject: 'Conferma la tua iscrizione — Easy Italia Hub', html });
}

async function sendWelcome(email, name, unsubToken) {
  const greeting = name ? `Ciao ${escHtml(name)},` : 'Ciao,';
  const unsub = unsubToken
    ? `${SITE}/api/newsletter?action=unsubscribe&token=${encodeURIComponent(unsubToken)}`
    : `${SITE}/contatti`;
  const html = wrap('Sei iscritto alla newsletter!', `
    <p style="margin:0 0 18px;font-size:15px;color:#e8dcc8;line-height:1.7;">${greeting}<br>
    La tua iscrizione a <strong>Easy Italia Hub</strong> è confermata.</p>
    <p style="margin:0 0 18px;font-size:14px;color:#a89070;line-height:1.7;">Riceverai aggiornamenti su novità burocratiche, opportunità selezionate e risorse per la tua vita in Italia. Nessuno spam, promesso.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE}" style="display:inline-block;background:#c8a96e;color:#0e0b06;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:99px;">Visita Easy Italia Hub →</a>
    </div>
    <p style="margin:0;font-size:11px;color:#7d7058;">Per disdire in qualsiasi momento <a href="${unsub}" style="color:#7d7058">clicca qui</a>.</p>`);

  await resendSend({
    to: [email], subject: 'Benvenuto in Easy Italia Hub 🎉', html,
    headers: unsubToken ? { 'List-Unsubscribe': `<${unsub}>` } : undefined,
  });
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

function sbFetch(method, path, body, extraHeaders = {}) {
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal', ...extraHeaders,
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
