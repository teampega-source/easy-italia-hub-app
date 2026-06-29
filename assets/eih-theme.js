/* Easy Italia Hub — toggle tema chiaro/scuro.
   Lo stato iniziale è applicato da uno snippet inline nel <head> (anti-flash);
   qui vivono il pulsante, la persistenza e il meta theme-color. */
(function () {
  'use strict';
  var KEY = 'eih-theme';

  function current() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }
  function syncMeta() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', current() === 'dark' ? '#1a1815' : '#8a909a');
  }
  function set(theme) {
    var root = document.documentElement;
    root.classList.add('theme-anim');
    if (theme === 'dark') root.dataset.theme = 'dark';
    else delete root.dataset.theme;
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    syncMeta();
    setTimeout(function () { root.classList.remove('theme-anim'); }, 350);
  }

  var fab = document.createElement('button');
  fab.id = 'eiht-fab';
  fab.setAttribute('aria-label', 'Cambia tema chiaro/scuro');
  fab.title = 'Tema chiaro/scuro';
  fab.innerHTML =
    '<svg class="moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
    '<svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  fab.addEventListener('click', function () { set(current() === 'dark' ? 'light' : 'dark'); });

  function mount() { document.body.appendChild(fab); syncMeta(); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
