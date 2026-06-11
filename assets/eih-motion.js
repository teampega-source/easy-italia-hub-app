/* Easy Italia Hub — premium motion layer (Lenis smooth scroll + GSAP ScrollTrigger).
   Progressive enhancement: si disattiva con prefers-reduced-motion o se le librerie mancano. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!(window.Lenis && window.gsap && window.ScrollTrigger)) return;

  gsap.registerPlugin(ScrollTrigger);

  var style = document.createElement('style');
  style.textContent =
    'html.has-lenis{scroll-behavior:auto}' +
    '#eih-progress{position:fixed;top:0;left:0;right:0;height:2px;' +
    'background:linear-gradient(90deg,var(--gold,#7c7059),var(--coral,#eb5939));' +
    'transform-origin:0 50%;transform:scaleX(0);z-index:9999;pointer-events:none}';
  document.head.appendChild(style);
  document.documentElement.classList.add('has-lenis');

  var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);

  // Ancore interne via Lenis (compensa l'header fisso)
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length > 1) {
        var el = document.querySelector(id);
        if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -72 }); }
      }
    });
  });

  // Barra di avanzamento lettura
  var bar = document.createElement('div');
  bar.id = 'eih-progress';
  document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // Parallasse hero allo scroll. Le animazioni CSS d'ingresso usano fill-mode:both
  // e vincerebbero sui transform inline di GSAP: vanno azzerate a ingresso finito.
  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var left = document.querySelector('.hero-left');
    var right = document.querySelector('.hero-right');
    [left, right].forEach(function (el) { if (el) el.style.animation = 'none'; });
    if (left) {
      gsap.to(left, {
        yPercent: -12, autoAlpha: 0.3, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
    gsap.utils.toArray('.hero-right .card').forEach(function (card, i) {
      gsap.to(card, {
        yPercent: -(5 + i * 3.5), ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }
  if (document.readyState === 'complete') setTimeout(initHeroParallax, 1300);
  else window.addEventListener('load', function () { setTimeout(initHeroParallax, 1300); });
})();
