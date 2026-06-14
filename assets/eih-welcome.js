/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — Welcome overlay
   Mostra assets/img/welcome.png; click su "Entra" → fade-out.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'eih-welcome-v1';

  // Skip on return visits or deep-links
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}
  if (location.hash && location.hash.length > 1) return;

  // Build overlay
  var el = document.createElement('div');
  el.className = 'eih-welcome';
  el.id = 'eih-welcome';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Benvenuto — clicca Entra per accedere');

  el.innerHTML =
    '<div class="wlc-img-wrap">' +
      '<img src="/assets/img/welcome.png"' +
           ' alt="Benvenuto — Welcome — ආයුබෝවන්"' +
           ' draggable="false">' +
      '<div class="wlc-btn-hit" id="wlc-btn" role="button" tabindex="0"' +
           ' aria-label="Entra"></div>' +
    '</div>';

  document.documentElement.classList.add('eih-wlc-on');
  document.body.insertBefore(el, document.body.firstChild);
  window.scrollTo(0, 0);

  // Dismiss: fade out → remove
  var gone = false;
  function dismiss() {
    if (gone) return;
    gone = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    el.classList.add('is-leaving');
    document.documentElement.classList.remove('eih-wlc-on');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 600);
  }

  document.getElementById('wlc-btn').addEventListener('click', dismiss);
  document.getElementById('wlc-btn').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') dismiss();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') dismiss();
  });
})();
