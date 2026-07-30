/* eih-bottom-nav.js — barra di navigazione fissa in basso, solo da telefono.

   Cinque destinazioni raggiungibili con il pollice, senza aprire il menu.
   La barra pubblica la propria altezza in --eih-bnav-h: il contenuto della
   pagina, il pulsante della chat e gli avvisi in basso si spostano di
   conseguenza invece di finirci sotto. */
(function () {
  'use strict';
  if (window.__eihBottomNav) return;
  window.__eihBottomNav = true;

  var VOCI = [
    { href: '/', k: 'home', ic: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
      t: { it: 'Home', en: 'Home', si: 'මුල', ta: 'முகப்பு' } },
    { href: '/guide', k: 'guide', ic: '<path d="M4 5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 1-2-2z"/><path d="M9 7h6M9 11h6"/>',
      t: { it: 'Guide', en: 'Guides', si: 'මාර්ගෝපදේශ', ta: 'வழிகாட்டி' } },
    { href: '/percorso', k: 'percorso', ic: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      t: { it: 'Percorso', en: 'Journey', si: 'ගමන', ta: 'பயணம்' } },
    { href: '/community', k: 'community', ic: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 11a3 3 0 1 0-1.5-5.6"/><path d="M18 20c0-2.2-.8-3.7-2-4.6"/>',
      t: { it: 'Community', en: 'Community', si: 'ප්‍රජාව', ta: 'சமூகம்' } },
    { href: '/dashboard', k: 'profilo', ic: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
      t: { it: 'Profilo', en: 'Profile', si: 'පැතිකඩ', ta: 'சுயவிவரம்' } },
  ];

  function lingua() {
    var l = 'it';
    try { l = localStorage.getItem('eih-lang') || 'it'; } catch (e) {}
    return ['it', 'en', 'si', 'ta'].indexOf(l) >= 0 ? l : 'it';
  }

  var CSS =
    '#eih-bnav{position:fixed;left:0;right:0;bottom:0;z-index:450;display:none;' +
    'grid-template-columns:repeat(5,1fr);align-items:stretch;' +
    'background:#fbfaf8;border-top:1px solid var(--border,rgba(120,120,120,.25));' +
    'padding-bottom:env(safe-area-inset-bottom,0px);box-shadow:0 -2px 14px rgba(20,30,48,.07)}' +
    '#eih-bnav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.15rem;' +
    'min-height:56px;padding:.4rem .2rem;text-decoration:none;color:var(--fg-muted,#7a736a);' +
    'font-size:.62rem;font-weight:600;letter-spacing:.01em;-webkit-tap-highlight-color:transparent}' +
    '#eih-bnav a svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;' +
    'stroke-linecap:round;stroke-linejoin:round}' +
    '#eih-bnav a.attiva{color:var(--gold,#7c7059)}' +
    '#eih-bnav a:active{background:rgba(120,120,120,.08)}' +
    'html[data-theme="dark"] #eih-bnav{background:#1c1916}' +
    '@media(max-width:900px){' +
      '#eih-bnav{display:grid}' +
      /* il contenuto non deve finire sotto la barra */
      'body{padding-bottom:var(--eih-bnav-h,60px)}' +
      /* pulsante chat, mascotte, avvisi: tutti sopra la barra */
      '#chat-btn{bottom:calc(var(--eih-bnav-h,60px) + .75rem)}' +
      '#to-top{bottom:calc(var(--eih-bnav-h,60px) + 4.25rem)}' +
      '.eih-fest-toast{bottom:calc(var(--eih-bnav-h,60px) + .75rem)}' +
      '#eih-install{bottom:calc(var(--eih-consent-h,0px) + var(--eih-bnav-h,60px) + .75rem)}' +
      '#eih-consent,#eih-consent-panel{bottom:var(--eih-bnav-h,60px)}' +
      '#chat-panel{bottom:calc(var(--eih-bnav-h,60px) + 52px + 1.25rem)}' +
    '}';

  function monta() {
    if (document.getElementById('eih-bnav')) return;

    var st = document.createElement('style');
    st.id = 'eih-bnav-css';
    st.textContent = CSS;
    document.head.appendChild(st);

    var l = lingua();
    var qui = location.pathname.replace(/\/$/, '') || '/';
    var nav = document.createElement('nav');
    nav.id = 'eih-bnav';
    nav.setAttribute('aria-label', 'Navigazione rapida');
    nav.innerHTML = VOCI.map(function (v) {
      var attiva = (v.href === '/' ? qui === '/' : qui.indexOf(v.href) === 0);
      return '<a href="' + v.href + '"' + (attiva ? ' class="attiva" aria-current="page"' : '') + '>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + v.ic + '</svg>' +
        '<span>' + (v.t[l] || v.t.it) + '</span></a>';
    }).join('');
    document.body.appendChild(nav);

    var misura = function () {
      var h = Math.round(nav.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--eih-bnav-h', h + 'px');
    };
    misura();
    addEventListener('resize', misura);
    setTimeout(misura, 800);
  }

  if (document.body) monta(); else addEventListener('DOMContentLoaded', monta);
})();
