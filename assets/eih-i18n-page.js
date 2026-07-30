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

  var LINGUE = { en: 1, si: 1, ta: 1 };

  function lingua() {
    try {
      var l = localStorage.getItem('eih-lang') || document.documentElement.lang || 'it';
      return LINGUE[l] ? l : 'it';
    } catch (e) { return 'it'; }
  }

  function pagina() {
    var p = document.body.getAttribute('data-page');
    if (p) return p;
    p = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
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

  function daSaltare(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (SALTA.test(n.tagName)) return true;
      if (n.hasAttribute && (n.hasAttribute('data-i18n') || n.hasAttribute('data-i18n-html') || n.hasAttribute('data-no-tr'))) return true;
      if (n.classList && n.classList.contains('eih-no-tr')) return true;
    }
    return false;
  }

  /* Raccoglie i frammenti traducibili. Stessa funzione usata dallo script di
     estrazione, cosi' quello che si estrae e quello che si applica coincidono. */
  function raccogli() {
    var radici = document.querySelectorAll('main');
    if (!radici.length) radici = [document.body];
    var fuori = [];
    for (var r = 0; r < radici.length; r++) {
      var camm = document.createTreeWalker(radici[r], NodeFilter.SHOW_TEXT, null);
      var n;
      while ((n = camm.nextNode())) {
        var t = n.nodeValue;
        if (!t) continue;
        var pulito = t.replace(/\s+/g, ' ').trim();
        if (pulito.length < 2) continue;
        if (!/[A-Za-zÀ-ÿ]{2}/.test(pulito)) continue;   // numeri, simboli, emoji
        if (daSaltare(n.parentElement)) continue;
        fuori.push({ nodo: n, testo: pulito });
      }
      var camp = radici[r].querySelectorAll('[placeholder],[aria-label],[title]');
      for (var i = 0; i < camp.length; i++) {
        var el = camp[i];
        if (daSaltare(el)) continue;
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

  function applica(dizionario) {
    var voci = raccogli(), presi = 0;
    for (var i = 0; i < voci.length; i++) {
      var v = voci[i], t = dizionario[impronta(v.testo)];
      if (!t) continue;
      presi++;
      if (v.attr) v.el.setAttribute(v.attr, t);
      else v.nodo.nodeValue = v.nodo.nodeValue.replace(/^(\s*).*?(\s*)$/s, '$1' + t.replace(/\$/g, '$$$$') + '$2');
    }
    return { presi: presi, totale: voci.length };
  }

  function avvia() {
    var lg = lingua();
    if (lg === 'it') return;
    var pg = pagina();
    fetch('/assets/i18n/' + pg + '.' + lg + '.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        // niente dizionario: si avvisa solo se resta davvero molto italiano
        if (!d) { if (raccogli().length > 12) avviso(lg, false); return; }
        delete d._meta;
        var e = applica(d);
        document.documentElement.setAttribute('data-tr', e.presi + '/' + e.totale);
        if (e.totale > 6 && e.presi / e.totale < 0.55) avviso(lg, true);
      })
      .catch(function () {});
  }

  window.EIHPageI18N = { raccogli: raccogli, impronta: impronta, applica: applica, avvia: avvia };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();

  // ricarica la pagina quando l'utente cambia lingua da un'altra scheda
  window.addEventListener('storage', function (e) {
    if (e.key === 'eih-lang') location.reload();
  });
})();
