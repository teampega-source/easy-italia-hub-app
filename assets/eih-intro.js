/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — Intro cinematografica scroll-driven
   "Da una casa lontana → il globo → l'Italia → si accende EIH"

   - Si monta SOLO alla prima visita di sessione (sessionStorage),
     se non c'è un deep-link (#ancora) e se non è richiesto meno movimento.
   - Nessuna dipendenza: legge lo scroll nativo (compatibile con Lenis)
     e mappa il progresso 0→1 sulle scene. Solo transform/opacity.
   - Saltabile (click + tasto ESC). Scrubbabile in entrambe le direzioni.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'eih-intro-v1';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) return;
  if (location.hash && location.hash.length > 1) return;
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}

  // Immagini fotorealistiche generate da Higgsfield (CDN permesso da CSP img-src *.cloudfront.net)
  var IMG_LANKA = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EeaOppzppfYiZU22fyGRIqU1ot/hf_20260612_210731_f3290f4d-1a0f-4865-a27e-2d13aa31920a.png';
  var IMG_GLOBE = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EeaOppzppfYiZU22fyGRIqU1ot/hf_20260612_214658_726fa8cf-c5c8-4b0f-ab28-de84435b4a30.png';
  var IMG_ITALY = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EeaOppzppfYiZU22fyGRIqU1ot/hf_20260612_214700_f1fffb04-b1dc-4f5f-b9c8-95e57b4c63ea.png';

  // ── Localizzazione (stessa chiave del resto del sito: localStorage 'eih-lang') ──
  var lang = (function () { try { return localStorage.getItem('eih-lang'); } catch (e) { return null; } }) ();
  var DICT = {
    it: { k1: 'Il viaggio',            l1: 'Da una casa<br/><em>lontana.</em>',
          k2: 'Migliaia di chilometri', l2: 'Oltre l’oceano,<br/>oltre il <em>cielo.</em>',
          k3: 'Una nuova terra',        l3: 'Arrivi in <em>Italia.</em>',
          tag: 'La tua bussola nella vita italiana. Guide, AI multilingua e community — tutto in un posto.',
          enter: 'Scorri per entrare', hint: 'Scorri', skip: 'Salta intro' },
    en: { k1: 'The journey',           l1: 'From a home<br/><em>far away.</em>',
          k2: 'Thousands of kilometres', l2: 'Across the ocean,<br/>across the <em>sky.</em>',
          k3: 'A new land',            l3: 'You arrive in <em>Italy.</em>',
          tag: 'Your compass for life in Italy. Guides, multilingual AI and community — all in one place.',
          enter: 'Scroll to enter', hint: 'Scroll', skip: 'Skip intro' },
    si: { k1: 'ගමන',                   l1: 'දුර ඈත<br/><em>නිවසකින්.</em>',
          k2: 'කිලෝමීටර් දහස් ගණනක්',  l2: 'සාගරය තරණය කර,<br/>අහස <em>තරණය කර.</em>',
          k3: 'නව දේශයක්',             l3: 'ඔබ <em>ඉතාලියට</em> පැමිණේ.',
          tag: 'ඉතාලියේ ඔබේ ජීවිතයේ මාර්ගෝපදේශකය. මාර්ගෝපදේශ, බහුභාෂා AI සහ ප්‍රජාව — සියල්ල එක තැනක.',
          enter: 'ඇතුළු වීමට අනුචලනය කරන්න', hint: 'අනුචලනය කරන්න', skip: 'හැඳින්වීම මඟ හරින්න' },
    ta: { k1: 'பயணம்',                 l1: 'வெகு தொலைவில் உள்ள<br/><em>வீட்டிலிருந்து.</em>',
          k2: 'ஆயிரக்கணக்கான கிலோமீட்டர்கள்', l2: 'கடலைக் கடந்து,<br/>வானத்தைக் <em>கடந்து.</em>',
          k3: 'ஒரு புதிய நாடு',        l3: 'நீங்கள் <em>இத்தாலிக்கு</em> வந்தடைகிறீர்கள்.',
          tag: 'இத்தாலியில் உங்கள் வாழ்க்கையின் திசைகாட்டி. வழிகாட்டிகள், பன்மொழி AI மற்றும் சமூகம் — அனைத்தும் ஒரே இடத்தில்.',
          enter: 'நுழைய உருட்டவும்', hint: 'உருட்டவும்', skip: 'அறிமுகத்தைத் தவிர்க்கவும்' }
  };
  var T = DICT[lang] || DICT.it;

  // ── Utility ────────────────────────────────────────────────
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
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
    // ░░ SCENA 1 — Sri Lanka (alba sull'oceano) — video reale (Veo), poster come fallback ░░
    '<div class="scene scene-lanka" id="ix-lanka">' +
      '<div class="scene-stage scene-photo" id="ix-lanka-cam">' +
        '<video class="scene-video" id="ix-lanka-vid" autoplay muted loop playsinline preload="auto" poster="' + IMG_LANKA + '">' +
          '<source src="/assets/intro/lanka.mp4" type="video/mp4"/>' +
        '</video>' +
      '</div>' +
    '</div>' +

    // ░░ SCENA 2 — Terra dallo spazio (il viaggio) — video reale (Veo) ░░
    '<div class="scene scene-globe" id="ix-globe">' +
      '<div class="scene-stage scene-photo" id="ix-globe-cam">' +
        '<video class="scene-video" id="ix-globe-vid" muted loop playsinline preload="auto" poster="' + IMG_GLOBE + '">' +
          '<source src="/assets/intro/globe.mp4" type="video/mp4"/>' +
        '</video>' +
      '</div>' +
    '</div>' +

    // ░░ SCENA 3 — Colline toscane (l'arrivo) — video reale (Veo) ░░
    '<div class="scene scene-italy" id="ix-italy">' +
      '<div class="scene-stage scene-photo" id="ix-italy-cam">' +
        '<video class="scene-video" id="ix-italy-vid" muted loop playsinline preload="auto" poster="' + IMG_ITALY + '">' +
          '<source src="/assets/intro/italy.mp4" type="video/mp4"/>' +
        '</video>' +
      '</div>' +
    '</div>' +

    // ░░ Nuvole di transizione ░░
    '<div class="intro-clouds" id="ix-clouds">' +
      cloud(8, 18, 230) + cloud(64, 30, 300) + cloud(34, 70, 360) +
      cloud(80, 62, 260) + cloud(20, 44, 200) + cloud(50, 12, 280) +
    '</div>' +

    '<div class="intro-vignette"></div>' +

    // ░░ Didascalie ░░
    '<div class="intro-cap" id="ix-cap1"><p class="cap-kicker">' + T.k1 + '</p>' +
      '<p class="cap-line">' + T.l1 + '</p></div>' +
    '<div class="intro-cap" id="ix-cap2"><p class="cap-kicker">' + T.k2 + '</p>' +
      '<p class="cap-line">' + T.l2 + '</p></div>' +
    '<div class="intro-cap" id="ix-cap3"><p class="cap-kicker">' + T.k3 + '</p>' +
      '<p class="cap-line">' + T.l3 + '</p></div>' +

    // ░░ SCENA 4 — accensione del marchio ░░
    '<div class="scene-ignite" id="ix-ignite">' +
      '<div class="ig-glow" id="ix-glow"></div>' +
      '<div class="ig-mark">Easy <span class="accent">Italia</span> Hub</div>' +
      '<p class="ig-tag">' + T.tag + '</p>' +
      '<span class="ig-enter">' + T.enter + ' ' +
        '<svg viewBox="0 0 24 24"><line x1="12" y1="3" x2="12" y2="19"/><polyline points="6 13 12 19 18 13"/></svg>' +
      '</span>' +
    '</div>' +

    '<div class="intro-hint" id="ix-hint">' + T.hint + '<span class="hint-wheel"></span></div>' +
    '<button class="intro-skip" id="ix-skip" type="button">' + T.skip + ' ✕</button>';

  document.documentElement.classList.add('eih-intro-on');
  var first = document.body.firstChild;
  document.body.insertBefore(intro, first);
  document.body.insertBefore(spacer, intro.nextSibling);

  // Anti-flash + autoplay: ogni scena è un video reale (poster = foto come fallback).
  // Rivela la scena al primo frame pronto. La scena 1 parte subito; globo e Italia
  // partono quando entrano in scena (vedi render → playVid), per non decodificare
  // tre video insieme e alleggerire mobile e batteria.
  ['ix-lanka', 'ix-globe', 'ix-italy'].forEach(function (base) {
    var cam = intro.querySelector('#' + base + '-cam');
    var vid = intro.querySelector('#' + base + '-vid');
    if (!cam || !vid) return;
    var reveal = function () { cam.classList.add('photo-on'); };
    vid.addEventListener('loadeddata', reveal);
    vid.addEventListener('canplay', reveal);
    if (vid.readyState >= 2) reveal();
    if (base === 'ix-lanka') { var pp = vid.play(); if (pp && pp.catch) pp.catch(function () {}); }
  });
  function playVid(v) { if (v && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }

  // ── Riferimenti ────────────────────────────────────────────
  function g(id) { return intro.querySelector('#' + id); }
  var R = {
    lanka: g('ix-lanka'), lankaCam: g('ix-lanka-cam'),
    globe: g('ix-globe'), globeCam: g('ix-globe-cam'), globeVid: g('ix-globe-vid'),
    italy: g('ix-italy'), italyCam: g('ix-italy-cam'), italyVid: g('ix-italy-vid'),
    clouds: g('ix-clouds'), puffs: intro.querySelectorAll('.intro-clouds .puff'),
    cap1: g('ix-cap1'), cap2: g('ix-cap2'), cap3: g('ix-cap3'),
    ignite: g('ix-ignite'), glow: g('ix-glow'), mark: intro.querySelector('.ig-mark'),
    igTag: intro.querySelector('.ig-tag'), igEnter: intro.querySelector('.ig-enter'),
    hint: g('ix-hint'), skip: g('ix-skip')
  };

  // ── Loop di rendering ──────────────────────────────────────
  // Loop continuo a rAF con smorzamento: il progresso "insegue" lo scroll con
  // easing, così il movimento resta fluido anche se qualche frame salta.
  var locked = false, cur = 0, raf = 0;
  function targetP() {
    var denom = spacer.offsetHeight - window.innerHeight;
    return clamp(window.scrollY / (denom > 1 ? denom : 1), 0, 1);
  }

  function render(p) {

    /* ── Scena 1: Sri Lanka — si solleva, la terra si allontana ── */
    var lankaA = 1 - seg(p, 0.26, 0.40);
    setOpac(R.lanka, lankaA);
    var lkT = seg(p, 0, 0.40);
    setT(R.lankaCam, 'translate3d(0,' + lerp(0, -8, lkT) + '%,0) scale(' + lerp(1.06, 1.34, ease(lkT)) + ')');

    /* ── Scena 2: Globo — zoom verso l'Italia (transform-origin: 36% 35%) ── */
    var globeA = ramp(p, 0.30, 0.74, 0.10);
    setOpac(R.globe, globeA);
    if (globeA > 0.02) playVid(R.globeVid);
    var gT = seg(p, 0.30, 0.74);
    var gScale = lerp(0.9, 1.55, ease(gT));
    setT(R.globeCam, 'translate3d(0,' + lerp(1, 0, ease(gT)) + '%,0) scale(' + gScale + ')');

    /* ── Scena 3: Italia — discesa sulle colline ─────────────── */
    var italyA = ramp(p, 0.68, 0.985, 0.09);
    setOpac(R.italy, italyA);
    if (italyA > 0.02) playVid(R.italyVid);
    var itT = seg(p, 0.68, 0.96);
    setT(R.italyCam, 'translate3d(0,' + lerp(-6, 0, ease(itT)) + '%,0) scale(' + lerp(1.28, 1.0, ease(itT)) + ')');

    /* ── Nuvole nelle due transizioni ─────────────────────────── */
    var cloudA = Math.max(ramp(p, 0.24, 0.46, 0.06), ramp(p, 0.62, 0.84, 0.06));
    setOpac(R.clouds, cloudA);
    for (var i = 0; i < R.puffs.length; i++) {
      var dir = i % 2 ? 1 : -1;
      var drift = (p * 2600 * (0.5 + (i % 3) * 0.32)) % 2600;
      setT(R.puffs[i], 'translate3d(' + (dir * (drift - 1300)) + 'px,0,0)');
    }

    /* ── Didascalie ───────────────────────────────────────────── */
    cap(R.cap1, ramp(p, 0.02, 0.26, 0.06));
    cap(R.cap2, ramp(p, 0.40, 0.62, 0.06));
    cap(R.cap3, ramp(p, 0.70, 0.88, 0.06));

    /* ── Scena 4: accensione marchio ─────────────────────────── */
    var igA = seg(p, 0.88, 0.995);
    setOpac(R.ignite, igA);
    setOpac(R.glow, ease(igA));
    if (R.mark) {
      R.mark.style.transform = 'scale(' + lerp(0.86, 1, ease(igA)) + ')';
      R.mark.style.textShadow = '0 0 ' + lerp(0, 70, igA) + 'px rgba(243,201,122,' + (0.65 * igA) + ')';
    }
    setOpac(R.igTag, seg(p, 0.93, 1));
    setOpac(R.igEnter, seg(p, 0.965, 1));
    if (R.glow) R.glow.style.transform = 'scale(' + lerp(0.7, 1.1, ease(igA)) + ')';

    /* ── Hint scroll iniziale ─────────────────────────────────── */
    setOpac(R.hint, p < 0.08 ? 1 - seg(p, 0.02, 0.08) : 0);
  }

  function setOpac(el, v) { if (el) el.style.opacity = v; }
  function setT(el, t) { if (el) el.style.transform = t; }
  function cap(el, a) {
    if (!el) return;
    el.style.opacity = a;
    el.style.transform = 'translate3d(0,' + lerp(26, 0, Math.min(1, a * 1.4)) + 'px,0)';
  }

  function loop() {
    if (locked) return;
    var t = targetP();
    cur += (t - cur) * 0.18;
    if (Math.abs(t - cur) < 0.0005) cur = t;
    render(cur);
    if (t >= 0.999) { complete(); return; }
    raf = requestAnimationFrame(loop);
  }

  // ── Conclusione: dissolvi overlay ed entra in home ─────────
  function complete() {
    if (locked) return;
    locked = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    if (raf) cancelAnimationFrame(raf);
    intro.style.transition = 'opacity .6s ease';
    intro.style.opacity = '0';
    intro.style.pointerEvents = 'none';
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
  setTimeout(function () { window.scrollTo(0, 0); cur = 0; raf = requestAnimationFrame(loop); }, 60);
  setTimeout(function () { if (!locked) setOpac(R.hint, 1); }, 900);

  function cloud(x, y, s) {
    return '<div class="puff" style="left:' + x + '%;top:' + y + '%;width:' + s + 'px;height:' + (s * 0.62) + 'px;margin:-' + (s * 0.31) + 'px 0 0 -' + (s / 2) + 'px"></div>';
  }
})();
