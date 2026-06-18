'use strict';

// GET /api/email-status?token=<ADMIN_TOKEN> — diagnostica invio email
// Protetto da token (env ADMIN_TOKEN o fallback fisso solo per ambienti senza config)
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const adminToken = process.env.ADMIN_TOKEN;
  const provided = req.query && req.query.token;
  if (adminToken && provided !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const key = process.env.RESEND_API_KEY || '';
  const to  = process.env.CONTACT_TO_EMAIL || '';

  const base = {
    resend_configured: key.length > 0,
    resend_key_prefix: key ? key.slice(0, 6) + '…' : null,
    to_email: to ? to.replace(/(.{2}).+(@.+)/, '$1***$2') : '(non impostato)',
    from_email: 'notifiche@easyitaliahub.it',
  };

  if (!key) return res.status(200).json(base);

  try {
    const r = await fetch('https://api.resend.com/emails?limit=5', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await r.json();
    const emails = (data.data || []).map(e => ({
      id: e.id,
      to: e.to,
      subject: e.subject,
      created_at: e.created_at,
      last_event: e.last_event,
    }));
    return res.status(200).json({ ...base, recent_emails: emails, resend_http: r.status });
  } catch (err) {
    return res.status(200).json({ ...base, resend_fetch_error: err.message });
  }
};
