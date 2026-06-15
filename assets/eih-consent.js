/* ─────────────────────────────────────────────────────────────
   Easy Italia Hub — cookie/consent banner (eih-consent.js)
   Zero-dependency, self-contained. Shown once per device until the
   user makes a choice (stored in localStorage 'eih-cookie-consent').

   The site currently uses ONLY necessary local storage (language,
   journey progress, auth session) — no analytics/tracking. The banner
   is the good-faith GDPR notice promised on cookie.html: it informs,
   links to the full policy, and records the choice. If/when analytics
   are added, gate them behind window.EIH_CONSENT.analytics === true.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var KEY = 'eih-cookie-consent';

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked → show banner */ }

  // Expose current state for future analytics gating.
  window.EIH_CONSENT = { value: saved, analytics: saved === 'all' };
  if (saved === 'all' || saved === 'necessary') return; // already chosen → nothing to show

  function save(choice) {
    try { localStorage.setItem(KEY, choice); } catch (e) { /* ignore */ }
    window.EIH_CONSENT = { value: choice, analytics: choice === 'all' };
    if (banner && banner.parentNode) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(12px)';
      setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 280);
    }
  }

  var style = document.createElement('style');
  style.textContent =
    '#eih-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;' +
    'margin:0 auto;background:rgba(16,12,7,.94);color:#e8dcc8;border:1px solid rgba(200,169,110,.22);' +
    'border-radius:16px;padding:18px 20px;backdrop-filter:blur(14px) saturate(1.3);' +
    '-webkit-backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 18px 60px rgba(0,0,0,.5);' +
    'font-family:system-ui,-apple-system,"Satoshi",sans-serif;transition:opacity .28s ease,transform .28s ease}' +
    '#eih-consent p{margin:0 0 14px;font-size:13px;line-height:1.6;color:#cbbfa6}' +
    '#eih-consent a{color:#c8a96e;text-decoration:underline}' +
    '#eih-consent .eih-consent-row{display:flex;gap:10px;flex-wrap:wrap}' +
    '#eih-consent button{flex:1 1 auto;min-height:42px;padding:.6rem 1.1rem;border-radius:99px;' +
    'font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit}' +
    '#eih-consent .eih-c-all{background:linear-gradient(135deg,#b8945a,#c8a96e);color:#0e0b06;border:none}' +
    '#eih-consent .eih-c-nec{background:transparent;color:#cbbfa6;border:1px solid rgba(200,169,110,.32)}' +
    '#eih-consent button:focus-visible{outline:2px solid #c8a96e;outline-offset:2px}' +
    '@media(prefers-reduced-motion:reduce){#eih-consent{transition:none}}';
  document.head.appendChild(style);

  var banner = document.createElement('div');
  banner.id = 'eih-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Avviso cookie');
  banner.innerHTML =
    '<p>Usiamo solo cookie tecnici necessari (lingua, sessione, progresso del percorso). ' +
    'Nessun tracciamento pubblicitario. Dettagli nella <a href="/cookie.html">Cookie Policy</a>.</p>' +
    '<div class="eih-consent-row">' +
    '<button type="button" class="eih-c-all">Accetta tutto</button>' +
    '<button type="button" class="eih-c-nec">Solo necessari</button>' +
    '</div>';
  banner.querySelector('.eih-c-all').addEventListener('click', function () { save('all'); });
  banner.querySelector('.eih-c-nec').addEventListener('click', function () { save('necessary'); });

  function mount() { (document.body || document.documentElement).appendChild(banner); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
