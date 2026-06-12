/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — Intro cinematografica scroll-driven
   "Da una casa lontana → il globo → l'Italia → si accende EIH"

   - Si monta SOLO alla prima visita di sessione (sessionStorage),
     se non c'è un deep-link (#ancora) e se non è richiesto meno movimento.
   - Nessuna dipendenza: legge lo scroll nativo (compatibile con Lenis)
     e mappa il progresso 0→1 sulle scene. Solo transform/opacity.
   - Saltabile (tasto + tasto ESC). Scrubbabile in entrambe le direzioni.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'eih-intro-v1';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Condizioni per NON mostrare l'intro
  if (reduce) return;
  if (location.hash && location.hash.length > 1) return;
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}

  // ── Utility ────────────────────────────────────────────────
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // ramp: 0 fuori dal range [a,b], sale in [a,a+f], scende in [b-f,b]
  function ramp(p, a, b, f) {
    if (p <= a || p >= b) return 0;
    var up = seg(p, a, a + f), down = 1 - seg(p, b - f, b);
    return Math.min(up, down);
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // ── Costruzione DOM ────────────────────────────────────────
  var spacer = document.createElement('div');
  spacer.id = 'eih-intro-spacer';

  var intro = document.createElement('div');
  intro.className = 'eih-intro';
  intro.id = 'eih-intro';
  intro.setAttribute('aria-hidden', 'true');

  intro.innerHTML =
    '<div class="intro-space"></div>' +
    '<div class="intro-stars" id="ix-stars"></div>' +

    // ░░ SCENA 1 — Sri Lanka (alba, palme, casa, oceano) ░░
    '<div class="scene scene-lanka" id="ix-lanka"><div class="scene-stage" id="ix-lanka-cam">' +
      lankaSVG() +
    '</div></div>' +

    // ░░ SCENA 2 — Il globo ░░
    '<div class="scene scene-globe" id="ix-globe"><div class="scene-stage" id="ix-globe-cam">' +
      globeSVG() +
    '</div></div>' +

    // ░░ SCENA 3 — Italia (colline, cipressi, luce calda) ░░
    '<div class="scene scene-italy" id="ix-italy"><div class="scene-stage" id="ix-italy-cam">' +
      italySVG() +
    '</div></div>' +

    // ░░ Nuvole di transizione ░░
    '<div class="intro-clouds" id="ix-clouds">' +
      cloud(8, 18, 230) + cloud(64, 30, 300) + cloud(34, 70, 360) +
      cloud(80, 62, 260) + cloud(20, 44, 200) + cloud(50, 12, 280) +
    '</div>' +

    '<div class="intro-vignette"></div>' +

    // ░░ Didascalie ░░
    '<div class="intro-cap" id="ix-cap1"><p class="cap-kicker">Il viaggio</p>' +
      '<p class="cap-line">Da una casa<br/><em>lontana.</em></p></div>' +
    '<div class="intro-cap" id="ix-cap2"><p class="cap-kicker">Migliaia di chilometri</p>' +
      '<p class="cap-line">Oltre l’oceano,<br/>oltre il <em>cielo.</em></p></div>' +
    '<div class="intro-cap" id="ix-cap3"><p class="cap-kicker">Una nuova terra</p>' +
      '<p class="cap-line">Arrivi in <em>Italia.</em></p></div>' +

    // ░░ SCENA 4 — accensione del marchio ░░
    '<div class="scene-ignite" id="ix-ignite">' +
      '<div class="ig-glow" id="ix-glow"></div>' +
      '<div class="ig-mark">Easy <span class="accent">Italia</span> Hub</div>' +
      '<p class="ig-tag">La tua bussola nella vita italiana. Guide, AI multilingua e community — tutto in un posto.</p>' +
      '<span class="ig-enter">Scorri per entrare ' +
        '<svg viewBox="0 0 24 24"><line x1="12" y1="3" x2="12" y2="19"/><polyline points="6 13 12 19 18 13"/></svg>' +
      '</span>' +
    '</div>' +

    '<div class="intro-hint" id="ix-hint">Scorri<span class="hint-wheel"></span></div>' +
    '<button class="intro-skip" id="ix-skip" type="button">Salta intro ✕</button>';

  // Inserisci spacer + overlay all'inizio del body
  document.documentElement.classList.add('eih-intro-on');
  var first = document.body.firstChild;
  document.body.insertBefore(intro, first);
  document.body.insertBefore(spacer, intro.nextSibling);
  // L'overlay è fixed; lo spacer spinge il contenuto sotto il viaggio.

  // ── Riferimenti ────────────────────────────────────────────
  var R = {
    stars: g('ix-stars'), lanka: g('ix-lanka'), lankaCam: g('ix-lanka-cam'),
    globe: g('ix-globe'), globeCam: g('ix-globe-cam'),
    italy: g('ix-italy'), italyCam: g('ix-italy-cam'),
    clouds: g('ix-clouds'), puffs: intro.querySelectorAll('.intro-clouds .puff'),
    cap1: g('ix-cap1'), cap2: g('ix-cap2'), cap3: g('ix-cap3'),
    ignite: g('ix-ignite'), glow: g('ix-glow'), mark: intro.querySelector('.ig-mark'),
    igTag: intro.querySelector('.ig-tag'), igEnter: intro.querySelector('.ig-enter'),
    hint: g('ix-hint'), skip: g('ix-skip'),
    arc: g('ix-arc'), contin: g('ix-contin'), pinLk: g('ix-pin-lk'), pinIt: g('ix-pin-it')
  };
  function g(id) { return intro.querySelector('#' + id); }

  // ── Loop di rendering ──────────────────────────────────────
  var ticking = false, locked = false;
  function calcP() {
    var denom = spacer.offsetHeight - window.innerHeight;
    return clamp(window.scrollY / (denom > 1 ? denom : 1), 0, 1);
  }

  function render() {
    ticking = false;
    if (locked) return;
    var p = calcP();

    // Stelle: visibili nella fase globo
    setOpac(R.stars, ramp(p, 0.30, 0.80, 0.10));

    /* ── Scena 1: Sri Lanka ───────────────────────────────── */
    var lankaA = 1 - seg(p, 0.26, 0.40);
    setOpac(R.lanka, lankaA);
    // camera: si solleva e rimpicciolisce (la terra si allontana)
    var lkT = seg(p, 0, 0.40);
    setT(R.lankaCam, 'translate3d(0,' + lerp(0, -8, lkT) + '%,0) scale(' + lerp(1.06, 1.34, ease(lkT)) + ')');

    /* ── Scena 2: Globo ───────────────────────────────────── */
    var globeA = ramp(p, 0.30, 0.74, 0.10);
    setOpac(R.globe, globeA);
    var gT = seg(p, 0.30, 0.74);
    // avviciniamo: il globo cresce mentre "scendiamo" verso l'Europa
    var gScale = lerp(0.78, 2.15, ease(gT));
    var gY = lerp(2, -4, gT);
    setT(R.globeCam, 'translate3d(0,' + gY + '%,0) scale(' + gScale + ')');
    // rotazione dei continenti: dall'Asia meridionale verso il Mediterraneo
    // (transform SVG via attributo: origine in user-space, max compatibilità)
    if (R.contin) R.contin.setAttribute('transform', 'rotate(' + lerp(8, -46, ease(gT)).toFixed(2) + ' 300 300)');
    // arco del viaggio che si traccia
    if (R.arc) {
      var len = 760;
      R.arc.style.strokeDashoffset = String(len * (1 - seg(p, 0.34, 0.64)));
    }
    if (R.pinLk) setOpac(R.pinLk, 1 - seg(p, 0.40, 0.55));
    if (R.pinIt) setOpac(R.pinIt, seg(p, 0.52, 0.66));

    /* ── Scena 3: Italia ──────────────────────────────────── */
    var italyA = ramp(p, 0.68, 0.985, 0.09);
    setOpac(R.italy, italyA);
    var itT = seg(p, 0.68, 0.96);
    // scendiamo sulle colline: da molto vicino/alto a vista d'orizzonte
    setT(R.italyCam, 'translate3d(0,' + lerp(-6, 0, ease(itT)) + '%,0) scale(' + lerp(1.5, 1.0, ease(itT)) + ')');

    /* ── Nuvole nelle due transizioni ─────────────────────── */
    var cloudA = Math.max(ramp(p, 0.24, 0.46, 0.06), ramp(p, 0.62, 0.84, 0.06));
    setOpac(R.clouds, cloudA);
    for (var i = 0; i < R.puffs.length; i++) {
      var dir = i % 2 ? 1 : -1;
      var drift = (p * 2600 * (0.5 + (i % 3) * 0.32)) % 2600;
      setT(R.puffs[i], 'translate3d(' + (dir * (drift - 1300)) + 'px,0,0)');
    }

    /* ── Didascalie ───────────────────────────────────────── */
    cap(R.cap1, ramp(p, 0.02, 0.26, 0.06));
    cap(R.cap2, ramp(p, 0.40, 0.62, 0.06));
    cap(R.cap3, ramp(p, 0.70, 0.88, 0.06));

    /* ── Scena 4: accensione marchio ──────────────────────── */
    var igA = seg(p, 0.88, 0.995);
    setOpac(R.ignite, igA);
    setOpac(R.glow, ease(igA));
    if (R.mark) {
      var glowPx = lerp(0, 70, igA);
      R.mark.style.transform = 'scale(' + lerp(0.86, 1, ease(igA)) + ')';
      R.mark.style.textShadow = '0 0 ' + glowPx + 'px rgba(243,201,122,' + (0.65 * igA) + ')';
    }
    setOpac(R.igTag, seg(p, 0.93, 1));
    setOpac(R.igEnter, seg(p, 0.965, 1));
    if (R.glow) R.glow.style.transform = 'scale(' + lerp(0.7, 1.1, ease(igA)) + ')';

    /* ── Hint scroll iniziale ─────────────────────────────── */
    setOpac(R.hint, (1 - seg(p, 0.02, 0.08)) * (p < 0.08 ? 1 : 0));

    /* ── Fine del viaggio: entra in home ──────────────────── */
    if (p >= 0.995) complete(false);
  }

  function setOpac(el, v) { if (el) el.style.opacity = v; }
  function setT(el, t, origin) { if (!el) return; el.style.transform = t; if (origin) el.style.transformOrigin = origin; }
  function cap(el, a) {
    if (!el) return;
    el.style.opacity = a;
    el.style.transform = 'translate3d(0,' + lerp(26, 0, Math.min(1, a * 1.4)) + 'px,0)';
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

  // ── Conclusione: dissolvi overlay ed entra in home ─────────
  // Sia il completamento naturale (scroll fino in fondo) sia "Salta"
  // portano alla home in cima: rimuoviamo lo spacer e azzeriamo lo scroll
  // sotto la copertura della dissolvenza, così l'ingaggio è pulito.
  function complete() {
    if (locked) return;
    locked = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    intro.style.transition = 'opacity .6s ease';
    intro.style.opacity = '0';
    intro.style.pointerEvents = 'none';
    // dietro la dissolvenza: home in cima, via lo spacer
    window.scrollTo(0, 0);
    if (spacer.parentNode) spacer.parentNode.removeChild(spacer);
    document.documentElement.classList.remove('eih-intro-on');
    setTimeout(function () {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      if (window.ScrollTrigger) { try { window.ScrollTrigger.refresh(); } catch (e) {} }
    }, 650);
  }

  R.skip.addEventListener('click', complete);
  document.addEventListener('keydown', function (e) {
    if (!locked && e.key === 'Escape') complete();
  });

  // ── Avvio ──────────────────────────────────────────────────
  window.scrollTo(0, 0);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  setTimeout(function () { window.scrollTo(0, 0); render(); }, 60);
  setTimeout(function () { if (!locked) setOpac(R.hint, 1); }, 900);

  // ═══════════════════════════════════════════════════════════
  //  Scene SVG (vettoriali, leggere, dark-friendly)
  // ═══════════════════════════════════════════════════════════
  function cloud(x, y, s) {
    return '<div class="puff" style="left:' + x + '%;top:' + y + '%;width:' + s + 'px;height:' + (s * 0.62) + 'px;margin:-' + (s * 0.31) + 'px 0 0 -' + (s / 2) + 'px"></div>';
  }

  function lankaSVG() {
    return '' +
'<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
  '<defs>' +
    '<linearGradient id="lkSky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f9c976"/><stop offset="38%" stop-color="#f4a25f"/>' +
      '<stop offset="68%" stop-color="#d9737a"/><stop offset="100%" stop-color="#5b4e86"/>' +
    '</linearGradient>' +
    '<radialGradient id="lkSun" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#fff4d6"/><stop offset="45%" stop-color="#ffd98a"/>' +
      '<stop offset="100%" stop-color="#ffd98a00"/></radialGradient>' +
    '<linearGradient id="lkSea" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#caa6a0"/><stop offset="40%" stop-color="#3f8e9c"/>' +
      '<stop offset="100%" stop-color="#16414f"/></linearGradient>' +
  '</defs>' +
  '<rect width="1280" height="720" fill="url(#lkSky)"/>' +
  '<circle cx="640" cy="318" r="150" fill="url(#lkSun)"/>' +
  '<circle cx="640" cy="318" r="62" fill="#fff1cf"/>' +
  // mare
  '<rect y="430" width="1280" height="290" fill="url(#lkSea)"/>' +
  '<path d="M0 432 Q 320 446 640 432 T 1280 432 V720 H0Z" fill="#2f7886" opacity=".55"/>' +
  // riflesso del sole sul mare
  '<path d="M600 432 H680 L702 720 H578Z" fill="#ffe6ad" opacity=".35"/>' +
  // spiaggia/terra in primo piano
  '<path d="M0 612 Q 360 568 760 600 Q 1040 622 1280 590 V720 H0Z" fill="#2a2118"/>' +
  '<path d="M0 612 Q 360 568 760 600 Q 1040 622 1280 590 V650 Q 700 628 0 660Z" fill="#3a2c1e"/>' +
  // casetta con tetto in terracotta
  '<g transform="translate(190 540)">' +
    '<rect x="-46" y="-34" width="92" height="60" fill="#2c241c"/>' +
    '<path d="M-58 -34 L0 -74 L58 -34Z" fill="#b8643a"/>' +
    '<rect x="-12" y="-6" width="24" height="32" fill="#1a140e"/>' +
    '<rect x="22" y="-22" width="16" height="16" fill="#f6c976" opacity=".8"/>' +
  '</g>' +
  // palme silhouette
  palm(940, 600, 1) + palm(1080, 612, 0.82) + palm(1015, 606, 0.62) +
  palm(70, 606, 0.7) +
  '</svg>';
  }
  function palm(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#19120c">' +
      '<path d="M-6 0 C -10 -90 -6 -150 2 -196 C 6 -150 8 -90 6 0Z"/>' +
      '<g stroke="#19120c" stroke-width="9" fill="none" stroke-linecap="round">' +
        '<path d="M0 -196 C -50 -214 -104 -210 -150 -180"/>' +
        '<path d="M0 -196 C 50 -214 104 -210 150 -180"/>' +
        '<path d="M0 -196 C -36 -244 -78 -270 -128 -284"/>' +
        '<path d="M0 -196 C 36 -244 78 -270 128 -284"/>' +
        '<path d="M0 -196 C -8 -250 -6 -300 4 -340"/>' +
      '</g></g>';
  }

  function globeSVG() {
    return '' +
'<svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
  '<defs>' +
    '<radialGradient id="gbAtm" cx="50%" cy="50%" r="50%">' +
      '<stop offset="76%" stop-color="#6fb7ff00"/><stop offset="90%" stop-color="#6fb7ff55"/>' +
      '<stop offset="100%" stop-color="#6fb7ff00"/></radialGradient>' +
    '<radialGradient id="gbSea" cx="38%" cy="34%" r="72%">' +
      '<stop offset="0" stop-color="#2b6fb0"/><stop offset="55%" stop-color="#15457f"/>' +
      '<stop offset="100%" stop-color="#07203f"/></radialGradient>' +
    '<radialGradient id="gbTerm" cx="50%" cy="50%" r="50%">' +
      '<stop offset="55%" stop-color="#00000000"/><stop offset="100%" stop-color="#020812cc"/></radialGradient>' +
    '<filter id="gbSoft"><feGaussianBlur stdDeviation="2.4"/></filter>' +
  '</defs>' +
  '<circle cx="300" cy="300" r="290" fill="url(#gbAtm)"/>' +
  '<clipPath id="gbClip"><circle cx="300" cy="300" r="252"/></clipPath>' +
  '<g clip-path="url(#gbClip)">' +
    '<circle cx="300" cy="300" r="252" fill="url(#gbSea)"/>' +
    // continenti stilizzati (ruotano col viaggio)
    '<g id="ix-contin" filter="url(#gbSoft)" fill="#7f9461" opacity=".92">' +
      // Africa
      '<path d="M250 250 q40 -30 70 -6 q24 18 14 56 q-6 40 -34 70 q-20 22 -30 56 q-10 -34 -26 -60 q-22 -34 -10 -78 q8 -30 22 -38Z"/>' +
      // Arabia + Asia sud
      '<path d="M338 226 q44 -14 78 6 q26 16 18 40 q-12 26 -50 30 q-40 6 -66 -16 q-18 -18 -8 -40 q10 -20 28 -20Z"/>' +
      // India / penisola
      '<path d="M392 286 q22 6 24 30 q2 26 -18 40 q-14 -22 -18 -44 q-4 -18 12 -26Z"/>' +
      // Europa
      '<path d="M276 196 q40 -22 74 -8 q-6 24 -34 32 q-26 8 -48 0 q-12 -8 8 -24Z"/>' +
      // penisola italiana (accento)
      '<path d="M300 214 q8 0 9 14 q1 14 -8 24 q-7 -10 -8 -22 q-1 -12 7 -16Z" fill="#9bb06f"/>' +
    '</g>' +
    // arco del viaggio Sri Lanka -> Italia
    '<path id="ix-arc" d="M404 330 Q 330 150 296 218" fill="none" stroke="#ffd98a" stroke-width="3" ' +
      'stroke-linecap="round" stroke-dasharray="760" stroke-dashoffset="760" opacity=".9"/>' +
    // pin Sri Lanka
    '<g id="ix-pin-lk"><circle cx="404" cy="330" r="6" fill="#ffd98a"/>' +
      '<circle cx="404" cy="330" r="12" fill="none" stroke="#ffd98a" stroke-width="2" opacity=".6"/></g>' +
    // pin Italia
    '<g id="ix-pin-it" opacity="0"><circle cx="296" cy="218" r="6" fill="#eb5939"/>' +
      '<circle cx="296" cy="218" r="12" fill="none" stroke="#eb5939" stroke-width="2" opacity=".7"/></g>' +
    '<circle cx="300" cy="300" r="252" fill="url(#gbTerm)"/>' +
  '</g>' +
  '<circle cx="300" cy="300" r="252" fill="none" stroke="#bfe0ff" stroke-width="1.5" opacity=".35"/>' +
'</svg>';
  }

  function italySVG() {
    return '' +
'<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
  '<defs>' +
    '<linearGradient id="itSky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#bfe0f2"/><stop offset="44%" stop-color="#eed6b0"/>' +
      '<stop offset="100%" stop-color="#f4cf94"/></linearGradient>' +
    '<linearGradient id="itHill1" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#7fa05a"/><stop offset="100%" stop-color="#5b7e42"/></linearGradient>' +
    '<linearGradient id="itHill2" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#9bb56b"/><stop offset="100%" stop-color="#7a9a52"/></linearGradient>' +
    '<radialGradient id="itSun" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#fff6dd"/><stop offset="60%" stop-color="#ffe7b0"/>' +
      '<stop offset="100%" stop-color="#ffe7b000"/></radialGradient>' +
  '</defs>' +
  '<rect width="1280" height="720" fill="url(#itSky)"/>' +
  '<circle cx="930" cy="210" r="170" fill="url(#itSun)"/>' +
  '<circle cx="930" cy="210" r="58" fill="#fff4d4"/>' +
  // colline lontane
  '<path d="M0 430 Q 300 360 640 408 Q 980 452 1280 392 V720 H0Z" fill="url(#itHill2)" opacity=".85"/>' +
  // colline vicine
  '<path d="M0 520 Q 360 452 760 512 Q 1040 552 1280 500 V720 H0Z" fill="url(#itHill1)"/>' +
  // filari di vigna (linee)
  '<g stroke="#46673180" stroke-width="3">' +
    '<path d="M120 560 L300 620"/><path d="M260 552 L440 614"/><path d="M400 548 L580 610"/>' +
    '<path d="M560 556 L740 616"/><path d="M720 566 L900 622"/>' +
  '</g>' +
  // cipressi
  cypress(180, 520, 1) + cypress(250, 524, 0.8) + cypress(1040, 506, 1.05) + cypress(1100, 512, 0.78) +
  // casolare toscano
  '<g transform="translate(620 470)">' +
    '<rect x="-54" y="-44" width="108" height="74" fill="#caa46f"/>' +
    '<rect x="-54" y="-44" width="108" height="16" fill="#b07d4a"/>' +
    '<path d="M-64 -44 L0 -78 L64 -44Z" fill="#8a4f33"/>' +
    '<rect x="-34" y="-18" width="18" height="22" fill="#5d4a33"/>' +
    '<rect x="14" y="-18" width="18" height="22" fill="#f3d27e" opacity=".85"/>' +
    '<rect x="-10" y="2" width="22" height="28" fill="#3c2f20"/>' +
  '</g>' +
'</svg>';
  }
  function cypress(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M0 0 C -14 -10 -16 -70 -8 -120 C -4 -150 0 -168 0 -168 C 0 -168 4 -150 8 -120 C 16 -70 14 -10 0 0Z" fill="#3f5b34"/>' +
      '<rect x="-3" y="-4" width="6" height="16" fill="#5a4326"/></g>';
  }
})();
