/* Easy Italia Hub — command palette (⌘K / Ctrl+K / pulsante flottante).
   Self-contained: stile iniettato, nessuna dipendenza. */
(function () {
  'use strict';

  var PAGES = [
    { href: '/', it: 'Home', en: 'Home', k: 'inizio start landing' },
    { href: '/percorso', it: 'Il Mio Percorso', en: 'My Journey', k: 'fasi vita simulatore busta paga mutuo test italiano journey' },
    { href: '/guide', it: 'Guide burocratiche', en: 'Guides', k: 'permesso spid codice fiscale residenza cittadinanza burocrazia' },
    { href: '/permesso-tracker', it: 'Tracker Permesso di Soggiorno', en: 'Residence permit tracker', k: 'questura kit postale rinnovo pratica soggiorno' },
    { href: '/documenti', it: 'Archivio Documenti', en: 'Documents archive', k: 'file pdf passaporto scadenze upload' },
    { href: '/cv-builder', it: 'CV Builder', en: 'CV Builder', k: 'curriculum lavoro europass resume' },
    { href: '/moduli', it: 'Moduli e Lettere', en: 'Letters & forms', k: 'delega disdetta ospitalita sollecito lettera pdf stampa' },
    { href: '/dashboard', it: 'La mia Dashboard', en: 'My Dashboard', k: 'scadenze calendario promemoria' },
    { href: '/community', it: 'Community', en: 'Community', k: 'forum domande persone annunci' },
    { href: '/news', it: 'News', en: 'News', k: 'notizie sri lanka aggiornamenti' },
    { href: '/mappa', it: 'Mappa dei servizi', en: 'Services map', k: 'caf patronato questura consolato negozio' },
    { href: '/money-transfer', it: 'Money Transfer', en: 'Money transfer', k: 'soldi rimesse cambio rupie invio denaro' },
    { href: '/wise', it: 'Wise: come funziona', en: 'Wise: how it works', k: 'wise conto multivaluta carta rupie lkr rimesse commissioni partner' },
    { href: '/cargo', it: 'Spedizioni Cargo', en: 'Cargo shipping', k: 'pacco nave aereo container colombo spedire scatolone' },
    { href: '/guida-conti', it: 'Aprire un Conto in Banca', en: 'Open a bank account', k: 'conto corrente bancario poste iban hype n26 revolut stranieri' },
    { href: '/dizionario-medico', it: 'Dizionario Medico IT-Singalese', en: 'Medical dictionary IT-Sinhala', k: 'sintomi medico farmacia singalese sinhala frasi traduzione pronto soccorso' },
    { href: '/opportunita', it: 'Opportunità', en: 'Opportunities', k: 'lavoro corsi borse offerte' },
    { href: '/chi-siamo', it: 'Chi siamo', en: 'About us', k: 'missione team contawho' },
    { href: '/contatti', it: 'Contatti', en: 'Contact', k: 'email scrivici supporto aiuto' },
    { href: '/privacy', it: 'Privacy', en: 'Privacy', k: 'dati gdpr' },
    { href: '/cookie', it: 'Cookie policy', en: 'Cookie policy', k: '' },
    { href: '/termini', it: 'Termini di servizio', en: 'Terms', k: 'condizioni' },
    { href: '/note-legali', it: 'Note legali', en: 'Legal notes', k: '' }
  ];

  var css =
    '#eihp-fab{position:fixed;right:18px;bottom:188px;width:46px;height:46px;border-radius:50%;border:1px solid rgba(118,118,118,.35);' +
    'background:rgba(255,255,255,.95);backdrop-filter:blur(16px);cursor:pointer;z-index:9000;display:flex;align-items:center;justify-content:center;' +
    'box-shadow:0 8px 28px rgba(20,30,48,.18);transition:transform .25s cubic-bezier(.16,1,.3,1)}' +
    '#eihp-fab::before{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid rgba(124,130,140,.5);opacity:0;pointer-events:none;animation:eihp-ring 3.6s ease-out infinite}' +
    '#eihp-fab:hover{transform:scale(1.08)}' +
    '#eihp-fab svg{width:19px;height:19px;stroke:#161412;transform-origin:55% 45%;animation:eihp-wig 3.6s ease-in-out infinite}' +
    '@keyframes eihp-ring{0%,72%{transform:scale(.8);opacity:0}82%{opacity:.55}100%{transform:scale(1.6);opacity:0}}' +
    '@keyframes eihp-wig{0%,78%,100%{transform:rotate(0)}84%{transform:rotate(-13deg)}90%{transform:rotate(11deg)}95%{transform:rotate(0)}}' +
    '@media(prefers-reduced-motion:reduce){#eihp-fab::before,#eihp-fab svg{animation:none}}' +
    '#eihp-ov{position:fixed;inset:0;background:rgba(22,20,18,.38);backdrop-filter:blur(6px);z-index:10500;display:none;align-items:flex-start;justify-content:center;padding:12vh 1rem 0}' +
    '#eihp-ov.open{display:flex}' +
    '#eihp-box{width:min(620px,100%);background:#f4f6f9;border:1px solid rgba(118,118,118,.25);border-radius:18px;overflow:hidden;' +
    'box-shadow:0 30px 80px rgba(22,20,18,.35);animation:eihp-in .28s cubic-bezier(.16,1,.3,1)}' +
    '@keyframes eihp-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}' +
    '#eihp-in{width:100%;border:0;outline:0;background:transparent;padding:1.05rem 1.25rem;font:500 1.05rem/1.4 Satoshi,Inter,system-ui,sans-serif;color:#161412;border-bottom:1px solid rgba(118,118,118,.2)}' +
    '#eihp-ls{max-height:46vh;overflow-y:auto;padding:.45rem}' +
    '.eihp-it{display:flex;align-items:center;gap:.7rem;padding:.7rem .85rem;border-radius:11px;cursor:pointer;font:500 .95rem Satoshi,Inter,system-ui,sans-serif;color:#1c1a17}' +
    '.eihp-it small{color:#888d96;font-size:.78rem;margin-left:auto}' +
    '.eihp-it.sel{background:rgba(132,138,148,.14)}' +
    '.eihp-it .dot{width:7px;height:7px;border-radius:50%;background:#7c828c;flex:none}' +
    '#eihp-emp{padding:1.1rem;text-align:center;color:#888d96;font:500 .9rem Satoshi,sans-serif;display:none}' +
    '#eihp-ft{display:flex;gap:1rem;padding:.6rem 1rem;border-top:1px solid rgba(118,118,118,.2);color:#888d96;font:500 .72rem Satoshi,sans-serif}' +
    '#eihp-ft b{font-weight:700;background:rgba(22,20,18,.07);border-radius:5px;padding:.1rem .35rem}' +
    '/* Da telefono si aggancia alla barra in alto invece di stare a meta schermo */'+
  '@media(max-width:640px){#eihp-fab{right:60px;bottom:auto;top:calc(var(--eih-nav-h,76px)/2 - 19px);width:38px;height:38px;box-shadow:none;background:transparent;border-color:transparent;backdrop-filter:none}'+
  '#eihp-fab svg{width:21px;height:21px}#eihp-fab::before{display:none}#eihp-fab:hover{transform:none}#eihp-fab:active{transform:scale(.92)}}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.id = 'eihp-ov';
  ov.innerHTML =
    '<div id="eihp-box" role="dialog" aria-modal="true" aria-label="Ricerca nel sito">' +
    '<input id="eihp-in" type="text" placeholder="Cerca una pagina o uno strumento…  /  Search…" autocomplete="off"/>' +
    '<div id="eihp-ls" role="listbox"></div><div id="eihp-emp">Nessun risultato · No results</div>' +
    '<div id="eihp-ft"><span><b>↑↓</b> naviga</span><span><b>↵</b> apri</span><span><b>esc</b> chiudi</span></div></div>';

  var fab = document.createElement('button');
  fab.id = 'eihp-fab';
  fab.setAttribute('aria-label', 'Cerca nel sito (Ctrl+K)');
  fab.title = 'Cerca · Ctrl+K';
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';

  function mount() { document.body.appendChild(ov); document.body.appendChild(fab); }

  // Alcune pagine caricano la palette ma non eih-theme.js: la misura della
  // barra serve comunque per agganciare il pulsante da telefono.
  if (!window.__eihNavH) {
    window.__eihNavH = true;
    var misuraNav = function () {
      var n = document.querySelector('.site-nav') || document.querySelector('#site-nav nav');
      if (!n) return;
      var h = Math.round(n.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--eih-nav-h', h + 'px');
    };
    addEventListener('load', misuraNav);
    addEventListener('resize', misuraNav);
    setTimeout(misuraNav, 400);
    setTimeout(misuraNav, 1600);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  var input, list, empty, sel = 0, results = [];

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function search(q) {
    q = norm(q.trim());
    if (!q) return PAGES.slice(0, 8);
    return PAGES.map(function (p) {
      var title = norm(p.it + ' ' + p.en), hay = title + ' ' + norm(p.k);
      var score = 0;
      q.split(/\s+/).forEach(function (w) {
        if (!w) return;
        var wordPrefix = function (s) {
          return s.split(/\s+/).some(function (h) { return h.indexOf(w) === 0; });
        };
        if (wordPrefix(title)) score += 4;
        else if (wordPrefix(hay)) score += 2;
        else if (hay.indexOf(w) !== -1) score += 1;
        else score -= 9;
      });
      return { p: p, s: score };
    }).filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (r) { return r.p; });
  }
  function render() {
    list.innerHTML = '';
    empty.style.display = results.length ? 'none' : 'block';
    results.forEach(function (p, i) {
      var d = document.createElement('div');
      d.className = 'eihp-it' + (i === sel ? ' sel' : '');
      d.setAttribute('role', 'option');
      d.innerHTML = '<span class="dot"></span><span>' + p.it + '</span><small>' + p.en + '</small>';
      d.addEventListener('click', function () { go(p); });
      d.addEventListener('mousemove', function () { if (sel !== i) { sel = i; render(); } });
      list.appendChild(d);
    });
  }
  function go(p) { close(); window.location.href = p.href; }
  function open() {
    ov.classList.add('open');
    input = document.getElementById('eihp-in');
    list = document.getElementById('eihp-ls');
    empty = document.getElementById('eihp-emp');
    input.value = ''; sel = 0; results = search(''); render();
    setTimeout(function () { input.focus(); }, 30);
  }
  function close() { ov.classList.remove('open'); }

  fab.addEventListener('click', open);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ov.classList.contains('open') ? close() : open(); return; }
    if (!ov.classList.contains('open')) {
      if (e.key === '/' && !typing) { e.preventDefault(); open(); }
      return;
    }
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); go(results[sel]); }
  });
  ov.addEventListener('input', function (e) {
    if (e.target.id === 'eihp-in') { sel = 0; results = search(e.target.value); render(); }
  });
})();
