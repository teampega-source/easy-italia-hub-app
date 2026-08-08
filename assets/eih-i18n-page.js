/* Easy Italia Hub — traduzione del corpo delle pagine.
   Il menu, il piede e le stringhe con data-i18n sono gestiti da eih.js.
   Qui si traduce tutto il resto: il testo scritto direttamente nell'HTML.

   Come funziona
   -------------
   Ogni frammento di testo italiano viene ridotto a un'impronta di 8 cifre
   esadecimali. I dizionari stanno in /assets/i18n/<pagina>.<lingua>.json e
   sono semplici mappe impronta → traduzione. Se il testo italiano cambia,
   l'impronta cambia, la voce non viene trovata e resta l'originale: nessuna
   traduzione stantia viene mostrata per sbaglio.

   Se la copertura e' bassa compare un avviso onesto nella lingua scelta,
   invece di lasciare l'utente davanti a un muro di italiano senza spiegazioni. */
(function () {
  'use strict';

  // Piu' pagine cercavano di caricare questo script per conto loro: ora lo
  // fa eih-lang-url.js dal <head>, e questa guardia evita il doppio lavoro.
  if (window.__eihI18NPagina) return;
  window.__eihI18NPagina = true;

  var LINGUE = { en: 1, si: 1, ta: 1 };

  function lingua() {
    try {
      // Predefinita inglese: il markup e' scritto in italiano, ma quello e'
      // il testo di partenza, non la lingua in cui si presenta il sito.
      var l = localStorage.getItem('eih-lang') || window.EIH_LANG || 'en';
      return LINGUE[l] ? l : 'it';
    } catch (e) { return 'it'; }
  }

  function pagina() {
    // Questo script ora parte dal <head>: quando gira, il body puo' non
    // esistere ancora. In quel caso il nome si ricava dall'indirizzo, che e'
    // esattamente quello che ha gia' usato lo snippet per chiedere il file.
    var b = document.body, p = b && b.getAttribute('data-page');
    if (p) return p;
    p = location.pathname.replace(/^\/(en|si|ta)(?=\/|$)/, '').replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
    return p || 'index';
  }

  /* impronta FNV-1a a 32 bit del testo normalizzato */
  function impronta(t) {
    var s = t.replace(/\s+/g, ' ').trim();
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  var SALTA = /^(SCRIPT|STYLE|CODE|PRE|NOSCRIPT|TEXTAREA|SVG|NAV|FOOTER|TEMPLATE)$/;
  /* Dentro <main> un <nav> e' contenuto di pagina, non la testata del sito:
     l'indice "In questa pagina" delle guide lunghe e' un <nav> e restava in
     italiano perche' la regola qui sopra scartava ogni <nav> senza guardare
     dove fosse. Il menu e il piede stanno fuori da <main> e li prende _ui. */
  var SALTA_MAIN = /^(SCRIPT|STYLE|CODE|PRE|NOSCRIPT|TEXTAREA|SVG|TEMPLATE)$/;
  // Menu, piede, barra laterale e modali stanno fuori da <main>: li traduce il
  // dizionario condiviso _ui, che vale per tutte le pagine.
  var SALTA_UI = /^(SCRIPT|STYLE|CODE|PRE|NOSCRIPT|TEXTAREA|SVG|TEMPLATE|MAIN)$/;

  function daSaltare(el, salta) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if ((salta || SALTA).test(n.tagName)) return true;
      if (n.hasAttribute && (n.hasAttribute('data-i18n') || n.hasAttribute('data-i18n-html') || n.hasAttribute('data-no-tr'))) return true;
      if (n.classList && n.classList.contains('eih-no-tr')) return true;
    }
    return false;
  }

  /* Raccoglie i frammenti traducibili. Stessa funzione usata dallo script di
     estrazione, cosi' quello che si estrae e quello che si applica coincidono. */
  /* Con `dentro` si limita la raccolta a un pezzo di pagina appena arrivato:
     mentre l'HTML e' ancora in streaming conviene tradurre solo il nuovo,
     non rifare ogni volta il giro di tutto il documento. */
  /* `ui` rovescia l'ambito: invece del corpo pagina si guarda tutto il resto —
     testata, piede, barra laterale, modali — che e' uguale su ogni pagina. */
  function raccogli(dentro, ui) {
    var radici;
    var interno = dentro && dentro.closest && dentro.closest('main');
    if (dentro) radici = ui ? (interno ? [] : [dentro]) : (interno ? [dentro] : []);
    else radici = ui ? (document.body ? [document.body] : []) : document.querySelectorAll('main');
    // Se <main> manca si ripiega sul documento intero: li' il <nav> del sito
    // c'e' davvero e va scartato, quindi si torna alla regola larga.
    var dentroMain = !!(radici.length || interno);
    if (!dentro && !ui && !radici.length) { radici = document.body ? [document.body] : []; dentroMain = false; }
    var salta = ui ? SALTA_UI : (dentroMain ? SALTA_MAIN : SALTA);
    var fuori = [];
    for (var r = 0; r < radici.length; r++) {
      if (ui && radici[r].tagName === 'MAIN') continue;
      /* Si scarta l'intero sottoalbero appena si incontra un elemento da
         saltare, invece di visitare ogni nodo di testo e poi risalire gli
         antenati uno per uno. Sulla home, che e' grande, la sola scansione
         costava quasi un secondo: il testo restava in italiano nel frattempo. */
      var camm = document.createTreeWalker(radici[r], NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode: function (nodo) {
          if (nodo.nodeType === 1) {
            if (salta.test(nodo.tagName)) return NodeFilter.FILTER_REJECT;
            if (nodo.hasAttribute('data-i18n') || nodo.hasAttribute('data-i18n-html') || nodo.hasAttribute('data-no-tr'))
              return NodeFilter.FILTER_REJECT;
            if (nodo.classList.contains('eih-no-tr')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var n;
      while ((n = camm.nextNode())) {
        var t = n.nodeValue;
        if (!t) continue;
        var pulito = t.replace(/\s+/g, ' ').trim();
        if (pulito.length < 2) continue;
        if (!/[A-Za-zÀ-ÿ]{2}/.test(pulito)) continue;   // numeri, simboli, emoji
        fuori.push({ nodo: n, testo: pulito });
      }
      var camp = radici[r].querySelectorAll('[placeholder],[aria-label],[title]');
      for (var i = 0; i < camp.length; i++) {
        var el = camp[i];
        if (daSaltare(el, salta)) continue;
        ['placeholder', 'aria-label', 'title'].forEach(function (a) {
          var v = el.getAttribute(a);
          if (!v) return;
          var p = v.replace(/\s+/g, ' ').trim();
          if (p.length < 2 || !/[A-Za-zÀ-ÿ]{2}/.test(p)) return;
          fuori.push({ el: el, attr: a, testo: p });
        });
      }
    }
    return fuori;
  }

  var AVVISI = {
    en: ['This page has not been translated yet.', 'The text below is in Italian. Ask the AI assistant for an explanation in your language.', 'Ask the assistant'],
    si: ['මෙම පිටුව තවම පරිවර්තනය කර නැත.', 'පහත පෙළ ඉතාලි බසින් ය. ඔබේ භාෂාවෙන් පැහැදිලි කිරීමක් සඳහා AI සහායකයාගෙන් අසන්න.', 'සහායකයාගෙන් අසන්න'],
    ta: ['இந்தப் பக்கம் இன்னும் மொழிபெயர்க்கப்படவில்லை.', 'கீழுள்ள உரை இத்தாலிய மொழியில் உள்ளது. உங்கள் மொழியில் விளக்கம் பெற AI உதவியாளரிடம் கேளுங்கள்.', 'உதவியாளரிடம் கேளுங்கள்']
  };

  function avviso(lg, parziale) {
    if (document.getElementById('eih-tr-avviso')) return;
    var a = AVVISI[lg];
    if (!a) return;
    var radice = document.querySelector('main') || document.body;
    var d = document.createElement('div');
    d.id = 'eih-tr-avviso';
    d.setAttribute('role', 'note');
    d.style.cssText = 'margin:0 auto var(--sp-4,1.5rem);max-width:min(920px,92vw);padding:.85rem 1rem;border:1px solid rgba(180,140,60,.35);border-left:4px solid #b98b2e;border-radius:10px;background:rgba(255,246,224,.75);color:#4a3a1c;font-size:.92rem;line-height:1.5;display:flex;gap:.7rem;align-items:flex-start;flex-wrap:wrap';
    d.innerHTML = '<span aria-hidden="true" style="font-size:1.1rem;line-height:1.3">🌐</span>' +
      '<span style="flex:1 1 16rem"><strong style="display:block">' + a[0] + '</strong>' + a[1] + '</span>' +
      '<a href="/percorso" style="flex:0 0 auto;padding:.45rem .8rem;border-radius:8px;background:#b98b2e;color:#fff;text-decoration:none;font-weight:600">' + a[2] + '</a>';
    if (parziale) d.style.opacity = '.92';
    radice.insertBefore(d, radice.firstChild);
  }

  function applica(dizionario, dentro, ui) {
    var voci = raccogli(dentro, ui), presi = 0;
    for (var i = 0; i < voci.length; i++) {
      var v = voci[i], t = dizionario[impronta(v.testo)];
      // "" e' una traduzione valida: serve a svuotare gli spezzoni di una
      // testata che in singalese o tamil ha un ordine delle parole diverso
      if (t === undefined || t === null) continue;
      presi++;
      // si marca chi e' stato tradotto: dopo la sostituzione il testo non e'
      // piu' italiano e la sua impronta non si ritrova nel dizionario, quindi
      // senza marcatura un secondo controllo lo scambierebbe per non tradotto
      var portante = v.attr ? v.el : v.nodo.parentElement;
      if (portante) portante.setAttribute('data-tr-ok', '');
      ricorda(v);
      if (v.attr) v.el.setAttribute(v.attr, t);
      else v.nodo.nodeValue = v.nodo.nodeValue.replace(/^(\s*).*?(\s*)$/s, '$1' + t.replace(/\$/g, '$$$$') + '$2');
    }
    return { presi: presi, totale: voci.length };
  }

  /* La tipografia cinetica spezza i titoli in una <span> per parola. Se lo fa
     prima di noi, il titolo non e' piu' una frase: nessuna impronta lo trova e
     resta in italiano una parola alla volta. Chi spezza aspetta questa
     promessa, che si scioglie appena il primo passaggio ha tradotto. */
  /* Cambio lingua a pagina aperta.

     Prima questo script girava una volta sola: chi cambiava lingua a meta'
     pagina vedeva muoversi il menu e i pulsanti — quelli hanno le chiavi
     data-i18n, li rifa' eih.js — ma il corpo della pagina restava nella
     lingua di prima finche' non si ricaricava. Sull'esame era vistoso: le
     domande restavano in singalese sotto un'interfaccia inglese.

     Per tornare indietro serve l'italiano di partenza, che dopo la
     sostituzione non c'e' piu' da nessuna parte: si tiene qui, nodo per nodo.
     Gli osservatori si registrano, cosi' al cambio si spengono invece di
     accumularsi uno sopra l'altro. */
  var MEMORIA = [], SPIE = [];

  function ricorda(v) {
    if (v.attr) MEMORIA.push({ el: v.el, attr: v.attr, era: v.el.getAttribute(v.attr) });
    else MEMORIA.push({ nodo: v.nodo, era: v.nodo.nodeValue });
  }

  function ripristina() {
    for (var i = MEMORIA.length - 1; i >= 0; i--) {
      var m = MEMORIA[i];
      try {
        if (m.attr) m.el.setAttribute(m.attr, m.era);
        else m.nodo.nodeValue = m.era;
      } catch (e) {}
    }
    MEMORIA.length = 0;
    var segnati = document.querySelectorAll('[data-tr-ok]');
    for (var k = 0; k < segnati.length; k++) segnati[k].removeAttribute('data-tr-ok');
    var av = document.getElementById('eih-tr-avviso');
    if (av && av.parentNode) av.parentNode.removeChild(av);
    document.documentElement.removeAttribute('data-tr');
  }

  function spegni() {
    for (var i = 0; i < SPIE.length; i++) { try { SPIE[i].disconnect(); } catch (e) {} }
    SPIE.length = 0;
  }

  var sciogli;
  var pronta = window.Promise ? new Promise(function (r) { sciogli = r; }) : null;
  function fatto() { if (sciogli) { sciogli(); sciogli = null; } }

  function avvia(rifai) {
    var lg = lingua();
    // tornando all'italiano non c'e' niente da scaricare: si rimette l'originale
    if (lg === 'it') { if (rifai) { spegni(); ripristina(); } fatto(); return; }
    var pg = pagina();

    // Il dizionario di norma e' gia' in volo: lo fa partire eih-lang-url.js
    // dal <head>, prima ancora che questo script esista. Si riusa quella
    // richiesta; si riparte da zero solo se manca o riguarda un'altra pagina.
    var anticipato = window.__eihTrad;
    var buono = anticipato && anticipato.pagina === pg && anticipato.lingua === lg;
    var attesa = buono
      ? anticipato.promessa
      : fetch('/assets/i18n/' + pg + '.' + lg + '.json').then(function (r) { return r.ok ? r.json() : null; });
    // Testata, piede, barra laterale e modali: stesso testo su ogni pagina,
    // quindi un dizionario solo, scaricato una volta e tenuto in cache.
    var attesaUi = (buono && anticipato.promessaUi)
      ? anticipato.promessaUi
      : fetch('/assets/i18n/_ui.' + lg + '.json').then(function (r) { return r.ok ? r.json() : null; });
    var u = null, spiaUi = null;
    attesaUi.then(function (x) {
      u = x;
      if (!u) return;
      if (document.body) applica(u, null, true);
      /* Menu, piede e barra laterale non sono nell'HTML: li costruisce eih.js
         a documento pronto, e in parte piu' tardi ancora (news, festivita').
         Un osservatore li traduce appena nascono, finche' la pagina non si
         ferma; poi basta il passaggio finale. */
      if (!window.MutationObserver) return;
      spiaUi = new MutationObserver(function (m) {
        for (var i = 0; i < m.length; i++)
          for (var j = 0; j < m[i].addedNodes.length; j++)
            if (m[i].addedNodes[j].nodeType === 1) applica(u, m[i].addedNodes[j], true);
      });
      spiaUi.observe(document.documentElement, { childList: true, subtree: true });
      SPIE.push(spiaUi);
      /* La barra laterale arriva tardi: le news dopo la chiamata di rete, il
         menu rapido e le festivita' dopo ancora. Un giro di controllo a dieci
         secondi copre anche il caso lento, poi si smette di guardare. */
      setTimeout(function () {
        applica(u, null, true);
        if (spiaUi) { spiaUi.disconnect(); spiaUi = null; }
      }, 10000);
    }).catch(function () {});

    attesa
      .then(function (d) {
        // Il dizionario di solito arriva prima che il corpo pagina esista: si
        // aspetta il minimo indispensabile perche' ci sia qualcosa da tradurre.
        function primoPassaggio() {
          if (rifai) { spegni(); ripristina(); }
          if (d) {
            var e = applica(d);
            /* Il dizionario di pagina si applica anche fuori da <main>: le
               briciole di pane e i link "vedi anche" stanno in un <nav> che
               precede il corpo, sono diversi da pagina a pagina — quindi non
               possono stare in _ui — e cosi' restavano in italiano. Le voci
               che non c'entrano semplicemente non si trovano e si saltano. */
            applica(d, null, true);
            document.documentElement.setAttribute('data-tr', e.presi + '/' + e.totale);
          }
          // il corpo pagina puo' comparire: ora e' nella lingua giusta
          document.documentElement.classList.remove('eih-tr-attesa');
          fatto();
          controlloFinale();
        }
        if (d) delete d._meta;

        /* Non si aspetta il documento completo. Sulla home l'HTML e' lungo e
           DOMContentLoaded arriva dopo due secondi: il dizionario era pronto
           da un pezzo e il testo restava in italiano ad aspettare. Si traduce
           appena <main> compare, e si ripassa mentre il resto della pagina
           arriva pezzo per pezzo. */
        var ripasso = null;
        function seguiIlFlusso() {
          if (!d || !window.MutationObserver) return;
          // Si traduce subito il pezzo appena arrivato, prima che il browser
          // lo dipinga: rimandare anche di un fotogramma significa mostrarlo
          // in italiano e poi cambiarlo, ed e' li' che la pagina sobbalza.
          ripasso = new MutationObserver(function (mutazioni) {
            for (var i = 0; i < mutazioni.length; i++) {
              var agg = mutazioni[i].addedNodes;
              for (var j = 0; j < agg.length; j++)
                if (agg[j].nodeType === 1) applica(d, agg[j]);
            }
          });
          ripasso.observe(document.documentElement, { childList: true, subtree: true });
          SPIE.push(ripasso);
          // L'osservatore resta acceso anche dopo il caricamento. Prima si
          // spegneva a DOMContentLoaded, e le pagine che si ridisegnano al
          // clic tornavano in italiano un pezzo alla volta: nei moduli bastava
          // scegliere un altro modello per vedere l'elenco riscriversi in
          // italiano sotto un'interfaccia inglese. Rileggere un ramo appena
          // nato costa poco, e `data-tr-ok` impedisce di rifarlo due volte.
          document.addEventListener('DOMContentLoaded', function () {
            applica(d); applica(d, null, true);
          });
        }

        if (document.querySelector('main') || document.readyState !== 'loading') {
          primoPassaggio();
          seguiIlFlusso();
        } else {
          var spia = new MutationObserver(function () {
            if (!document.querySelector('main')) return;
            spia.disconnect();
            primoPassaggio();
            seguiIlFlusso();
          });
          spia.observe(document.documentElement, { childList: true, subtree: true });
          document.addEventListener('DOMContentLoaded', function () {
            spia.disconnect();
            if (!document.documentElement.hasAttribute('data-tr')) primoPassaggio();
          });
        }

        // Il giudizio sulla copertura si dà a pagina ferma: molte pagine
        // costruiscono pezzi di sé con JavaScript, e misurare troppo presto
        // fa comparire l'avviso anche dove la traduzione poi arriva.
        function controlloFinale() { setTimeout(function () {
          if (d) { applica(d); applica(d, null, true); }   // anche i pezzi nati da JavaScript
          if (u) applica(u, null, true);
          var voci = raccogli(), residuo = 0;
          for (var i = 0; i < voci.length; i++) {
            var v = voci[i], portante = v.attr ? v.el : v.nodo.parentElement;
            if (portante && portante.hasAttribute('data-tr-ok')) continue;
            if (d && d[impronta(v.testo)] !== undefined) continue;
            residuo++;
          }
          document.documentElement.setAttribute('data-tr', (voci.length - residuo) + '/' + voci.length);
          // Si avvisa solo se resta parecchio italiano, non per due parole.
          // In inglese non si distingue l'italiano dall'inglese guardando
          // l'alfabeto: lì l'avviso vale solo quando manca tutto il dizionario.
          var attendibile = lg !== 'en' || !d;
          if (attendibile && residuo > 12 && residuo / Math.max(1, voci.length) > 0.45) avviso(lg, !!d);
        }, 1400); }
      })
      .catch(function () { document.documentElement.classList.remove('eih-tr-attesa'); fatto(); });
    // se il dizionario non arriva, l'animazione non resta ferma per sempre
    setTimeout(fatto, 4000);
  }

  /* La chiama eih.js quando l'utente sceglie un'altra lingua. */
  function cambia() { avvia(true); }

  window.EIHPageI18N = { raccogli: raccogli, impronta: impronta, applica: applica,
    avvia: avvia, cambia: cambia, pronta: pronta };

  // Si parte subito, senza aspettare DOMContentLoaded: il dizionario e'
  // gia' in volo e ogni millisecondo di attesa e' un millisecondo in cui
  // l'utente legge l'italiano.
  avvia();

  // ricarica la pagina quando l'utente cambia lingua da un'altra scheda
  window.addEventListener('storage', function (e) {
    if (e.key === 'eih-lang') location.reload();
  });
})();
