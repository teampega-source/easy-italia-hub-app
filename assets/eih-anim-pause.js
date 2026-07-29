/* eih-anim-pause.js — mette in pausa le animazioni infinite quando l'elemento
   esce dallo schermo.

   Caroselli, bagliori e sfondi animati giravano anche quando nessuno li
   vedeva: il browser continuava a ricomporre la pagina a ogni fotogramma e
   lo scorrimento ne usciva a scatti. Qui restano identici quando sono in
   vista e costano zero quando non lo sono. */
(function () {
  'use strict';
  if (window.__eihAnimPause || !('IntersectionObserver' in window)) return;
  window.__eihAnimPause = true;

  var CLASSE = 'eih-anim-off';

  var st = document.createElement('style');
  st.textContent = '.' + CLASSE + ',.' + CLASSE + ' *{animation-play-state:paused !important}';
  document.head.appendChild(st);

  var osservatore = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      v.target.classList.toggle(CLASSE, !v.isIntersecting);
    });
  }, { rootMargin: '150px 0px' });   // riparte poco prima di entrare in vista

  function infinita(el) {
    var s = getComputedStyle(el);
    if (!s.animationName || s.animationName === 'none') return false;
    return s.animationIterationCount.split(',').some(function (c) {
      return c.trim() === 'infinite';
    });
  }

  var visti = [];

  function scansiona() {
    var tutti = document.querySelectorAll('body *');
    for (var i = 0; i < tutti.length; i++) {
      var el = tutti[i];
      if (visti.indexOf(el) !== -1) continue;
      // Gli elementi fissi sono sempre in vista: osservarli non serve.
      if (getComputedStyle(el).position === 'fixed') continue;
      if (!infinita(el)) continue;
      visti.push(el);
      osservatore.observe(el);
    }
  }

  function avvia() {
    scansiona();
    // Parte del contenuto arriva dopo (nav e footer iniettati, liste caricate).
    setTimeout(scansiona, 1200);
    setTimeout(scansiona, 3000);
  }

  if (document.readyState === 'complete') avvia();
  else addEventListener('load', avvia);
})();
