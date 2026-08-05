/* eih-misura.js — statistiche e pixel, uno solo per tutto il sito.

   Perche' esiste: GA4 stava dentro eih.js, e index.html non carica eih.js.
   La home — la pagina dove atterra chiunque arrivi da un annuncio — era
   l'unica senza misurazione. E partiva comunque, senza aspettare il consenso,
   mentre il banner dei cookie promette il contrario. Due problemi con la
   stessa causa: il codice stava nel posto sbagliato.

   Regole di questo file:
   1. Non parte niente prima del consenso. `analytics` accende GA4,
      `marketing` accende i pixel. Chi rifiuta non vede partire una richiesta.
   2. Chi cambia idea dal piede di pagina viene servito subito, senza
      ricaricare: si ascolta 'cookieConsentUpdated'.
   3. Gli identificativi delle piattaforme sono vuoti finche' non esistono
      davvero gli account. Un identificativo vuoto = quel pixel non si monta.
      Nessun blocco morto da ricordarsi di togliere.

   La conversione del sito e' una sola: l'iscrizione completata. Si segnala
   con EIH_MISURA.iscrizione(), che parla a tutte le piattaforme insieme.   */
(function () {
  'use strict';
  if (window.EIH_MISURA) return;

  var ID = {
    ga4: 'G-13TEJWCKZZ',
    googleAds: '',     // AW-XXXXXXXXX
    googleAdsIscrizione: '',   // AW-XXXXXXXXX/etichetta della conversione
    meta: '',          // pixel id, solo cifre
    tiktok: ''         // pixel code
  };

  var acceso = { ga4: false, meta: false, tiktok: false, googleAds: false };
  var codaEventi = [];

  /* Il consenso si legge da solo, non si aspetta il banner.
     registrati.html — la pagina dove avviene l'unica conversione del sito —
     non carica eih-consent.js: affidarsi a window.EIH_CONSENT voleva dire non
     misurare proprio l'iscrizione. Stessa chiave e stesso formato del banner. */
  function consenso() {
    if (window.EIH_CONSENT) return window.EIH_CONSENT;
    var raw = null;
    try { raw = localStorage.getItem('eih-cookie-consent'); } catch (e) {}
    if (!raw) return { analytics: false, marketing: false };
    if (raw === 'all') return { analytics: true, marketing: true };
    if (raw === 'necessary') return { analytics: false, marketing: false };
    try { var o = JSON.parse(raw); return { analytics: !!o.analytics, marketing: !!o.marketing }; }
    catch (e) { return { analytics: false, marketing: false }; }
  }

  /* ── gtag: lo condividono GA4 e Google Ads ── */
  function gtagPronto() {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
  }
  function caricaGtag(id) {
    if (document.querySelector('script[src*="googletagmanager.com/gtag"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
  }

  function accendiAnalitici() {
    if (acceso.ga4 || !ID.ga4) return;
    acceso.ga4 = true;
    gtagPronto();
    // anonymize_ip resta per chiarezza, anche se GA4 lo fa comunque
    window.gtag('config', ID.ga4, { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
    caricaGtag(ID.ga4);
  }

  function accendiMarketing() {
    if (ID.googleAds && !acceso.googleAds) {
      acceso.googleAds = true;
      gtagPronto();
      window.gtag('config', ID.googleAds);
      caricaGtag(ID.googleAds);
    }
    if (ID.meta && !acceso.meta) {
      acceso.meta = true;
      /* Lo snippet di Meta, ridotto all'osso: monta fbq e carica la libreria. */
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = true; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', ID.meta);
      window.fbq('track', 'PageView');
    }
    if (ID.tiktok && !acceso.tiktok) {
      acceso.tiktok = true;
      (function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
        ttq.setAndDefer = function (o, m) { o[m] = function () { o.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.load = function (e) {
          var u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = u;
          ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
          ttq._o = ttq._o || {}; ttq._o[e] = {};
          var s = d.createElement('script'); s.type = 'text/javascript'; s.async = true;
          s.src = u + '?sdkid=' + e + '&lib=' + t;
          var f = d.getElementsByTagName('script')[0]; f.parentNode.insertBefore(s, f);
        };
        ttq.load(ID.tiktok);
        ttq.page();
      })(window, document, 'ttq');
    }
    // quello che era stato chiesto prima del consenso parte adesso
    var coda = codaEventi; codaEventi = [];
    coda.forEach(function (e) { manda(e.nome, e.dati); });
  }

  function applica() {
    var c = consenso();
    if (c.analytics) accendiAnalitici();
    if (c.marketing) accendiMarketing();
  }

  /* ── Eventi ─────────────────────────────────────────────────────────────
     Un nome solo per tutte le piattaforme: qui dentro si traduce nei nomi
     che ognuna si aspetta. Chi chiama non deve sapere niente di fbq o ttq. */
  var NOMI = {
    iscrizione:  { meta: 'CompleteRegistration', tiktok: 'CompleteRegistration' },
    contatto:    { meta: 'Contact', tiktok: 'Contact' },
    newsletter:  { meta: 'Subscribe', tiktok: 'Subscribe' },
    guida:       { meta: 'ViewContent', tiktok: 'ViewContent' }
  };

  function manda(nome, dati) {
    dati = dati || {};
    var c = consenso();
    if (window.gtag && acceso.ga4) window.gtag('event', nome, dati);
    if (!c.marketing) {
      // il consenso di marketing puo' arrivare dopo: l'evento aspetta
      if (codaEventi.length < 20) codaEventi.push({ nome: nome, dati: dati });
      return;
    }
    var n = NOMI[nome];
    if (window.fbq && n && n.meta) window.fbq('track', n.meta, dati);
    if (window.ttq && n && n.tiktok) window.ttq.track(n.tiktok, dati);
  }

  window.EIH_MISURA = {
    evento: manda,
    /* L'unica conversione che conta: qualcuno si e' iscritto.
       Va chiamata una volta sola, appena l'iscrizione e' andata a buon fine e
       prima del cambio pagina. */
    iscrizione: function (dati) {
      manda('iscrizione', dati || {});
      if (window.gtag && ID.googleAdsIscrizione) {
        window.gtag('event', 'conversion', { send_to: ID.googleAdsIscrizione });
      }
    }
  };

  applica();
  window.addEventListener('cookieConsentUpdated', applica);
})();
