// api/email.js — POST: form contatti / newsletter / promemoria scadenze
// body.type = 'contact' (default) | 'newsletter' | 'remind'
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const MAX_NAME = 120;
const MAX_MSG  = 5000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ error: 'JSON non valido.' }); }

  const type = ['newsletter', 'remind'].includes(body.type) ? body.type : 'contact';
  const ip = clientIp(req);
  const rlName = type === 'remind' ? 'email-remind' : 'email';
  const rlMax  = type === 'remind' ? 2 : 8;
  if (isRateLimited(ip, { name: rlName, max: rlMax })) {
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto e riprova.' });
  }

  if (type === 'remind') return handleRemind(req, res, body);
  return handleContact(req, res, body, type);
};

// ── CONTACT / NEWSLETTER ────────────────────────────────────────────────────

async function handleContact(req, res, body, type) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const TO         = process.env.CONTACT_TO_EMAIL || 'info@easyitaliahub.it';

  if (body.website) return res.status(200).json({ ok: true }); // honeypot

  const email   = String(body.email   || '').trim().slice(0, 254);
  const name    = String(body.name    || '').trim().slice(0, MAX_NAME);
  const message = String(body.message || '').trim().slice(0, MAX_MSG);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email non valida.' });
  if (type === 'contact' && (!name || !message))
    return res.status(400).json({ error: 'Nome e messaggio sono obbligatori.' });

  if (!RESEND_KEY) {
    return res.status(200).json({ demo: true, message: 'Demo: RESEND_API_KEY non impostato.' });
  }

  const subject = type === 'newsletter'
    ? `Nuova iscrizione newsletter — ${name ? name + ' ' : ''}<${email}>`
    : `Nuovo messaggio dal sito — ${name}`;
  const html = type === 'newsletter' ? buildNewsletterHtml(name, email) : buildContactHtml(name, email, message);
  const payload = { from: 'Easy Italia Hub <notifiche@easyitaliahub.it>', to: [TO], subject, html };
  if (type === 'contact') payload.reply_to = email;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error('[email/contact] Resend error', resp.status, errBody);
    let reason = 'unknown';
    try { reason = JSON.parse(errBody).message || errBody.slice(0, 120); } catch {}
    console.error('[email/contact] resend reason:', reason);
    return res.status(500).json({ error: 'Errore invio. Riprova più tardi.' });
  }

  // Conferma automatica al mittente (best-effort: non blocca la risposta).
  if (type === 'contact') {
    try {
      const c = confirmStrings(body.lang);
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Easy Italia Hub <notifiche@easyitaliahub.it>',
          to: [email],
          reply_to: TO,
          subject: c.subject,
          html: buildConfirmHtml(name, message, c),
        }),
      });
    } catch (e) { console.error('[email/contact] confirm send failed', e); }
  }

  return res.status(200).json({ ok: true });
}

// ── REMIND ──────────────────────────────────────────────────────────────────

async function handleRemind(req, res, body) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const { email, name = '', deadlines = [] } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email non valida.' });
  if (!Array.isArray(deadlines))
    return res.status(400).json({ error: 'deadlines deve essere un array.' });

  if (!RESEND_KEY)
    return res.status(200).json({ demo: true, message: 'Demo: RESEND_API_KEY non impostato.' });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const limit = new Date(today); limit.setDate(limit.getDate() + 60);

  const upcoming = deadlines
    .filter(d => {
      if (!d || typeof d.date !== 'string' || !d.title) return false;
      const dt = parseDate(d.date);
      return dt !== null && dt >= today && dt <= limit;
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 20);

  const subject = upcoming.length > 0
    ? `Le tue prossime ${upcoming.length} scadenz${upcoming.length > 1 ? 'e' : 'a'} — Easy Italia Hub`
    : 'La tua lista scadenze — Easy Italia Hub';

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Easy Italia Hub <promemoria@easyitaliahub.it>',
      to: [email],
      subject,
      html: buildRemindHtml(name || null, upcoming),
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error('[email/remind] Resend error', resp.status, errBody);
    return res.status(500).json({ error: 'Errore invio email. Riprova.' });
  }

  return res.status(200).json({ ok: true });
}

// ── HELPERS ─────────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function wrap(title, inner) {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/></head>
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
</table></body></html>`;
}

function buildContactHtml(name, email, message) {
  return wrap('Nuovo messaggio dal form contatti', `
    <p style="margin:0 0 4px;font-size:13px;color:#a89070;">Da</p>
    <p style="margin:0 0 16px;font-size:15px;color:#e8dcc8;font-weight:600;">${escHtml(name)} &lt;${escHtml(email)}&gt;</p>
    <p style="margin:0 0 4px;font-size:13px;color:#a89070;">Messaggio</p>
    <p style="margin:0;font-size:14px;color:#e8dcc8;line-height:1.7;white-space:pre-wrap;">${escHtml(message)}</p>
    <p style="margin:24px 0 0;font-size:12px;color:#7d7058;">Rispondi a questa email per scrivere direttamente al mittente.</p>`);
}

function confirmStrings(lang) {
  const S = {
    it: { subject: 'Abbiamo ricevuto il tuo messaggio ✓', title: 'Messaggio ricevuto', hi: 'Ciao', body: 'Grazie per averci scritto. Abbiamo ricevuto il tuo messaggio e ti risponderemo al più presto, di solito entro 1–2 giorni lavorativi.', copy: 'La tua copia del messaggio', note: 'Questa è una conferma automatica. Se non hai scritto tu, ignora questa email.' },
    en: { subject: 'We received your message ✓', title: 'Message received', hi: 'Hi', body: 'Thanks for reaching out. We have received your message and will reply as soon as possible, usually within 1–2 business days.', copy: 'Your copy of the message', note: 'This is an automatic confirmation. If you did not contact us, please ignore this email.' },
    si: { subject: 'අපි ඔබගේ පණිවිඩය ලැබුණා ✓', title: 'පණිවිඩය ලැබුණා', hi: 'ආයුබෝවන්', body: 'අප හා සම්බන්ධ වීම ගැන ස්තූතියි. ඔබගේ පණිවිඩය අපට ලැබී ඇති අතර, සාමාන්‍යයෙන් වැඩ කරන දින 1–2ක් ඇතුළත පිළිතුරු දෙන්නෙමු.', copy: 'ඔබගේ පණිවිඩයේ පිටපත', note: 'මෙය ස්වයංක්‍රීය තහවුරු කිරීමකි. ඔබ අප හා සම්බන්ධ නොවූයේ නම්, මෙය නොසලකා හරින්න.' },
    ta: { subject: 'உங்கள் செய்தியை நாங்கள் பெற்றோம் ✓', title: 'செய்தி பெறப்பட்டது', hi: 'வணக்கம்', body: 'எங்களைத் தொடர்பு கொண்டதற்கு நன்றி. உங்கள் செய்தியை நாங்கள் பெற்றுள்ளோம், பொதுவாக 1–2 வேலை நாட்களுக்குள் பதிலளிப்போம்.', copy: 'உங்கள் செய்தியின் நகல்', note: 'இது தானியங்கி உறுதிப்படுத்தல். நீங்கள் தொடர்பு கொள்ளவில்லை என்றால், இதைப் புறக்கணிக்கவும்.' },
  };
  return S[['it', 'en', 'si', 'ta'].includes(lang) ? lang : 'it'];
}

function buildConfirmHtml(name, message, c) {
  const greeting = name ? `${c.hi} ${escHtml(name)},` : `${c.hi},`;
  return wrap(c.title, `
    <p style="margin:0 0 16px;font-size:15px;color:#e8dcc8;font-weight:600;">${greeting}</p>
    <p style="margin:0 0 22px;font-size:14px;color:#c9bba0;line-height:1.7;">${escHtml(c.body)}</p>
    <p style="margin:0 0 6px;font-size:13px;color:#a89070;">${escHtml(c.copy)}</p>
    <p style="margin:0;font-size:14px;color:#e8dcc8;line-height:1.7;white-space:pre-wrap;border-left:2px solid #c8a96e;padding-left:14px;">${escHtml(message)}</p>
    <p style="margin:24px 0 0;font-size:12px;color:#7d7058;">${escHtml(c.note)}</p>`);
}

function buildNewsletterHtml(name, email) {
  const nameRow = name ? `<p style="margin:0 0 4px;font-size:13px;color:#a89070;">Nome</p>
    <p style="margin:0 0 14px;font-size:15px;color:#e8dcc8;font-weight:600;">${escHtml(name)}</p>` : '';
  return wrap('Nuova iscrizione alla newsletter', `
    ${nameRow}
    <p style="margin:0 0 4px;font-size:13px;color:#a89070;">Email</p>
    <p style="margin:0;font-size:15px;color:#e8dcc8;font-weight:600;">${escHtml(email)}</p>
    <p style="margin:16px 0 0;font-size:12px;color:#7d7058;">Iscrizione da easyitaliahub.it.</p>`);
}

function parseDate(s) {
  const p = String(s).split('-');
  if (p.length !== 3) return null;
  const d = new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1, 0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(s) {
  const MONTHS = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  const dt = parseDate(s);
  if (!dt) return s;
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function buildRemindHtml(name, deadlines) {
  const GOLD = '#c8a96e', BG = '#0e0b06', BG2 = '#1a130a', FG = '#e8dcc8';
  const MID = '#a89070', LOW = '#7d7058', CORAL = '#eb5939', GREEN = '#1f9d55';
  const greeting = name ? `Ciao ${escHtml(name)},` : 'Ciao,';

  const rows = deadlines.length > 0
    ? deadlines.map(d => {
        const dt = parseDate(d.date);
        const today = new Date(); today.setHours(0,0,0,0);
        const diff = dt ? Math.round((dt - today) / 86400000) : 0;
        const isPast = diff < 0, isSoon = !isPast && diff <= 7;
        const badge = isPast
          ? `<span style="background:rgba(235,89,57,.15);color:${CORAL};border:1px solid rgba(235,89,57,.3);border-radius:99px;font-size:12px;padding:3px 10px;">Scaduta da ${Math.abs(diff)} gg</span>`
          : isSoon
            ? `<span style="background:rgba(235,89,57,.15);color:${CORAL};border:1px solid rgba(235,89,57,.3);border-radius:99px;font-size:12px;padding:3px 10px;">${diff === 0 ? 'Oggi' : diff === 1 ? 'Domani' : 'Tra '+diff+' gg'}</span>`
            : `<span style="background:rgba(31,157,85,.12);color:${GREEN};border:1px solid rgba(31,157,85,.28);border-radius:99px;font-size:12px;padding:3px 10px;">Tra ${diff} giorni</span>`;
        return `<tr><td style="padding:12px 0;border-bottom:1px solid rgba(125,112,88,.12);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:15px;color:${FG};font-weight:600;">${escHtml(d.title)}</td>
                <td align="right" style="white-space:nowrap;padding-left:12px;">${badge}</td></tr>
            <tr><td colspan="2" style="font-size:12px;color:${LOW};padding-top:3px;">${fmtDate(d.date)}${d.note ? ' · ' + escHtml(d.note) : ''}</td></tr>
          </table></td></tr>`;
      }).join('')
    : `<tr><td style="padding:18px 0;color:${MID};font-size:14px;text-align:center;">Nessuna scadenza nei prossimi 60 giorni.</td></tr>`;

  return `<!DOCTYPE html><html lang="it">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#080604;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080604;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,${BG} 0%,#1c150a 100%);border-radius:16px 16px 0 0;padding:36px 40px 28px;border-top:3px solid ${GOLD};">
        <p style="margin:0 0 4px;font-size:12px;color:${LOW};letter-spacing:.1em;text-transform:uppercase;">Easy Italia Hub</p>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:${FG};line-height:1.3;">Le tue scadenze<br/><span style="color:${GOLD};">in un colpo d'occhio</span></h1>
      </td></tr>
      <tr><td style="background:${BG2};padding:28px 40px;border:1px solid rgba(125,112,88,.18);border-top:none;">
        <p style="margin:0 0 20px;font-size:14px;color:${MID};line-height:1.7;">${greeting} ecco le tue scadenze nei <strong style="color:${FG};">prossimi 60 giorni</strong>.</p>
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        <div style="margin-top:28px;text-align:center;">
          <a href="https://easyitaliahub.it/dashboard" style="display:inline-block;background:${GOLD};color:#0e0b06;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:99px;">Apri la Dashboard &rarr;</a>
        </div>
      </td></tr>
      <tr><td style="background:${BG};border-radius:0 0 16px 16px;padding:18px 40px;border:1px solid rgba(125,112,88,.12);border-top:none;text-align:center;">
        <p style="margin:0;font-size:11px;color:${LOW};line-height:1.7;">Hai ricevuto questa email perché l'hai richiesta dalla tua dashboard su <a href="https://easyitaliahub.it" style="color:${GOLD};text-decoration:none;">easyitaliahub.it</a>.</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}
