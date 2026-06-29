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
    'background:linear-gradient(90deg,var(--gold,#7e848e),var(--coral,#7c828c));' +
    'transform-origin:0 50%;transform:scaleX(0);z-index:9999;pointer-events:none}' +
    '.kw{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em}' +
    '.kwi{display:inline-block;will-change:transform}';
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
  // Tipografia cinetica: titoli sezione spezzati in parole rivelate in cascata.
  // I titoli usano data-i18n-html (il cambio lingua riscrive l'innerHTML):
  // un MutationObserver ri-spezza il testo dopo ogni traduzione.
  var KIN_SEL = '.features .section-title, #faq-heading, .cta-title, #how-heading, #preview-heading, #testimonials-heading, #mission-heading, #roadmap-heading';

  function splitWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    }
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var outer = document.createElement('span'); outer.className = 'kw';
        var inner = document.createElement('span'); inner.className = 'kwi';
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return el.querySelectorAll('.kwi');
  }

  function kineticize(el, animate) {
    el.__kin = true;
    el.classList.add('in'); // prende il posto del reveal IO sul contenitore
    var words = splitWords(el);
    if (animate && words.length) {
      gsap.set(words, { yPercent: 115 });
      gsap.to(words, {
        yPercent: 0, duration: 0.95, ease: 'expo.out', stagger: 0.055,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    }
    setTimeout(function () { el.__kin = false; }, 0);
  }

  function initKineticHeadings() {
    gsap.utils.toArray(KIN_SEL).forEach(function (el) {
      kineticize(el, true);
      var mo = new MutationObserver(function () {
        if (el.__kin) return;
        kineticize(el, false); // dopo un cambio lingua: ri-spezza, subito visibile
        mo.takeRecords();
      });
      mo.observe(el, { childList: true, subtree: true });
    });
  }

  // Marquee reattivo: la velocità di scroll accelera lo scorrimento dei temi
  function initMarqueeVelocity() {
    var track = document.querySelector('.marquee-track');
    if (!(track && track.getAnimations)) return;
    lenis.on('scroll', function () {
      var anim = track.getAnimations()[0];
      if (anim) anim.playbackRate = Math.min(4, 1 + Math.abs(lenis.velocity) * 0.10);
    });
  }

  // Profondità: le immagini dentro le card hero scorrono nella loro maschera
  function initCardImageParallax() {
    gsap.utils.toArray('.hero-right .card-img img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6, scale: 1.15 }, {
        yPercent: 6, scale: 1.15, ease: 'none',
        scrollTrigger: { trigger: img.closest('.card'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  function initAll() {
    initHeroParallax();
    initKineticHeadings();
    initMarqueeVelocity();
    initCardImageParallax();
    ScrollTrigger.refresh();
  }
  if (document.readyState === 'complete') setTimeout(initAll, 1300);
  else window.addEventListener('load', function () { setTimeout(initAll, 1300); });
})();
