/* eih-install.js — invito a installare la PWA, solo da mobile.
   Android/Chrome usa beforeinstallprompt; iOS non lo espone e riceve le
   istruzioni manuali (Condividi → Aggiungi alla schermata Home). */
(function () {
  'use strict';
  if (window.__eihInstall) return;
  window.__eihInstall = true;

  var CHIAVE = 'eih-install-hide';
  var RINVIO = 30 * 24 * 60 * 60 * 1000;   // rimandato: si ripresenta fra 30 giorni
  var RITARDO = 9000;                      // dopo cookie (5s) e toast festività

  var T = {
    it: { t: 'Installa Easy Italia Hub', s: 'Aggiungila alla schermata Home: si apre come un\'app, anche senza connessione.',
          b: 'Installa', ios: 'Tocca <strong>Condividi</strong> in basso, poi <strong>Aggiungi alla schermata Home</strong>.', x: 'Chiudi' },
    en: { t: 'Install Easy Italia Hub', s: 'Add it to your Home screen: it opens like an app, even offline.',
          b: 'Install', ios: 'Tap <strong>Share</strong> below, then <strong>Add to Home Screen</strong>.', x: 'Close' },
    si: { t: 'Easy Italia Hub ස්ථාපනය කරන්න', s: 'මුල් තිරයට එක් කරන්න: අන්තර්ජාලය නොමැතිව පවා යෙදුමක් ලෙස විවෘත වේ.',
          b: 'ස්ථාපනය', ios: 'පහළ <strong>Share</strong> තට්ටු කර, <strong>Add to Home Screen</strong> තෝරන්න.', x: 'වසන්න' },
    ta: { t: 'Easy Italia Hub நிறுவவும்', s: 'முகப்புத் திரையில் சேர்க்கவும்: இணையம் இல்லாமலும் ஆப்பாகத் திறக்கும்.',
          b: 'நிறுவு', ios: 'கீழே <strong>Share</strong> தட்டி, <strong>Add to Home Screen</strong> தேர்ந்தெடுக்கவும்.', x: 'மூடு' },
  };

  function lang() {
    var l = 'it';
    l = window.EIH_LANG || 'en';
    try { l = localStorage.getItem('eih-lang') || l; } catch (e) {}
    return T[l] ? l : 'it';
  }

  function mobile() {
    return matchMedia('(max-width:900px)').matches || matchMedia('(pointer:coarse)').matches;
  }

  // Già installata: in standalone il banner sarebbe assurdo.
  function installata() {
    return matchMedia('(display-mode:standalone)').matches || navigator.standalone === true;
  }

  function iOS() {
    var ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function rimandata() {
    try {
      var v = localStorage.getItem(CHIAVE);
      return !!v && (Date.now() - (+v || 0)) < RINVIO;
    } catch (e) { return false; }
  }

  function rimanda() {
    try { localStorage.setItem(CHIAVE, String(Date.now())); } catch (e) {}
  }

  var CSS =
    '#eih-install{position:fixed;left:.75rem;right:.75rem;bottom:calc(var(--eih-consent-h,0px) + .75rem);z-index:600;' +
    'display:flex;align-items:center;gap:.7rem;padding:.7rem .8rem;border-radius:16px;' +
    'background:rgba(255,253,250,.96);backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);' +
    'border:1px solid var(--border-bright,rgba(120,120,120,.28));box-shadow:0 10px 34px rgba(20,30,48,.18);' +
    'transform:translateY(14px);opacity:0;transition:transform .4s cubic-bezier(.16,1,.3,1),opacity .35s ease,bottom .3s ease}' +
    '#eih-install.is-shown{transform:none;opacity:1}' +
    '#eih-install img{width:38px;height:38px;border-radius:9px;flex-shrink:0}' +
    '#eih-install .ei-txt{flex:1;min-width:0}' +
    '#eih-install .ei-t{font-family:\'Clash Grotesk\',sans-serif;font-size:.82rem;font-weight:600;color:var(--ink,#161412);line-height:1.25}' +
    '#eih-install .ei-s{font-size:.68rem;color:var(--fg-secondary,#565049);line-height:1.4;margin-top:.15rem}' +
    '#eih-install .ei-s strong{color:var(--ink,#161412);font-weight:700}' +
    '#eih-install .ei-b{flex-shrink:0;border:none;cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700;' +
    'color:#fff;background:linear-gradient(135deg,var(--blue-deep,#1f4b8f),var(--blue,#2f6fd0));padding:.5rem .95rem;border-radius:999px}' +
    '#eih-install .ei-x{position:absolute;top:-.5rem;right:-.5rem;width:26px;height:26px;border-radius:50%;border:1px solid var(--border-bright,rgba(120,120,120,.28));' +
    'background:rgba(255,253,250,.98);cursor:pointer;font-size:.7rem;line-height:1;color:var(--fg-muted,#7a736a);display:flex;align-items:center;justify-content:center}' +
    '@media(prefers-color-scheme:dark){#eih-install{background:rgba(26,19,10,.96)}#eih-install .ei-x{background:rgba(26,19,10,.98)}}';

  function stile() {
    if (document.getElementById('eih-install-css')) return;
    var s = document.createElement('style');
    s.id = 'eih-install-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var nodo = null;

  function chiudi() {
    if (!nodo) return;
    nodo.classList.remove('is-shown');
    var n = nodo; nodo = null;
    setTimeout(function () { if (n.parentNode) n.remove(); }, 400);
  }

  // Due overlay insieme sono invadenti: si aspetta che il cookie banner
  // sia stato chiuso, poi si riprova.
  function quandoLibero(fn) {
    if (!document.body.classList.contains('eih-consent-open')) return fn();
    var t = setInterval(function () {
      if (!document.body.classList.contains('eih-consent-open')) { clearInterval(t); fn(); }
    }, 1000);
    setTimeout(function () { clearInterval(t); }, 120000);
  }

  function mostra(prompt) {
    if (nodo || installata() || rimandata()) return;
    stile();
    var S = T[lang()];
    nodo = document.createElement('div');
    nodo.id = 'eih-install';
    nodo.setAttribute('role', 'dialog');
    nodo.setAttribute('aria-label', S.t);
    nodo.innerHTML =
      '<img src="/assets/icon-192.png" alt="" width="38" height="38"/>' +
      '<div class="ei-txt"><div class="ei-t">' + S.t + '</div>' +
      '<div class="ei-s">' + (prompt ? S.s : S.ios) + '</div></div>' +
      (prompt ? '<button type="button" class="ei-b">' + S.b + '</button>' : '') +
      '<button type="button" class="ei-x" aria-label="' + S.x + '">✕</button>';

    nodo.querySelector('.ei-x').addEventListener('click', function () { rimanda(); chiudi(); });
    var b = nodo.querySelector('.ei-b');
    if (b) b.addEventListener('click', function () {
      if (!prompt) return;
      prompt.prompt();
      prompt.userChoice.then(function (r) {
        // Rifiutata: non riproporla subito. Accettata: sparisce comunque.
        if (!r || r.outcome !== 'accepted') rimanda();
        chiudi();
      });
    });

    document.body.appendChild(nodo);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (nodo) nodo.classList.add('is-shown'); });
    });
  }

  if (!mobile() || installata() || rimandata()) return;

  // Android/Chrome: l'evento arriva solo se i criteri PWA sono soddisfatti.
  addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    setTimeout(function () { quandoLibero(function () { mostra(e); }); }, RITARDO);
  });

  // iOS non emette mai beforeinstallprompt: istruzioni manuali, solo in Safari
  // (dentro Chrome/Firefox iOS l'aggiunta a Home non è disponibile).
  if (iOS() && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)) {
    setTimeout(function () { quandoLibero(function () { mostra(null); }); }, RITARDO);
  }

  addEventListener('appinstalled', function () { rimanda(); chiudi(); });
})();
