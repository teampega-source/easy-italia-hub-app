'use strict';

const { isRateLimited, clientIp } = require('./_ratelimit');

const FEEDS = [
  { url: 'https://www.interno.gov.it/it/stampa-e-comunicazione/comunicati/rss.xml', src: 'Interno.gov.it', cat: 'leggi' },
  { url: 'https://www.lavoro.gov.it/rss/Pages/default.aspx', src: 'Lavoro.gov.it', cat: 'lavoro' },
  { url: 'https://www.inps.it/it/it/dettaglio-scheda.schede-di-servizio.2020.rss.html', src: 'INPS', cat: 'lavoro' },
  { url: 'https://www.governo.it/it/articoli/rss', src: 'Governo.it', cat: 'leggi' },
];

const VERIFY = 'Verificare sempre le informazioni sul sito ufficiale prima di agire.';

function clean(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, function(_, n) { return String.fromCharCode(+n); })
    .replace(/\s+/g, ' ').trim();
}

function tagOf(b, name) {
  var m = b.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return m ? m[1] : '';
}

function parseFeed(xml, meta) {
  var blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  var out = [];
  for (var i = 0; i < blocks.length && out.length < 6; i++) {
    var b = blocks[i];
    var title = clean(tagOf(b, 'title'));
    var link = clean(tagOf(b, 'link'));
    if (!/^https?:\/\//i.test(link)) {
      var href = b.match(/<link[^>]*href="([^"]+)"/i);
      if (href) link = href[1];
      else { var g = clean(tagOf(b, 'guid')); if (/^https?:\/\//i.test(g)) link = g; }
    }
    var desc = clean(tagOf(b, 'description') || tagOf(b, 'summary'));
    var dateRaw = tagOf(b, 'pubDate') || tagOf(b, 'dc:date') || tagOf(b, 'updated') || tagOf(b, 'published');
    var ts = dateRaw ? Date.parse(clean(dateRaw)) : NaN;
    if (!title || !/^https?:\/\//i.test(link)) continue;
    var id = 'live-' + Buffer.from(link).toString('base64').slice(0, 24).replace(/[+/=]/g, '');
    out.push({
      id: id,
      cat: meta.cat,
      date: ts && !isNaN(ts) ? new Date(ts).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      title: title.slice(0, 160),
      summary: (desc || title).slice(0, 200),
      body: (desc || title).slice(0, 600),
      verify: VERIFY,
      src: { url: link, label: meta.src },
    });
  }
  return out;
}

async function fetchFeed(meta) {
  var ctrl = new AbortController();
  var t = setTimeout(function() { ctrl.abort(); }, 7000);
  try {
    var r = await fetch(meta.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'EasyItaliaHub/1.0', 'Accept': 'application/rss+xml,application/xml,text/xml,*/*' },
    });
    if (!r.ok) return [];
    var xml = (await r.text()).slice(0, 1_500_000);
    return parseFeed(xml, meta);
  } catch (e) {
    return [];
  } finally {
    clearTimeout(t);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (isRateLimited(clientIp(req), { name: 'news', max: 30 })) return res.status(429).end();

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  var settled = await Promise.allSettled(FEEDS.map(fetchFeed));
  var items = [];
  for (var s of settled) if (s.status === 'fulfilled') items = items.concat(s.value);

  var seen = Object.create(null);
  items = items.filter(function(x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; });
  items.sort(function(a, b) { return b.date < a.date ? -1 : b.date > a.date ? 1 : 0; });

  return res.status(200).json({ items: items.slice(0, 20), updated: new Date().toISOString() });
};
