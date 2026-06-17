'use strict';

// Endpoint diagnostico — solo GET, nessun dato sensibile esposto.
// GET /api/email-status → { resend: bool, to: string (masked), from: string }
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const key = process.env.RESEND_API_KEY || '';
  const to  = process.env.CONTACT_TO_EMAIL || '';

  res.status(200).json({
    resend_configured: key.length > 0,
    resend_key_prefix: key ? key.slice(0, 6) + '…' : null,
    to_email: to ? to.replace(/(.{2}).+(@.+)/, '$1***$2') : '(non impostato — fallback: info@easyitaliahub.it)',
    from_email: 'notifiche@easyitaliahub.it',
  });
};
