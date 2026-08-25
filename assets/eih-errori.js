/* eih-errori.js — gli errori di chi usa il sito arrivano fino a noi.

   Il problema. Gli errori JavaScript in produzione oggi non li vede nessuno:
   succedono nel browser di una persona a Napoli, e lì restano. Li trovo solo
   aprendo le pagine a mano con un browser pilotato — è così che sono venuti
   fuori il login del percorso, il sinhala del volantino, la doppia richiesta
   del dizionario. Tutti difetti che qualcuno stava già subendo.

   Come. Si ascoltano `error` e `unhandledrejection`, si manda una riga a
   `/api/errore` e basta. Nessuno script di terze parti, nessun cookie, nessuna
   richiesta verso l'esterno: l'indirizzo è il nostro. Chi vuole può poi
   inoltrare da lì a Sentry o a un webhook, ma è una scelta del server, non
   qualcosa che si porta dietro il browser di chi legge.

   Cosa si manda: messaggio, file, riga, percorso della pagina e lingua.
   Niente indirizzo completo — la parte dopo il `?` può contenere quello che
   una persona ha scritto in un modulo — niente contenuto dei campi, niente
   identificativi. Il sito raccoglie codici fiscali e numeri di passaporto: un
   raccoglitore di errori sbadato sarebbe la peggiore delle fughe.

   Tre freni, perché un errore in un ciclo non diventi mille richieste:
     • al massimo cinque per caricamento di pagina;
     • lo stesso errore una volta sola;
     • si rinuncia in silenzio se la richiesta non parte.                    */
(function () {
  'use strict';
  if (window.__eihErrori) return;
  window.__eihErrori = true;

  var TETTO = 5, mandati = 0, visti = {};

  function taglia(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

  function manda(dato) {
    if (mandati >= TETTO) return;
    var chiave = dato.messaggio + '|' + dato.file + '|' + dato.riga;
    if (visti[chiave]) return;
    visti[chiave] = 1;
    mandati++;
    try {
      var corpo = JSON.stringify(dato);
      // sendBeacon sopravvive alla pagina che si chiude: un errore che avviene
      // mentre si naviga via e' proprio quello che altrimenti si perde.
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/errore', new Blob([corpo], { type: 'application/json' }));
      } else {
        fetch('/api/errore', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                               body: corpo, keepalive: true }).catch(function () {});
      }
    } catch (e) { /* un raccoglitore di errori non puo' essere lui a rompersi */ }
  }

  function lingua() {
    try { return document.documentElement.lang || localStorage.getItem('eih-lang') || ''; }
    catch (e) { return ''; }
  }

  addEventListener('error', function (e) {
    // Anche le risorse che non caricano passano di qui, ma senza `message`:
    // un'immagine mancante non e' un errore di programma.
    if (!e || !e.message) return;
    manda({
      tipo: 'errore',
      messaggio: taglia(e.message, 300),
      file: taglia(e.filename || '', 200),
      riga: e.lineno || 0,
      colonna: e.colno || 0,
      pila: taglia(e.error && e.error.stack || '', 1200),
      pagina: location.pathname,          // senza query: puo' contenere testo scritto da una persona
      lingua: lingua(),
      schermo: (innerWidth || 0) + 'x' + (innerHeight || 0)
    });
  });

  addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    manda({
      tipo: 'promessa',
      messaggio: taglia(r && (r.message || r) || 'rifiuto senza motivo', 300),
      file: '', riga: 0, colonna: 0,
      pila: taglia(r && r.stack || '', 1200),
      pagina: location.pathname,
      lingua: lingua(),
      schermo: (innerWidth || 0) + 'x' + (innerHeight || 0)
    });
  });
})();
