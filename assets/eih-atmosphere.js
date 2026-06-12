/* Easy Italia Hub — Atmosphere v2 (runtime).
   Costruisce i layer di profondità via JS (zero markup richiesto nelle pagine),
   poi anima in un unico requestAnimationFrame: parallasse scroll differenziata
   per layer + reattività al mouse con interpolazione (lerp).
   I keyframe CSS di "respiro" vivono sugli orb; il parallasse va sul wrapper,
   così i transform non si pestano. Solo transform/opacity: GPU, 60fps.
   Si disattiva con prefers-reduced-motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // wrapper(depth, mouse) -> orb animato dentro; ring/dust senza keyframe di moto
  function W(cls, depth, mouse, inner) {
    return '<div class="atmo-l" data-depth="' + depth + '" data-mouse="' + mouse + '">' +
           (inner || '<div class="' + cls + '"></div>') + '</div>';
  }
  var atmo = document.createElement('div');
  atmo.className = 'atmo';
  atmo.setAttribute('aria-hidden', 'true');
  atmo.innerHTML =
    W('atmo-orb atmo-o1', 14, 10) +
    W('atmo-orb atmo-o2', 22, 14) +
    W('atmo-orb atmo-o3', 34, 20) +
    '<div class="atmo-orb atmo-warm" id="atmo-warm"></div>' +
    W('atmo-ring atmo-r1', 42, 26) +
    W('atmo-ring atmo-r2', 58, 34) +
    W('atmo-ring atmo-r3', 48, 22) +
    '<div class="atmo-beam"></div>' +
    '<div class="atmo-grid"></div>' +
    W('atmo-dust', 66, 0) +
    W('atmo-dust2', 80, 0);

  function mount() {
    var bg = document.getElementById('bg');
    if (bg && bg.parentNode) bg.parentNode.insertBefore(atmo, bg.nextSibling);
    else document.body.insertBefore(atmo, document.body.firstChild);
    if (!reduce) start();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  function start() {
    var layers = [];
    atmo.querySelectorAll('.atmo-l').forEach(function (el) {
      layers.push({
        el: el,
        depth: parseFloat(el.dataset.depth) / 100, // quota parallasse scroll
        mouse: parseFloat(el.dataset.mouse) || 0   // ampiezza reazione mouse (px)
      });
    });

    // mouse: target -> lerp con inerzia (solo puntatori fini, niente touch)
    var mx = 0, my = 0, cx = 0, cy = 0;
    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('mousemove', function (e) {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1..1
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    var lastY = -1, lastCx = 9;
    function frame() {
      var y = window.scrollY || 0;
      cx += (mx - cx) * 0.045;
      cy += (my - cy) * 0.045;
      if (y !== lastY || Math.abs(cx - lastCx) > 0.0005) {
        lastY = y; lastCx = cx;
        for (var i = 0; i < layers.length; i++) {
          var L = layers[i];
          L.el.style.transform = 'translate3d(' + (cx * L.mouse) + 'px,' +
            (-y * L.depth * 0.22 + cy * L.mouse * 0.7) + 'px,0)';
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // crossfade cromatico cinematico: l'orb "caldo" si accende verso la CTA (home)
    if (window.gsap && window.ScrollTrigger && document.querySelector('.hero')) {
      var warm = document.getElementById('atmo-warm');
      var cta = document.querySelector('.cta-section');
      if (warm && cta) {
        gsap.fromTo(warm, { opacity: 0 }, {
          opacity: 0.8, ease: 'none',
          scrollTrigger: { trigger: cta, start: 'top 90%', end: 'top 30%', scrub: true }
        });
      }
    }
  }
})();
