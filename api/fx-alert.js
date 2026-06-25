'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  if (isRateLimited(clientIp(req), { name: 'fx-alert', max: 10 })) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  var body = req.body || {};
  var email = String(body.email || '').trim().toLowerCase();
  var rate  = parseInt(body.target_rate, 10);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email non valida' });
  }
  if (!rate || rate < 200 || rate > 600) {
    return res.status(400).json({ error: 'Tasso fuori range (200-600)' });
  }

  var url  = process.env.SUPABASE_URL;
  var key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    var r = await fetch(url + '/rest/v1/fx_alert_subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ email, target_rate: rate, created_at: new Date().toISOString() }),
    });
    if (!r.ok && r.status !== 409) {
      return res.status(502).json({ error: 'Database error' });
    }
  }

  return res.status(200).json({ ok: true });
};
