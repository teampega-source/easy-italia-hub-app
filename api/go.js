// api/go.js — Redirect engine per affiliate link travel (voli, hotel, transfer, ecc.)
// Env vars opzionali: AFF_KIWI, AFF_BOOKING, AFF_12GO, AFF_SAFETYWING, AFF_AIRALO, AFF_GYG,
//                     AFF_WISE, AFF_REMITLY (money transfer, network Partnerize)
'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const IDS = {
  kiwi:       process.env.AFF_KIWI       || '',
  booking:    process.env.AFF_BOOKING     || '',
  twelvego:   process.env.AFF_12GO        || '',
  safetywing: process.env.AFF_SAFETYWING  || '',
  airalo:     process.env.AFF_AIRALO      || '',
  gyg:        process.env.AFF_GYG         || '',
  wise:       process.env.AFF_WISE        || '',
  remitly:    process.env.AFF_REMITLY     || '',
};

// Partnerize deep link (prf.hn). camref = ref campagna dalla dashboard.
// Vuoto → link semplice (non tracciato). Se incolli un link completo, usato così com'è.
function partnerize(camref, dest, pubref) {
  if (!camref) return dest;
  if (/^https?:\/\//.test(camref)) return camref;
  const pr = pubref
    ? '/pubref:' + encodeURIComponent(String(pubref).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40))
    : '';
  return 'https://prf.hn/click/camref:' + encodeURIComponent(camref)
    + pr + '/destination:' + encodeURIComponent(dest);
}

const AIRPORT_CITY = {
  MXP: 'milan-italy', BGY: 'milan-italy', LIN: 'milan-italy',
  FCO: 'rome-italy',  CIA: 'rome-italy',
  TRN: 'turin-italy',
  VCE: 'venice-italy',
  NAP: 'naples-italy',
  PMO: 'palermo-italy',
};

function buildUrl(to, q) {
  const from  = String(q.from || 'MXP').toUpperCase().replace(/[^A-Z]/g,'');
  const city  = AIRPORT_CITY[from] || 'italy';

  switch (to) {
    case 'kiwi': {
      const dep = q.date ? String(q.date).replace(/[^0-9-]/g,'').slice(0,10) : null;
      const ret = q.ret  ? String(q.ret).replace(/[^0-9-]/g,'').slice(0,10) : null;
      const dateSeg = dep ? '/' + dep + '/' + (ret || 'no-return') : '';
      const aff = IDS.kiwi ? '?affilid=' + encodeURIComponent(IDS.kiwi) : '';
      return 'https://www.kiwi.com/it/search/results/' + city + '/colombo-sri-lanka' + dateSeg + '/' + aff;
    }

    case 'kayak': {
      const dep = q.date ? String(q.date).replace(/[^0-9-]/g,'').slice(0,10) : null;
      const ret = q.ret  ? String(q.ret).replace(/[^0-9-]/g,'').slice(0,10) : null;
      let url = `https://www.kayak.it/flights/${from}-CMB`;
      if (dep) { url += '/' + dep; if (ret) url += '/' + ret; }
      return url;
    }

    case 'gflights': {
      const dep = q.date ? String(q.date).replace(/[^0-9-]/g,'').slice(0,10) : null;
      const ret = q.ret  ? String(q.ret).replace(/[^0-9-]/g,'').slice(0,10) : null;
      // Google Flights deep-link format
      let flight = from + '.CMB';
      if (dep) flight += '.' + dep;
      if (ret) flight += '*CMB.' + from + '.' + ret;
      return `https://www.google.com/travel/flights?hl=it&gl=it#flt=${flight};c:EUR;e:1;sd:1;t:f`;
    }

    case 'booking':
      return 'https://www.booking.com/searchresults.it.html?country=lk'
        + (IDS.booking ? '&aid=' + encodeURIComponent(IDS.booking) + '&label=easyitaliahub' : '');

    case '12go':
      return 'https://12go.asia/en/travel/from-italy/to-sri-lanka'
        + (IDS.twelvego ? '?r=' + encodeURIComponent(IDS.twelvego) : '');

    case 'safetywing':
      return 'https://safetywing.com/nomad-insurance'
        + (IDS.safetywing
          ? '?referenceID=' + encodeURIComponent(IDS.safetywing)
            + '&utm_source=' + encodeURIComponent(IDS.safetywing) + '&utm_medium=affiliate'
          : '');

    case 'wise':
      return partnerize(IDS.wise, 'https://wise.com', q.ref);

    case 'remitly':
      return partnerize(IDS.remitly, 'https://www.remitly.com', q.ref);

    case 'airalo':
      return 'https://www.airalo.com/sri-lanka-esim'
        + (IDS.airalo ? '?aff=' + encodeURIComponent(IDS.airalo) : '');

    case 'gyg':
      return 'https://www.getyourguide.it/sri-lanka-l215/'
        + (IDS.gyg
          ? '?partner_id=' + encodeURIComponent(IDS.gyg)
            + '&utm_medium=travel_agent&utm_source=easyitaliahub'
          : '');

    default:
      return null;
  }
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (isRateLimited(clientIp(req), { name: 'go', max: 60 })) {
    return res.status(429).end();
  }

  const q  = req.query || {};
  const to = String(q.to || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!to) return res.status(400).json({ error: 'Missing ?to= param' });

  const url = buildUrl(to, q);
  if (!url) return res.status(404).json({ error: 'Unknown destination: ' + to });

  console.log('[go] to=' + to + ' from=' + (q.from || '-') + ' ip=' + clientIp(req));
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 301;
  res.setHeader('Location', url);
  return res.end();
};
