/* ─────────────────────────────────────────────────────────────
   Easy Italia Hub — cookie/consent banner (eih-consent.js)
   Zero-dependency, self-contained, GDPR-oriented.

   - 4 lingue (it/en/si/ta), segue localStorage 'eih-lang'.
   - 3 scelte: Accetta tutti · Rifiuta · Personalizza (pannello con toggle).
   - Categorie: necessari (sempre on), analitici, marketing.
   - Bottone "riapri" sempre disponibile per modificare la scelta.
   - Consenso salvato in localStorage 'eih-cookie-consent' come JSON
     { v, ts, analytics, marketing } (retro-compat con i vecchi valori
     stringa 'all'/'necessary').
   - Espone window.EIH_CONSENT {value, analytics, marketing} e
     window.EIH_openConsent(); emette l'evento 'cookieConsentUpdated'
     così altri script possono reagire e caricarsi solo dopo consenso.

   Il sito usa oggi SOLO storage tecnico (lingua, sessione, progressi):
   nessun analytics/marketing è caricato. I toggle predispongono il
   consenso per eventuali script futuri, che vanno gated su
   window.EIH_CONSENT.analytics / .marketing === true.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var KEY = 'eih-cookie-consent';

  function lang() {
    try { return (localStorage.getItem('eih-lang') || 'it').slice(0, 2); }
    catch (e) { return 'it'; }
  }

  var T = {
    it: { txt: 'Usiamo cookie tecnici necessari (lingua, sessione, progressi). Con il tuo consenso possiamo usare cookie analitici e di marketing. Dettagli nella ', policy: 'Cookie Policy', all: 'Accetta tutti', rej: 'Rifiuta', custom: 'Personalizza', save: 'Salva preferenze', title: 'Preferenze cookie', nec: 'Necessari', necD: 'Indispensabili al funzionamento. Sempre attivi.', ana: 'Analitici', anaD: 'Statistiche di utilizzo anonime per migliorare il sito.', mkt: 'Marketing', mktD: 'Contenuti e comunicazioni personalizzate.', reopen: 'Preferenze cookie' },
    en: { txt: 'We use necessary technical cookies (language, session, progress). With your consent we may use analytics and marketing cookies. Details in the ', policy: 'Cookie Policy', all: 'Accept all', rej: 'Reject', custom: 'Customize', save: 'Save preferences', title: 'Cookie preferences', nec: 'Necessary', necD: 'Essential for the site to work. Always on.', ana: 'Analytics', anaD: 'Anonymous usage statistics to improve the site.', mkt: 'Marketing', mktD: 'Personalized content and communications.', reopen: 'Cookie preferences' },
    si: { txt: 'අවශ්‍ය තාක්ෂණික කුකීස් (භාෂාව, සැසිය, ප්‍රගතිය) අපි භාවිත කරමු. ඔබගේ කැමැත්තෙන් විශ්ලේෂණ සහ අලෙවිකරණ කුකීස් භාවිත කළ හැක. විස්තර ', policy: 'කුකී ප්‍රතිපත්තිය', all: 'සියල්ල පිළිගන්න', rej: 'ප්‍රතික්ෂේප', custom: 'අභිරුචිකරණය', save: 'මනාපයන් සුරකින්න', title: 'කුකී මනාප', nec: 'අවශ්‍ය', necD: 'ක්‍රියාකාරීත්වයට අත්‍යවශ්‍යයි. සැමවිට ක්‍රියාත්මකයි.', ana: 'විශ්ලේෂණ', anaD: 'වෙබ් අඩවිය වැඩිදියුණු කිරීමට නිර්නාමික සංඛ්‍යාලේඛන.', mkt: 'අලෙවිකරණය', mktD: 'පුද්ගලීකරණය කළ අන්තර්ගතය සහ සන්නිවේදන.', reopen: 'කුකී මනාප' },
    ta: { txt: 'தேவையான தொழில்நுட்ப குக்கீகளை (மொழி, அமர்வு, முன்னேற்றம்) பயன்படுத்துகிறோம். உங்கள் ஒப்புதலுடன் பகுப்பாய்வு மற்றும் சந்தைப்படுத்தல் குக்கீகளைப் பயன்படுத்தலாம். விவரங்கள் ', policy: 'குக்கீ கொள்கை', all: 'அனைத்தையும் ஏற்க', rej: 'நிராகரி', custom: 'தனிப்பயனாக்கு', save: 'விருப்பங்களை சேமி', title: 'குக்கீ விருப்பங்கள்', nec: 'அவசியமானவை', necD: 'செயல்பாட்டிற்கு அவசியம். எப்போதும் இயக்கத்தில்.', ana: 'பகுப்பாய்வு', anaD: 'தளத்தை மேம்படுத்த அநாமதேய பயன்பாட்டு புள்ளிவிவரங்கள்.', mkt: 'சந்தைப்படுத்தல்', mktD: 'தனிப்பயனாக்கப்பட்ட உள்ளடக்கம் மற்றும் தகவல்.', reopen: 'குக்கீ விருப்பங்கள்' },
  };
  function t() { return T[lang()] || T.it; }

  function readConsent() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    if (raw === 'all') return { analytics: true, marketing: true };
    if (raw === 'necessary') return { analytics: false, marketing: false };
    try { var o = JSON.parse(raw); return { analytics: !!o.analytics, marketing: !!o.marketing }; }
    catch (e) { return null; }
  }

  function apply(c) {
    window.EIH_CONSENT = { value: c ? (c.analytics && c.marketing ? 'all' : (!c.analytics && !c.marketing ? 'necessary' : 'custom')) : null, analytics: !!(c && c.analytics), marketing: !!(c && c.marketing) };
    try { window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: window.EIH_CONSENT })); } catch (e) {}
  }

  function persist(analytics, marketing) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ts: Date.now(), analytics: !!analytics, marketing: !!marketing })); } catch (e) {}
    apply({ analytics: analytics, marketing: marketing });
  }

  apply(readConsent());

  // ── Styles (injected once) ──
  var style = document.createElement('style');
  style.textContent =
    '#eih-consent,#eih-consent-panel{position:fixed;z-index:9999;background:rgba(16,12,7,.95);color:#e2e5ea;' +
    'border:1px solid rgba(138,144,154,.22);border-radius:16px;padding:18px 20px;backdrop-filter:blur(14px) saturate(1.3);' +
    '-webkit-backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 18px 60px rgba(0,0,0,.5);' +
    'font-family:system-ui,-apple-system,"Satoshi",sans-serif;transition:opacity .28s ease,transform .28s ease}' +
    '#eih-consent{left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto}' +
    '#eih-consent-panel{left:16px;right:16px;bottom:16px;max-width:420px;margin:0 auto}' +
    '@media(min-width:640px){#eih-consent-panel{left:auto;right:20px}}' +
    '#eih-consent p,#eih-consent-panel p{margin:0 0 14px;font-size:13px;line-height:1.6;color:#c4c9d1}' +
    '#eih-consent a,#eih-consent-panel a{color:#8a909a;text-decoration:underline}' +
    '.eih-consent-row{display:flex;gap:10px;flex-wrap:wrap}' +
    '.eih-consent-row button{flex:1 1 auto;min-height:42px;padding:.6rem 1rem;border-radius:99px;font-size:13px;' +
    'font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit}' +
    '.eih-c-all{background:linear-gradient(135deg,#6e747d,#8a909a);color:#0e0b06;border:none}' +
    '.eih-c-nec,.eih-c-custom{background:transparent;color:#c4c9d1;border:1px solid rgba(138,144,154,.32)}' +
    '.eih-consent-row button:focus-visible{outline:2px solid #8a909a;outline-offset:2px}' +
    '#eih-consent-panel h2{margin:0 0 12px;font-size:15px;font-weight:600;color:#e8ebf0}' +
    '.eih-cat{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-top:1px solid rgba(138,144,154,.14)}' +
    '.eih-cat:first-of-type{border-top:none}' +
    '.eih-cat-txt{flex:1}.eih-cat-txt strong{display:block;font-size:13px;color:#e2e5ea}' +
    '.eih-cat-txt span{display:block;font-size:12px;line-height:1.5;color:#9aa0aa;margin-top:2px}' +
    '.eih-sw{position:relative;width:40px;height:22px;flex:0 0 auto;margin-top:3px}' +
    '.eih-sw input{opacity:0;width:0;height:0;position:absolute}' +
    '.eih-sw span{position:absolute;inset:0;background:rgba(138,144,154,.3);border-radius:99px;transition:background .2s;cursor:pointer}' +
    '.eih-sw span:before{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;background:#e2e5ea;border-radius:50%;transition:transform .2s}' +
    '.eih-sw input:checked+span{background:#57c5b6}.eih-sw input:checked+span:before{transform:translateX(18px)}' +
    '.eih-sw input:disabled+span{opacity:.55;cursor:not-allowed}' +
    '#eih-consent-reopen{position:fixed;left:14px;bottom:14px;z-index:9998;width:auto;height:40px;padding:0 14px;' +
    'display:inline-flex;align-items:center;gap:7px;border-radius:99px;border:1px solid rgba(138,144,154,.3);' +
    'background:rgba(16,12,7,.85);color:#c4c9d1;font:600 12px/1 system-ui,-apple-system,sans-serif;cursor:pointer;' +
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,.35)}' +
    '#eih-consent-reopen:hover{color:#e2e5ea;border-color:rgba(138,144,154,.5)}' +
    '@media(prefers-reduced-motion:reduce){#eih-consent,#eih-consent-panel{transition:none}}';
  document.head.appendChild(style);

  var banner, panel, reopenBtn;

  function mount(el) { (document.body || document.documentElement).appendChild(el); }
  function fade(el) {
    if (!el || !el.parentNode) return;
    el.style.opacity = '0'; el.style.transform = 'translateY(12px)';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
  }

  function showReopen() {
    if (reopenBtn && reopenBtn.parentNode) return;
    reopenBtn = document.createElement('button');
    reopenBtn.id = 'eih-consent-reopen';
    reopenBtn.type = 'button';
    reopenBtn.setAttribute('aria-label', t().reopen);
    reopenBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/></svg><span>' + t().reopen + '</span>';
    reopenBtn.addEventListener('click', openPanel);
    mount(reopenBtn);
  }

  function openPanel() {
    if (panel && panel.parentNode) return;
    var L = t();
    var cur = readConsent() || { analytics: false, marketing: false };
    panel = document.createElement('div');
    panel.id = 'eih-consent-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', L.title);
    panel.innerHTML =
      '<h2>' + L.title + '</h2>' +
      cat('nec', L.nec, L.necD, true, true) +
      cat('ana', L.ana, L.anaD, cur.analytics, false) +
      cat('mkt', L.mkt, L.mktD, cur.marketing, false) +
      '<div class="eih-consent-row" style="margin-top:14px">' +
      '<button type="button" class="eih-c-all eih-p-save">' + L.save + '</button>' +
      '<button type="button" class="eih-c-nec eih-p-rej">' + L.rej + '</button>' +
      '</div>';
    panel.querySelector('.eih-p-save').addEventListener('click', function () {
      persist(panel.querySelector('#eih-sw-ana').checked, panel.querySelector('#eih-sw-mkt').checked);
      close();
    });
    panel.querySelector('.eih-p-rej').addEventListener('click', function () { persist(false, false); close(); });
    fade(banner);
    mount(panel);
  }

  function cat(id, label, desc, checked, locked) {
    return '<div class="eih-cat"><div class="eih-cat-txt"><strong>' + label + '</strong><span>' + desc + '</span></div>' +
      '<label class="eih-sw"><input type="checkbox" id="eih-sw-' + id + '"' + (checked ? ' checked' : '') + (locked ? ' disabled' : '') + '/><span></span></label></div>';
  }

  function close() { fade(panel); showReopen(); }

  function showBanner() {
    var L = t();
    banner = document.createElement('div');
    banner.id = 'eih-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', L.title);
    banner.innerHTML =
      '<p>' + L.txt + '<a href="/cookie">' + L.policy + '</a>.</p>' +
      '<div class="eih-consent-row">' +
      '<button type="button" class="eih-c-all">' + L.all + '</button>' +
      '<button type="button" class="eih-c-nec">' + L.rej + '</button>' +
      '<button type="button" class="eih-c-custom">' + L.custom + '</button>' +
      '</div>';
    banner.querySelector('.eih-c-all').addEventListener('click', function () { persist(true, true); fade(banner); showReopen(); });
    banner.querySelector('.eih-c-nec').addEventListener('click', function () { persist(false, false); fade(banner); showReopen(); });
    banner.querySelector('.eih-c-custom').addEventListener('click', openPanel);
    mount(banner);
  }

  // Public: reopen the preferences from anywhere (e.g. a link in the footer).
  window.EIH_openConsent = openPanel;

  function boot() {
    if (readConsent()) showReopen();   // already chosen → offer to change
    else showBanner();                 // first visit → ask
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
