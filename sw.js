/* Easy Italia Hub — service worker.
   Strategia conservativa: network-first per le pagine (HTML sempre fresco quando
   c'è rete), stale-while-revalidate per gli asset statici same-origin.
   Le API (/api/) e le richieste cross-origin non vengono mai intercettate. */
'use strict';

const CACHE = 'eih-v85';
const OFFLINE = '/offline';
const CORE = [
  '/',
  OFFLINE,
  '/eih.css',
  '/eih.js',
  '/eih-chat-widget.js',
  '/eih-auth.js',
  '/assets/eih-theme.css',
  '/assets/eih-atmosphere.css',
  '/assets/eih-theme.js',
  '/assets/eih-palette.js',
  '/assets/eih-motion.js',
  '/assets/eih-consent.js',
  '/assets/eih-install.js',
  '/assets/eih-anim-pause.js',
  '/assets/eih-lang-url.js',
  '/assets/vendor/lenis.min.js',
  '/assets/vendor/gsap.min.js',
  '/assets/vendor/ScrollTrigger.min.js',
  '/assets/favicon-32.png',
  '/assets/icon-192.png',
  '/assets/img/logo-symbol.webp',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll fallisce in blocco se un solo file non risponde: uno per uno.
      .then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Le richieste con Range (es. <video>) le gestisce il browser: evitiamo
  // di servire un 200 completo dalla cache al posto di un 206 parziale.
  if (req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    // Pagine: rete prima, cache come fallback offline.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req)
          .then((hit) => hit || caches.match('/'))
          .then((hit) => hit || caches.match(OFFLINE)))
    );
    return;
  }

  // Asset: cache subito, aggiornamento in background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const refresh = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});

/* ── Web Push: mostra la notifica e apri la pagina giusta al tocco ── */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil(self.registration.showNotification(d.title || 'Easy Italia Hub', {
    body: d.body || '',
    icon: '/assets/icon-192.png',
    badge: '/assets/favicon-32.png',
    tag: d.tag || 'eih',
    data: { url: d.url || '/dashboard' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/dashboard';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if (new URL(w.url).pathname === url && 'focus' in w) return w.focus(); }
    return clients.openWindow(url);
  }));
});
