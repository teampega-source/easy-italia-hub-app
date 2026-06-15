// api/remind.js — Email promemoria scadenze via Resend
// Demo mode se RESEND_API_KEY non è impostato.
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Sends real email (Resend) to an attacker-supplied address → throttle hard to
  // stop the endpoint being used as a free mailer / quota drain. 6 req/min/IP.
  if (isRateLimited(clientIp(req), { name: 'remind', max: 6 })) {
    return res.status(429).json({ error: 'Troppe richieste. Attendi un minuto e riprova.' });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).json({ error: 'JSON non valido.' });
  }

  const { email, name = '', deadlines = [] } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email non valida.' });
  }
  if (!Array.isArray(deadlines)) {
    return res.status(400).json({ error: 'deadlines deve essere un array.' });
  }

  if (!RESEND_KEY) {
    return res.status(200).json({
      demo: true,
      message: 'Demo: RESEND_API_KEY non impostato su Vercel.',
    });
  }

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

  const html = buildEmailHtml(name || null, upcoming);

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Easy Italia Hub <promemoria@easyitaliahub.it>',
      to: [email],
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error('[remind] Resend error', resp.status, errBody);
    return res.status(500).json({ error: 'Errore invio email. Riprova.' });
  }

  res.status(200).json({ ok: true });
};

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

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function buildEmailHtml(name, deadlines) {
  const GOLD = '#c8a96e';
  const BG   = '#0e0b06';
  const BG2  = '#1a130a';
  const FG   = '#e8dcc8';
  const MID  = '#a89070';
  const LOW  = '#7d7058';
  const CORAL = '#eb5939';
  const GREEN = '#1f9d55';

  const greeting = name ? `Ciao ${escHtml(name)},` : 'Ciao,';

  const rows = deadlines.length > 0
    ? deadlines.map(d => {
        const dt = parseDate(d.date);
        const today = new Date(); today.setHours(0,0,0,0);
        const diff = dt ? Math.round((dt - today) / 86400000) : 0;
        const isPast = diff < 0;
        const isSoon = !isPast && diff <= 7;
        const badge = isPast
          ? `<span style="background:rgba(235,89,57,.15);color:${CORAL};border:1px solid rgba(235,89,57,.3);border-radius:99px;font-size:12px;padding:3px 10px;">Scaduta da ${Math.abs(diff)} gg</span>`
          : isSoon
            ? `<span style="background:rgba(235,89,57,.15);color:${CORAL};border:1px solid rgba(235,89,57,.3);border-radius:99px;font-size:12px;padding:3px 10px;">${diff === 0 ? 'Oggi' : diff === 1 ? 'Domani' : 'Tra '+diff+' gg'}</span>`
            : `<span style="background:rgba(31,157,85,.12);color:${GREEN};border:1px solid rgba(31,157,85,.28);border-radius:99px;font-size:12px;padding:3px 10px;">Tra ${diff} giorni</span>`;
        return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid rgba(125,112,88,.12);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:15px;color:${FG};font-weight:600;">${escHtml(d.title)}</td>
                <td align="right" style="white-space:nowrap;padding-left:12px;">${badge}</td>
              </tr>
              <tr><td colspan="2" style="font-size:12px;color:${LOW};padding-top:3px;">${fmtDate(d.date)}${d.note ? ' · ' + escHtml(d.note) : ''}</td></tr>
            </table>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td style="padding:18px 0;color:${MID};font-size:14px;text-align:center;">Nessuna scadenza nei prossimi 60 giorni.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="it">
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
        <p style="margin:0;font-size:11px;color:${LOW};line-height:1.7;">
          Hai ricevuto questa email perché l'hai richiesta dalla tua dashboard su <a href="https://easyitaliahub.it" style="color:${GOLD};text-decoration:none;">easyitaliahub.it</a>.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
