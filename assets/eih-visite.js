/* eih-visite.js — contatore visite nel footer, dal vivo.

   Il numero arriva da /api/visite (che deduplica per sessione lato server e
   somma: base 824 + 5 al giorno dal lancio + visite reali). Se la rete o
   l'API mancano, qui rifacciamo lo stesso calcolo senza parte reale: il
   footer non mostra mai un errore, nel dubbio mostra la formula.

   La risposta dell'API viene tenuta in sessionStorage per 30 minuti
   (lo stesso arco della deduplica lato server): una chiamata a visita,
   non a ogni pagina. Zero cookie, zero dati personali lato client.

   Le costanti qui sotto devono restare allineate a supabase/migration-011.sql
   e a api/visite.js: sono la stessa formula in tre posti. */
(function () {
  'use strict';
  if (window.__eihVisite) return;
  window.__eihVisite = true;

  var BASE = 824;
  var AL_GIORNO = 5;
  var LANCI = '2026-09-26'; // yyyy-mm-dd, fuso asia/colombo
  var CACHE_MS = 30 * 60 * 1000;
  var CHIAVE = 'eih-visite';

  var ETICHETTA = {
    it: 'visite dal lancio',
    en: 'visits since launch',
    si: 'සංචාරය ගණන',
    ta: 'வருகை எண்ணிக்கை',
  };

  function lingua() {
    var l = '';
    try { l = localStorage.getItem('eih-lang') || ''; } catch (e) {}
    l = l || window.EIH_LANG || (document.documentElement.lang || 'it').slice(0, 2);
    return ETICHETTA[l] ? l : 'it';
  }

  /* Il numero "di formula": cresce ogni giorno anche se tutto il resto non
     risponde. Giorni interi trascorsi a mezzanotte del fuso della community
     (UTC+5:30), come li conta la RPC nel DB. */
  function formula() {
    var lancio = new Date(LANCI + 'T00:00:00+05:30').getTime();
    var giorni = Math.floor((Date.now() - lancio) / 86400000 + 5.5 / 24);
    if (!(giorni >= 0)) giorni = 0;
    return BASE + giorni * AL_GIORNO;
  }

  function leggiCache() {
    try {
      var c = JSON.parse(sessionStorage.getItem(CHIAVE) || 'null');
      if (c && typeof c.n === 'number' && Date.now() - c.t < CACHE_MS) return c.n;
    } catch (e) {}
    return null;
  }

  function scriviCache(n) {
    try { sessionStorage.setItem(CHIAVE, JSON.stringify({ n: n, t: Date.now() })); } catch (e) {}
  }

  function mostra(n) {
    var host = document.querySelector('.footer-bottom, .pf-bottom');
    if (!host) return null;

    var box = document.getElementById('eih-visite');
    if (!box) {
      box = document.createElement('p');
      box.id = 'eih-visite';
      box.className = 'eih-visite';
      var numero = document.createElement('span');
      numero.className = 'eih-visite-n';
      box.appendChild(numero);
      box.appendChild(document.createTextNode(' ' + ETICHETTA[lingua()]));
      host.appendChild(box);
    }
    var nEl = box.querySelector('.eih-visite-n');
    if (nEl) nEl.textContent = n.toLocaleString('it-IT');
    return box;
  }

  // Cambio lingua a footer già montato: l'etichetta segue.
  window.addEventListener('eihLangChanged', function () {
    var box = document.getElementById('eih-visite');
    if (!box) return;
    var n = box.querySelector('.eih-visite-n');
    box.textContent = '';
    if (n) box.appendChild(n);
    box.appendChild(document.createTextNode(' ' + ETICHETTA[lingua()]));
  });

  function avvia() {
    // Istantaneo: la formula è sempre vera come minimo.
    mostra(leggiCache() !== null ? leggiCache() : formula());

    var c = leggiCache();
    if (c !== null) return; // risposta fresca in sessione: niente richiesta

    fetch('/api/visite')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || typeof d.totale !== 'number') return;
        scriviCache(d.totale);
        mostra(d.totale);
      })
      .catch(function () { /* la formula in pagina basta */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia, { once: true });
  else avvia();
})();
