/* Sfondo del mondo — solo home.

   Otto fotografie sotto la pagina, a bassissima opacità, che si danno il cambio
   man mano che si scorre: Sri Lanka, Italia, Sri Lanka, Italia. L'alternanza è
   il messaggio, non un ordine casuale.

   Il vincolo che comanda su tutto è che lo scorrimento non rallenti. Perciò
   questo file fa il meno possibile:

   - durante lo scorrimento non si legge il layout. Le posizioni delle sezioni
     sono misurate una volta, tutte insieme, e rilette solo quando la pagina
     cambia forma (resize, font, immagini). Chiamare getBoundingClientRect a
     ogni fotogramma su otto sezioni costringe il browser a ricalcolare il
     layout mentre disegna: è il modo classico di far scattare lo scorrimento.
   - il movimento non lo fa il JavaScript. La deriva del fondo è
     un'animazione agganciata allo scorrimento (`animation-timeline`) e la
     porta avanti il compositor: qui non si scrive nessun `transform`.
   - resta solo una classe da accendere quando cambia sezione, e gli eventi di
     scorrimento vengono accorpati in un requestAnimationFrame per fotogramma.
   - si scarica solo quello che serve. L'immagine parte quando la sua sezione è
     a un viewport e mezzo di distanza, non tutte al caricamento. Con risparmio
     dati o rete lenta non parte niente.

   Sfocatura e desaturazione stanno dentro i JPEG, non in un `filter` CSS: v.
   la nota in `assets/index.css`. */
(function () {
  'use strict';
  if (window.__eihSfondoMondo) return; window.__eihSfondoMondo = 1;
  /* La home non porta data-page: si riconosce dal suo eroe. */
  if (!document.querySelector('.hero .hero-left')) return;

  var c = navigator.connection || {};
  if (c.saveData || /^(slow-)?2g$/.test(c.effectiveType || '')) return;

  /* sezione della home  →  fotografia */
  var COPPIE = [
    ['.hero',                      'sf-1-ella-lk'],
    ['.problem-section',           'sf-2-roma-it'],
    ['.how-section',               'sf-3-pescatori-lk'],
    ['.tools-section',             'sf-4-venezia-it'],
    ['.community-teaser-section',  'sf-5-galle-lk'],
    ['.testimonials-section',      'sf-6-cinqueterre-it'],
    ['.faq-section',               'sf-7-anuradhapura-lk'],
    ['.cta-section',               'sf-8-amalfi-it']
  ];

  var scena = document.createElement('div');
  scena.id = 'sfondo-mondo';
  scena.setAttribute('aria-hidden', 'true');

  var voci = [];
  COPPIE.forEach(function (par) {
    var sez = document.querySelector(par[0]);
    if (!sez) return;
    var strato = document.createElement('div');
    strato.className = 'sm-strato';
    scena.appendChild(strato);
    voci.push({ sez: sez, strato: strato, file: par[1], caricata: false, cima: 0, alt: 0 });
  });
  if (!voci.length) return;

  var bg = document.getElementById('bg');
  if (bg && bg.parentNode) bg.parentNode.insertBefore(scena, bg.nextSibling);
  else document.body.insertBefore(scena, document.body.firstChild);

  function carica(v) {
    if (v.caricata) return; v.caricata = true;
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      v.strato.style.backgroundImage = 'url("/assets/img/' + v.file + '.jpg")';
    };
    img.src = '/assets/img/' + v.file + '.jpg';
  }

  /* Preparazione: l'immagine si scarica quando la sua sezione si avvicina. */
  if ('IntersectionObserver' in window) {
    var vicino = new IntersectionObserver(function (viste) {
      for (var i = 0; i < viste.length; i++) {
        if (!viste[i].isIntersecting) continue;
        var v = trova(viste[i].target);
        if (v) { carica(v); vicino.unobserve(viste[i].target); }
      }
    }, { rootMargin: '150% 0px' });
    voci.forEach(function (v) { vicino.observe(v.sez); });
  } else {
    voci.forEach(carica);
  }

  function trova(sez) {
    for (var i = 0; i < voci.length; i++) if (voci[i].sez === sez) return voci[i];
    return null;
  }

  /* Le misure, prese tutte in fila e mai durante lo scorrimento. */
  var altezzaVista = innerHeight;

  function misura() {
    altezzaVista = innerHeight;
    var y = pageYOffset;
    for (var i = 0; i < voci.length; i++) {
      var r = voci[i].sez.getBoundingClientRect();
      voci[i].cima = r.top + y;
      voci[i].alt = r.height;
    }
  }

  /* Quale foto sta sopra: quella la cui sezione è più vicina al centro dello
     schermo. Con l'osservatore da solo due sezioni adiacenti si accendevano
     insieme e il fondo diventava una poltiglia. */
  var attiva = null, inCoda = false, ultimoY = -1;

  function dipingi() {
    inCoda = false;
    var y = pageYOffset;
    var centro = y + altezzaVista / 2;
    var migliore = null, minDist = Infinity;

    for (var i = 0; i < voci.length; i++) {
      var v = voci[i];
      if (v.cima + v.alt < y || v.cima > y + altezzaVista) continue;
      var d = Math.abs(v.cima + v.alt / 2 - centro);
      if (d < minDist) { minDist = d; migliore = v; }
    }

    if (migliore && migliore !== attiva) {
      if (attiva) attiva.strato.classList.remove('on');
      carica(migliore);
      migliore.strato.classList.add('on');
      attiva = migliore;
    }

  }

  function alGiro() {
    if (inCoda || pageYOffset === ultimoY) return;
    ultimoY = pageYOffset;
    inCoda = true;
    requestAnimationFrame(dipingi);
  }

  function rimisura() { misura(); ultimoY = -1; alGiro(); }

  addEventListener('scroll', alGiro, { passive: true });
  addEventListener('resize', rimisura, { passive: true });
  addEventListener('load', rimisura);
  /* La home cresce mentre arrivano font e riquadri: senza questo le misure
     restano quelle del primo istante e le foto cambiano fuori tempo. */
  if ('ResizeObserver' in window) {
    var quando = 0;
    new ResizeObserver(function () {
      cancelAnimationFrame(quando);
      quando = requestAnimationFrame(rimisura);
    }).observe(document.body);
  }

  misura();
  dipingi();
})();
