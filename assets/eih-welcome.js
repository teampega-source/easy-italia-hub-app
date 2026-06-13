/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — Welcome overlay (shown once per session)
   Click "Entra" → overlay fades out, site is already beneath.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'eih-welcome-v1';

  // Skip on return visits or deep-links
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}
  if (location.hash && location.hash.length > 1) return;

  // Build overlay HTML
  var el = document.createElement('div');
  el.className = 'eih-welcome';
  el.id = 'eih-welcome';
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Benvenuto — Welcome — ආයුබෝවන්');
  el.innerHTML =
    '<div class="wlc-blob wlc-blob-1"></div>' +
    '<div class="wlc-blob wlc-blob-2"></div>' +
    '<div class="wlc-blob wlc-blob-3"></div>' +
    '<div class="wlc-inner">' +
      '<div class="wlc-globe">🌍</div>' +
      '<div class="wlc-cards">' +

        '<div class="wlc-card">' +
          '<div class="wlc-card-bg wlc-bg-it"></div>' +
          '<div class="wlc-card-body">' +
            '<span class="wlc-flag">🇮🇹</span>' +
            '<h2 class="wlc-card-title">Benvenuto</h2>' +
            '<p class="wlc-card-sub">La tua comunità,<br>la tua casa in Italia.</p>' +
          '</div>' +
        '</div>' +

        '<div class="wlc-card">' +
          '<div class="wlc-card-bg wlc-bg-en"></div>' +
          '<div class="wlc-card-body">' +
            '<span class="wlc-flag">🇬🇧</span>' +
            '<h2 class="wlc-card-title">Welcome</h2>' +
            '<p class="wlc-card-sub">Your community,<br>your home in Italy.</p>' +
          '</div>' +
        '</div>' +

        '<div class="wlc-card">' +
          '<div class="wlc-card-bg wlc-bg-si"></div>' +
          '<div class="wlc-card-body">' +
            '<span class="wlc-flag">🇱🇰</span>' +
            '<h2 class="wlc-card-title">ආයුබෝවන්</h2>' +
            '<p class="wlc-card-sub">ඔබේ ප්‍රජාව,<br>ඉතාලියේ ඔබේ නිවස.</p>' +
          '</div>' +
        '</div>' +

      '</div>' +
      '<button class="wlc-btn" id="wlc-btn" type="button">' +
        'Entra / Enter / ඇතුල් වන්න &nbsp;→' +
      '</button>' +
      '<p class="wlc-tagline">Connecting Sri Lankans Across Italy</p>' +
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
    }, 700);
  }

  document.getElementById('wlc-btn').addEventListener('click', dismiss);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') dismiss();
  });
})();
