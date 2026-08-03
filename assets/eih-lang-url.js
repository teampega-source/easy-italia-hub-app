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
  // Fuori dai prefissi la lingua e' quella decisa dallo snippet nel <head>:
  // inglese, salvo scelta dell'utente.
  var lang = m ? m[1] : (window.EIH_LANG || 'en');
  var path = location.pathname.replace(/^\/(en|si|ta)(?=\/|$)/, '') || '/';

  if (m) {
    // Arrivare da /en, /si o /ta e' una scelta esplicita quanto il selettore.
    try { localStorage.setItem('eih-lang', lang); localStorage.setItem('eih-lang-scelta', '1'); } catch (e) {}
  }
  // <html lang> dice in che lingua e' la pagina, e va detto ovunque: le pagine
  // che non caricano eih.js (registrati) restavano dichiarate italiane anche
  // quando il testo era gia' stato tradotto, e chi legge con uno screen reader
  // se le sentiva pronunciare con la pronuncia sbagliata.
  document.documentElement.lang = lang;

  function url(l) {
    return BASE + (l === 'it' ? path : '/' + l + (path === '/' ? '' : path));
  }

  // Il canonical dichiara che indirizzo e' questo, non che lingua preferisce
  // chi sta guardando: dipende dal prefisso del percorso e da nient'altro.
  // Legarlo alla lingua attiva significherebbe, ora che l'inglese e' quella
  // predefinita, far dire a ogni pagina senza prefisso di essere /en.
  var can = document.querySelector('link[rel="canonical"]');
  if (can) can.setAttribute('href', url(m ? m[1] : 'it'));

  /* Avvio anticipato della traduzione di pagina.

     Prima questa catena era tutta in serie: l'HTML caricava eih.js, eih.js
     — a fine esecuzione — iniettava eih-i18n-page.js, e solo allora partiva
     la richiesta del dizionario. Su un telefono medio il testo cambiava piu'
     di un secondo dopo che la pagina era gia' comparsa: l'utente leggeva
     l'italiano e poi lo vedeva trasformarsi.

     Qui siamo nel <head>, prima di tutto il resto: si fa partire subito sia
     la richiesta del dizionario sia quella dello script, in parallelo. */
  if (!m) {
    try { lang = localStorage.getItem('eih-lang') || window.EIH_LANG || 'en'; } catch (e) {}
  }
  // Di norma ci ha gia' pensato lo snippet in cima al <head>, che parte prima
  // dei fogli di stile. Questo resta come rete di sicurezza per una pagina che
  // dovesse perderlo.
  if (LANGS.indexOf(lang) > -1 && !window.__eihTrad) {
    var pagina = path.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '') || 'index';
    var dizionario = '/assets/i18n/' + pagina + '.' + lang + '.json';

    // La richiesta parte adesso; eih-i18n-page.js la raccoglie quando e' pronto.
    // priorita' alta su entrambi: sono piccoli, ma su una pagina che carica
    // una dozzina di script farebbero la coda dietro le librerie di animazione
    var opz = { priority: 'high' };
    window.__eihTrad = {
      pagina: pagina,
      lingua: lang,
      promessa: fetch(dizionario, opz).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      promessaUi: fetch('/assets/i18n/_ui.' + lang + '.json', opz).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    };

    var s = document.createElement('script');
    s.src = '/assets/eih-i18n-page.js';
    s.defer = true;
    s.fetchPriority = 'high';
    document.head.appendChild(s);

    /* Il corpo pagina resta invisibile — non nascosto: lo spazio se lo tiene —
       finche' la traduzione non e' applicata. Senza questo l'utente vedeva
       comparire l'italiano e poi cambiare sotto gli occhi, con tutto il
       contenuto che scendeva. L'attesa e' limitata: dopo mezzo secondo si
       mostra comunque, anche se il dizionario non e' arrivato. Cosi' un
       dizionario mancante o una rete lenta non possono lasciare la pagina
       vuota. */
    var stile = document.createElement('style');
    stile.textContent = 'html.eih-tr-attesa main{visibility:hidden}';
    document.head.appendChild(stile);
    document.documentElement.classList.add('eih-tr-attesa');
    setTimeout(function () {
      document.documentElement.classList.remove('eih-tr-attesa');
    }, 500);
  }

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
