/* eih-iscritti.js — contatore degli iscritti, dal vivo.

   Legge il numero da Supabase tramite una funzione che restituisce solo un
   intero: le righe di `profiles` restano protette dalle policy RLS e non
   escono mai.

   Il numero compare solo sopra una soglia. Sotto, la voce resta nascosta:
   scrivere "5 iscritti" sulla home danneggia la credibilità più di quanto
   la rafforzi, e appena la community cresce compare da sola. */
(function () {
  'use strict';
  if (window.__eihIscritti) return;
  window.__eihIscritti = true;

  var SOGLIA = 50;                 // sotto questo numero non si mostra nulla
  var CHIAVE = 'eih-iscritti';     // cache di sessione: una richiesta a visita

  var ETICHETTA = {
    it: 'Iscritti alla community',
    en: 'Community members',
    si: 'ප්‍රජා සාමාජිකයන්',
    ta: 'சமூக உறுப்பினர்கள்',
  };

  function lingua() {
    var l = 'it';
    try { l = localStorage.getItem('eih-lang') || 'it'; } catch (e) {}
    return ETICHETTA[l] ? l : 'it';
  }

  function mostra(n) {
    if (!(n >= SOGLIA)) return;
    var lista = document.querySelector('.hero-stats');
    if (!lista || document.getElementById('eih-stat-iscritti')) return;
    var voce = document.createElement('div');
    voce.id = 'eih-stat-iscritti';
    voce.innerHTML = '<dt class="stat-l">' + ETICHETTA[lingua()] + '</dt>' +
                     '<dd class="stat-n">' + n.toLocaleString('it-IT') + '</dd>';
    lista.appendChild(voce);
  }

  function leggiCache() {
    try {
      var g = JSON.parse(sessionStorage.getItem(CHIAVE) || 'null');
      if (g && typeof g.n === 'number') return g.n;
    } catch (e) {}
    return null;
  }

  function scriviCache(n) {
    try { sessionStorage.setItem(CHIAVE, JSON.stringify({ n: n })); } catch (e) {}
  }

  function chiedi() {
    fetch('/api/config')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (!cfg || !cfg.configured || !cfg.url || !cfg.anonKey) return;
        return fetch(cfg.url + '/rest/v1/rpc/conteggio_iscritti', {
          method: 'POST',
          headers: {
            'apikey': cfg.anonKey,
            'Authorization': 'Bearer ' + cfg.anonKey,
            'Content-Type': 'application/json',
          },
          body: '{}',
        }).then(function (r) { return r.ok ? r.json() : null; });
      })
      .then(function (n) {
        if (typeof n !== 'number') return;
        scriviCache(n);
        mostra(n);
      })
      .catch(function () { /* il contatore non è essenziale: in silenzio */ });
  }

  function avvia() {
    var c = leggiCache();
    if (c !== null) { mostra(c); return; }
    chiedi();
  }

  if (document.readyState === 'complete') avvia();
  else addEventListener('load', avvia);
})();
