// api/flight-digest.js — Cron settimanale: invia avvisi volo agli iscritti via Resend
// Trigger: ogni lunedì 07:00 UTC (configurato in vercel.json)
// Vercel inietta Authorization: Bearer <CRON_SECRET> per autenticare la chiamata.
'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = 'Easy Italia Hub <notifiche@easyitaliahub.it>';

const ORIGIN_LABELS = {
  MXP: 'Milano Malpensa', FCO: 'Roma Fiumicino', TRN: 'Torino',
  VCE: 'Venezia', NAP: 'Napoli', BGY: 'Bergamo', LIN: 'Milano Linate', PMO: 'Palermo',
};

const SEASON_TIPS = [
  'Gennaio è alta stagione. Prenota con largo anticipo o aspetta febbraio per tariffe migliori.',
  'Febbraio è bassa stagione: buon momento per trovare prezzi contenuti.',
  'Marzo è tra i mesi più economici dell\'anno per volare in Sri Lanka.',
  'Aprile è ancora bassa stagione: ottimo per prenotare anche last-minute.',
  'Maggio: prezzi in aumento per il periodo Vesak. Conviene anticipare la partenza.',
  'Giugno è bassa stagione monsonica: prezzi bassi, ma controlla le condizioni meteo.',
  'Luglio è alta stagione estiva dall\'Italia: valuta partenze nei giorni feriali per risparmiare.',
  'Agosto è il mese più caro. Se puoi, sposta la partenza a settembre.',
  'Settembre è tra i mesi più economici: bassa stagione e clima in miglioramento in Sri Lanka.',
  'Ottobre è ottimo: prezzi bassi e clima piacevole sulla costa ovest dello Sri Lanka.',
  'Novembre: prezzi ancora ragionevoli prima del picco natalizio. Prenota entro fine mese.',
  'Dicembre è alta stagione (Natale/Capodanno). Prenota almeno 3 mesi prima.',
];

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers['authorization'] !== `Bearer ${secret}`) {
    return res.status(401).end();
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
    return res.status(200).json({ skipped: 'not configured' });
  }

  const subResp = await fetch(
    `${SUPABASE_URL}/rest/v1/flight_subscribers?active=eq.true&select=id,email,origin,max_price`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!subResp.ok) {
    console.error('[flight-digest] fetch subscribers:', await subResp.text());
    return res.status(500).json({ error: 'fetch failed' });
  }

  const subscribers = await subResp.json();
  if (!subscribers.length) return res.status(200).json({ sent: 0, total: 0 });

  const tip = SEASON_TIPS[new Date().getMonth()];
  let sent = 0;

  for (const sub of subscribers) {
    try {
      const html = buildEmail(sub, tip);
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [sub.email],
          subject: `✈️ Avvisi volo ${ORIGIN_LABELS[sub.origin] || sub.origin} → Sri Lanka`,
          html,
        }),
      });
      if (r.ok) sent++;
      else console.error('[flight-digest] resend error:', sub.email, await r.text());
    } catch (err) {
      console.error('[flight-digest] exception:', sub.email, err.message);
    }
  }

  return res.status(200).json({ sent, total: subscribers.length });
};

function buildEmail(sub, tip) {
  const originLabel = ORIGIN_LABELS[sub.origin] || sub.origin;
  const kiwi = `https://easyitaliahub.it/api/go?to=kiwi&from=${sub.origin}`;
  const googleFlights = `https://www.google.com/flights?hl=it#flt=${sub.origin}.CMB.`;
  const unsubUrl = `https://easyitaliahub.it/api/flights?id=${sub.id}`;
  const budgetRow = sub.max_price
    ? `<p style="margin:0 0 20px;font-size:13px;color:#7d7058">Il tuo budget massimo impostato: <strong>€${sub.max_price}</strong>. Se trovi un'offerta sotto questa soglia, è il momento di prenotare.</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden">

  <!-- Header -->
  <tr><td style="background:#7d7058;padding:24px 32px">
    <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,.7);letter-spacing:.1em;text-transform:uppercase">Easy Italia Hub · Avvisi Volo</p>
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff">✈️ La tua rotta questa settimana</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:28px 32px">
    <h2 style="margin:0 0 6px;font-size:20px;color:#1a1814">${originLabel} → Colombo</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#7d7058">${sub.origin} → CMB (Bandaranaike International)</p>
    ${budgetRow}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr>
        <td style="padding-right:8px">
          <a href="${kiwi}" style="display:inline-block;background:#7d7058;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px">Cerca su Kiwi →</a>
        </td>
        <td>
          <a href="${googleFlights}" style="display:inline-block;background:#f5f4f0;color:#3a3630;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;border:1px solid #e0dbd2">Google Flights →</a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e8e4de;margin:0 0 24px"/>

    <h3 style="margin:0 0 10px;font-size:15px;color:#1a1814">💡 Consiglio del mese</h3>
    <p style="margin:0 0 24px;font-size:14px;color:#3a3630;line-height:1.65">${tip}</p>

    <h3 style="margin:0 0 12px;font-size:15px;color:#1a1814">Compagnie principali su questa rotta</h3>
    <table cellpadding="0" cellspacing="0" style="width:100%">
      <tr><td style="padding:9px 12px;background:#f5f4f0;border-radius:8px;font-size:13px;color:#3a3630"><strong>Emirates</strong> — via Dubai (DXB) · spesso la più economica</td></tr>
      <tr><td style="height:6px"></td></tr>
      <tr><td style="padding:9px 12px;background:#f5f4f0;border-radius:8px;font-size:13px;color:#3a3630"><strong>Qatar Airways</strong> — via Doha (DOH) · ottimo servizio a bordo</td></tr>
      <tr><td style="height:6px"></td></tr>
      <tr><td style="padding:9px 12px;background:#f5f4f0;border-radius:8px;font-size:13px;color:#3a3630"><strong>Turkish Airlines</strong> — via Istanbul (IST) · comodo dal Nord Italia</td></tr>
      <tr><td style="height:6px"></td></tr>
      <tr><td style="padding:9px 12px;background:#f5f4f0;border-radius:8px;font-size:13px;color:#3a3630"><strong>Etihad Airways</strong> — via Abu Dhabi (AUH)</td></tr>
    </table>

    <p style="margin:24px 0 0">
      <a href="https://easyitaliahub.it/voli" style="color:#7d7058;text-decoration:none;font-size:14px;font-weight:500">Tutti i consigli su Easy Italia Hub →</a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f5f4f0;padding:16px 32px;border-top:1px solid #e8e4de">
    <p style="margin:0;font-size:11px;color:#a09880;text-align:center;line-height:1.6">
      Ricevi questa email perché sei iscritto agli avvisi volo di
      <a href="https://easyitaliahub.it" style="color:#7d7058;text-decoration:none">Easy Italia Hub</a>.<br/>
      <a href="${unsubUrl}" style="color:#7d7058;text-decoration:underline">Cancella iscrizione</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}
