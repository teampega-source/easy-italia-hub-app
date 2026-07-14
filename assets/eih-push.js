/* Easy Italia Hub — notifiche Web Push (native).
   Si attiva solo se: browser compatibile + backend configurato con VAPID +
   utente loggato. Inserisce il pulsante "Attiva notifiche push" nella
   .remind-bar della Dashboard; l'abbonamento è salvato in push_subscriptions
   (RLS: solo il proprietario). Degrada in silenzio in ogni altro caso. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

  function b64ToU8(b64) {
    var pad = '='.repeat((4 - (b64.length % 4)) % 4);
    var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function init() {
    var bar = document.querySelector('[data-page="dashboard"] .remind-bar');
    if (!bar || !window.EIH_AUTH) return;

    Promise.all([
      fetch('/api/config').then(function (r) { return r.json(); }).catch(function () { return {}; }),
      EIH_AUTH.ready.then(function () { return EIH_AUTH.getUser(); }).catch(function () { return null; }),
    ]).then(function (rs) {
      var cfg = rs[0] || {}, user = rs[1];
      var sb = EIH_AUTH.client && EIH_AUTH.client();
      if (!cfg.vapidPublicKey || !sb || !user || !user.id) return; // requisiti mancanti → niente UI

      var row = document.createElement('div');
      row.className = 'remind-bar';
      row.style.cssText = 'margin-top:.9rem;border-top:1px solid var(--border);padding-top:.9rem';
      row.innerHTML = '<p style="font-size:var(--text-sm);color:var(--fg-secondary);margin:0;flex:1;min-width:200px">' +
        'Notifiche <strong>push</strong>: un avviso sul telefono quando una scadenza si avvicina, anche a sito chiuso.</p>' +
        '<button type="button" class="btn-ghost" id="push-btn">🔔 Attiva notifiche push</button>' +
        '<span class="remind-status off" id="push-status"></span>';
      bar.parentNode.insertBefore(row, bar.nextSibling);

      var btn = document.getElementById('push-btn');
      var st = document.getElementById('push-status');

      function setOn() {
        btn.textContent = '🔕 Disattiva su questo dispositivo';
        st.textContent = '✓ Attive';
        st.className = 'remind-status ok';
      }
      function setOff() {
        btn.textContent = '🔔 Attiva notifiche push';
        st.textContent = '';
        st.className = 'remind-status off';
      }

      navigator.serviceWorker.ready.then(function (reg) {
        reg.pushManager.getSubscription().then(function (sub) { if (sub) setOn(); });

        btn.addEventListener('click', function () {
          btn.disabled = true;
          reg.pushManager.getSubscription().then(function (existing) {
            if (existing) {
              // disattivazione: rimuovi da DB e annulla l'abbonamento
              return sb.from('push_subscriptions').delete().eq('endpoint', existing.endpoint)
                .then(function () { return existing.unsubscribe(); })
                .then(function () { setOff(); btn.disabled = false; });
            }
            return Notification.requestPermission().then(function (perm) {
              if (perm !== 'granted') {
                st.textContent = 'Bloccate dal browser';
                st.className = 'remind-status denied';
                btn.disabled = false;
                return;
              }
              return reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: b64ToU8(cfg.vapidPublicKey),
              }).then(function (sub) {
                var j = sub.toJSON();
                return sb.from('push_subscriptions').insert({
                  user_id: user.id, endpoint: sub.endpoint,
                  p256dh: j.keys.p256dh, auth: j.keys.auth,
                }).then(function (res) {
                  if (res.error && res.error.code !== '23505') throw res.error; // 23505 = già registrato
                  setOn(); btn.disabled = false;
                });
              });
            });
          }).catch(function () {
            st.textContent = 'Attivazione non riuscita, riprova';
            st.className = 'remind-status denied';
            btn.disabled = false;
          });
        });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
