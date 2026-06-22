// ─────────────────────────────────────────────────────────────
// Easy Italia Hub — Live news aggregator (RSS → JSON)
// Vercel serverless function. Zero npm dependencies (global fetch).
// Fetches Sri Lankan news RSS feeds SERVER-SIDE (no CORS / no client CSP
// impact: the browser only talks to same-origin /api/news), merges,
// cleans and returns the latest headlines. Each item links to its source.
// ─────────────────────────────────────────────────────────────

const FEEDS = [
  { url: "https://www.adaderana.lk/rss.php", source: "Ada Derana" },
  { url: "https://www.dailymirror.lk/rss", source: "Daily Mirror" },
  { url: "https://www.ft.lk/rss", source: "Daily FT" },
  { url: "https://www.newsfirst.lk/feed", source: "NewsFirst" },
];

const TIMEOUT_MS = 6000;
const MAX_ITEMS = 20;
const PER_FEED = 8;

function clean(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#8230;|&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); })
    .replace(/\s+/g, " ")
    .trim();
}

function tagOf(block, name) {
  const m = block.match(new RegExp("<" + name + "[^>]*>([\\s\\S]*?)<\\/" + name + ">", "i"));
  return m ? m[1] : "";
}

function parseFeed(xml, source) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  const out = [];
  for (const b of blocks) {
    const title = clean(tagOf(b, "title"));
    let link = clean(tagOf(b, "link"));
    if (!/^https?:\/\//i.test(link)) {
      const href = b.match(/<link[^>]*href="([^"]+)"/i);
      if (href) link = href[1];
      else {
        const guid = clean(tagOf(b, "guid"));
        if (/^https?:\/\//i.test(guid)) link = guid;
      }
    }
    const dateStr = tagOf(b, "pubDate") || tagOf(b, "dc:date") || tagOf(b, "updated") || tagOf(b, "published");
    const ts = dateStr ? Date.parse(clean(dateStr)) : NaN;
    if (title && /^https?:\/\//i.test(link)) {
      out.push({ title: title.slice(0, 180), link: link.trim(), source, ts: isNaN(ts) ? 0 : ts });
    }
    if (out.length >= PER_FEED) break;
  }
  return out;
}

async function fetchFeed(feed) {
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
  try {
    const r = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "EasyItaliaHub/1.0 (+https://easyitaliahub.it)", "Accept": "application/rss+xml, application/xml, text/xml, */*" },
    });
    if (!r.ok) return [];
    const raw = await r.text();
    const xml = raw.slice(0, 2_000_000);
    return parseFeed(xml, feed.source);
  } catch (e) {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  try {
    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
    let items = [];
    for (const s of settled) if (s.status === "fulfilled") items = items.concat(s.value);

    // de-duplicate by link
    const seen = Object.create(null);
    items = items.filter(function (x) { if (seen[x.link]) return false; seen[x.link] = 1; return true; });

    items.sort(function (a, b) { return b.ts - a.ts; });
    items = items.slice(0, MAX_ITEMS).map(function (x) {
      return { title: x.title, link: x.link, source: x.source, date: x.ts ? new Date(x.ts).toISOString() : null };
    });

    if (!items.length) {
      return res.status(200).json({ items: [], stale: true, note: "feeds_unavailable" });
    }
    return res.status(200).json({ items: items, updated: new Date().toISOString() });
  } catch (err) {
    return res.status(200).json({ items: [], stale: true, error: String((err && err.message) || err) });
  }
};
