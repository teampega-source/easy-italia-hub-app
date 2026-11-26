// ─────────────────────────────────────────────────────────────
// Easy Italia Hub — Italian page responder.
//
// The same HTML file is served on the root (English by default) and under
// /it (Italian). A static <link rel="canonical"> cannot know which prefix
// the browser used, so /it kept declaring the English root as canonical.
//
// vercel.json sends /it and every /it/<page> here. This function reads the
// original file and rewrites only the canonical and <html lang>, so a
// crawler that does not run JavaScript still sees /it as its own canonical.
// Assets and unmapped paths keep falling through the generic /it/:path*
// rewrite, which is why relative asset URLs continue to work.
// ─────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const BASE = 'https://easyitaliahub.it';
const PAGINA = /^[a-z0-9-]{1,80}$/;

// The rewrite passes the page in ?p=; the fallbacks make the function work
// also when called directly or when Vercel keeps the original path in req.url.
function pagina(req) {
  let p = '';
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    p = u.searchParams.get('p') || '';
    if (!p) {
      const m = u.pathname.match(/^\/(?:api\/pagina-it|it)(?:\/(.*))?$/);
      p = m && m[1] ? m[1] : '';
    }
  } catch (e) {}
  p = p.replace(/^\/+|\/+$/g, '').replace(/\.html$/i, '');
  if (p === '' || p === 'index') return 'index';
  return PAGINA.test(p) ? p : null;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method not allowed');
    return;
  }

  const p = pagina(req);
  if (!p) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.end('Not found');
    return;
  }

  let html;
  try {
    html = fs.readFileSync(path.join(process.cwd(), p + '.html'), 'utf8');
  } catch (e) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.end('Not found');
    return;
  }

  const canon = p === 'index' ? BASE + '/it' : BASE + '/it/' + p;
  const tag = '<link rel="canonical" href="' + canon + '"/>';
  if (/<link\b[^>]*\brel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i, tag);
  } else {
    html = html.replace(/<head([^>]*)>/i, '<head$1>\n' + tag);
  }
  // The body of these files is the Italian original: without this, a crawler
  // that does not execute JavaScript would read Italian as English.
  html = html.replace(/<html\b([^>]*)\blang=["'][^"']*["']/i, '<html$1lang="it"');

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(html);
};
