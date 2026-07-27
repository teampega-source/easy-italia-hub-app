/* Easy Italia Hub — lingua dall'indirizzo.
   Le stesse pagine sono raggiungibili anche sotto /en, /si e /ta (le riscritture
   stanno in vercel.json). Qui si legge il prefisso, si imposta la lingua prima
   che parta eih.js e si corregge il canonical: senza questo Google vedrebbe
   quattro indirizzi con lo stesso canonical italiano e ne indicizzerebbe uno. */
(function () {
  'use strict';
  var BASE = 'https://easyitaliahub.it';
  var LANGS = ['en', 'si', 'ta'];
  var m = location.pathname.match(/^\/(en|si|ta)(\/|$)/);
  var lang = m ? m[1] : 'it';
  var path = location.pathname.replace(/^\/(en|si|ta)(?=\/|$)/, '') || '/';

  if (m) {
    try { localStorage.setItem('eih-lang', lang); } catch (e) {}
    document.documentElement.lang = lang;
  }

  function url(l) {
    return BASE + (l === 'it' ? path : '/' + l + (path === '/' ? '' : path));
  }

  var can = document.querySelector('link[rel="canonical"]');
  if (can) can.setAttribute('href', url(lang));

  // hreflang: se la pagina non li ha già, li aggiunge (una riga per lingua)
  if (!document.querySelector('link[rel="alternate"][hreflang]')) {
    var head = document.head, frag = document.createDocumentFragment();
    ['it'].concat(LANGS).concat(['x-default']).forEach(function (l) {
      var link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = l;
      link.href = url(l === 'x-default' ? 'it' : l);
      frag.appendChild(link);
    });
    head.appendChild(frag);
  }
})();
