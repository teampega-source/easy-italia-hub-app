// ─────────────────────────────────────────────────────────────
// Easy Italia Hub — promemoria email automatici sulle scadenze.
// Cron Vercel (giornaliero): trova le scadenze a 30, 7 e 1 giorni e
// invia una email al proprietario. Vercel autentica con CRON_SECRET.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CRON_SECRET.
// ─────────────────────────────────────────────────────────────
'use strict';

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND = process.env.RESEND_API_KEY;
const FROM = 'Easy Italia Hub <promemoria@easyitaliahub.it>';
const OFFSETS = [30, 7, 1]; // giorni al termine per cui avvisiamo

function ymd(daysFromNow) {
  const d = new Date(Date.now() + daysFromNow * 86400000);
  return d.toISOString().slice(0, 10);
}

async function sb(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return r.json();
}

async function userEmail(id) {
  const r = await fetch(`${SB_URL}/auth/v1/admin/users/${id}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.email || null;
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  return `${+d} ${mesi[+m - 1]} ${y}`;
}

function buildHtml(rows) {
  const items = rows.map((r) =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee"><strong>${r.title}</strong>${r.note ? `<br/><span style="color:#777;font-size:13px">${r.note}</span>` : ''}</td>` +
    `<td style="padding:8px 12px;border-bottom:1px solid #eee;white-space:nowrap">${fmtDate(r.due_date)}</td>` +
    `<td style="padding:8px 12px;border-bottom:1px solid #eee;white-space:nowrap;color:${r.days <= 1 ? '#c0392b' : r.days <= 7 ? '#b9772a' : '#555'}">${r.days === 1 ? 'domani' : `tra ${r.days} giorni`}</td></tr>`
  ).join('');
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1a17">` +
    `<h2 style="color:#9a7d45">⏰ Promemoria scadenze</h2>` +
    `<p>Queste scadenze salvate nella tua Dashboard si stanno avvicinando:</p>` +
    `<table style="border-collapse:collapse;width:100%">${items}</table>` +
    `<p style="margin-top:18px"><a href="https://easyitaliahub.it/dashboard" style="color:#9a7d45">Apri la tua Dashboard →</a></p>` +
    `<p style="color:#999;font-size:12px;margin-top:24px">Ricevi questa email perché hai salvato scadenze su Easy Italia Hub con promemoria attivi. Verifica sempre date e requisiti sulla fonte ufficiale.</p></div>`;
}

// Eseguito dal cron via api/email.js (GET autenticato). Vedi vercel.json.
module.exports.run = async (req, res) => {
  if (!SB_URL || !SB_KEY || !RESEND) return res.status(200).json({ demo: true });

  try {
    const dates = OFFSETS.map(ymd);
    const rows = await sb(`deadlines?select=user_id,title,note,due_date&due_date=in.(${dates.join(',')})&order=due_date`);
    if (!rows.length) return res.status(200).json({ ok: true, sent: 0 });

    const today = ymd(0);
    const byUser = new Map();
    for (const r of rows) {
      r.days = Math.round((new Date(r.due_date) - new Date(today)) / 86400000);
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
      byUser.get(r.user_id).push(r);
    }

    let sent = 0;
    for (const [uid, list] of byUser) {
      const email = await userEmail(uid);
      if (!email) continue;
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [email],
          subject: list.some((x) => x.days <= 1) ? '⏰ Scadenza domani — controlla la tua Dashboard' : '⏰ Scadenze in arrivo su Easy Italia Hub',
          html: buildHtml(list),
        }),
      });
      if (r.ok) sent++;
    }
    return res.status(200).json({ ok: true, users: byUser.size, sent });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
};
