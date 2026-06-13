/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — Intro cinematografica (clip auto-play)
   "Dallo Sri Lanka all'Italia" riassunto in un unico clip 1080p
   con transizioni dimensionali, didascalie multilingua e accensione
   del marchio. Niente scroll: si riproduce e poi si entra in home.

   - Si monta SOLO alla prima visita di sessione (sessionStorage),
     se non c'è un deep-link (#ancora) e se non è richiesto meno movimento.
   - Saltabile in ogni momento (click su "Salta" + tasto ESC).
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'eih-intro-v1';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) return;
  if (location.hash && location.hash.length > 1) return;
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}

  // ── Localizzazione (stessa chiave del resto del sito: localStorage 'eih-lang') ──
  var lang = (function () { try { return localStorage.getItem('eih-lang'); } catch (e) { return null; } }) ();
  var DICT = {
    it: { k1: 'Il viaggio',            l1: 'Da una casa<br/><em>lontana.</em>',
          k2: 'Migliaia di chilometri', l2: 'Oltre l’oceano,<br/>oltre il <em>cielo.</em>',
          k3: 'Una nuova terra',        l3: 'Arrivi in <em>Italia.</em>',
          tag: 'La tua bussola nella vita italiana. Guide, AI multilingua e community — tutto in un posto.',
          go: 'Entra', skip: 'Salta intro' },
    en: { k1: 'The journey',           l1: 'From a home<br/><em>far away.</em>',
          k2: 'Thousands of kilometres', l2: 'Across the ocean,<br/>across the <em>sky.</em>',
          k3: 'A new land',            l3: 'You arrive in <em>Italy.</em>',
          tag: 'Your compass for life in Italy. Guides, multilingual AI and community — all in one place.',
          go: 'Enter', skip: 'Skip intro' },
    si: { k1: 'ගමන',                   l1: 'දුර ඈත<br/><em>නිවසකින්.</em>',
          k2: 'කිලෝමීටර් දහස් ගණනක්',  l2: 'සාගරය තරණය කර,<br/>අහස <em>තරණය කර.</em>',
          k3: 'නව දේශයක්',             l3: 'ඔබ <em>ඉතාලියට</em> පැමිණේ.',
          tag: 'ඉතාලියේ ඔබේ ජීවිතයේ මාර්ගෝපදේශකය. මාර්ගෝපදේශ, බහුභාෂා AI සහ ප්‍රජාව — සියල්ල එක තැනක.',
          go: 'ඇතුළු වන්න', skip: 'හැඳින්වීම මඟ හරින්න' },
    ta: { k1: 'பயணம்',                 l1: 'வெகு தொலைவில் உள்ள<br/><em>வீட்டிலிருந்து.</em>',
          k2: 'ஆயிரக்கணக்கான கிலோமீட்டர்கள்', l2: 'கடலைக் கடந்து,<br/>வானத்தைக் <em>கடந்து.</em>',
          k3: 'ஒரு புதிய நாடு',        l3: 'நீங்கள் <em>இத்தாலிக்கு</em> வந்தடைகிறீர்கள்.',
          tag: 'இத்தாலியில் உங்கள் வாழ்க்கையின் திசைகாட்டி. வழிகாட்டிகள், பன்மொழி AI மற்றும் சமூகம் — அனைத்தும் ஒரே இடத்தில்.',
          go: 'உள்ளே செல்லுங்கள்', skip: 'அறிமுகத்தைத் தவிர்க்கவும்' }
  };
  var T = DICT[lang] || DICT.it;

  // ── Utility ────────────────────────────────────────────────
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ── Costruzione DOM ────────────────────────────────────────
  var intro = document.createElement('div');
  intro.className = 'eih-intro';
  intro.id = 'eih-intro';
  intro.setAttribute('aria-hidden', 'true');

  intro.innerHTML =
    '<video class="ix-clip" id="ix-clip" autoplay muted playsinline preload="auto" poster="/assets/intro/journey-poster.jpg">' +
      '<source src="/assets/intro/journey.mp4" type="video/mp4"/>' +
    '</video>' +
    '<div class="intro-vignette"></div>' +

    // ░░ Didascalie multilingua (temporizzate sul clip) ░░
    '<div class="intro-cap" id="ix-cap1"><p class="cap-kicker">' + T.k1 + '</p>' +
      '<p class="cap-line">' + T.l1 + '</p></div>' +
    '<div class="intro-cap" id="ix-cap2"><p class="cap-kicker">' + T.k2 + '</p>' +
      '<p class="cap-line">' + T.l2 + '</p></div>' +
    '<div class="intro-cap" id="ix-cap3"><p class="cap-kicker">' + T.k3 + '</p>' +
      '<p class="cap-line">' + T.l3 + '</p></div>' +

    // ░░ Accensione del marchio (alla fine del clip) ░░
    '<div class="scene-ignite" id="ix-ignite">' +
      '<div class="ig-glow"></div>' +
      '<div class="ig-mark">Easy <span class="accent">Italia</span> Hub</div>' +
      '<p class="ig-tag">' + T.tag + '</p>' +
    '</div>' +

    '<button class="intro-skip" id="ix-skip" type="button">' + T.skip + ' ✕</button>';

  document.documentElement.classList.add('eih-intro-on');
  document.body.insertBefore(intro, document.body.firstChild);
  window.scrollTo(0, 0);

  function g(id) { return intro.querySelector('#' + id); }
  var clip = g('ix-clip');
  var R = { cap1: g('ix-cap1'), cap2: g('ix-cap2'), cap3: g('ix-cap3'), ignite: g('ix-ignite') };

  // ── Didascalie sincronizzate col tempo del clip ────────────
  // Finestre scelte per stare dentro le scene (evitano le transizioni nere).
  function capAt(ct, el, start, end) {
    if (!el) return;
    var f = 0.5;
    var a = Math.min(seg(ct, start, start + f), 1 - seg(ct, end - f, end));
    a = clamp(a, 0, 1);
    el.style.opacity = a;
    el.style.transform = 'translate3d(0,' + lerp(26, 0, Math.min(1, a * 1.4)) + 'px,0)';
  }
  function onTime() {
    var ct = clip.currentTime || 0;
    // Finestre ritarate sul clip cinematografico da ~6.9s (fade-out a 6.23s).
    capAt(ct, R.cap1, 0.3, 2.0);
    capAt(ct, R.cap2, 2.4, 4.3);
    capAt(ct, R.cap3, 4.7, 6.5);
  }
  clip.addEventListener('timeupdate', onTime);

  // ── Fine clip → accensione marchio ─────────────────────────
  var ended = false, locked = false;
  function showIgnite() {
    if (ended) return;
    ended = true;
    intro.classList.add('is-end');
    setTimeout(enter, 2800); // dopo l'accensione del marchio si entra in home da soli
  }
  clip.addEventListener('ended', showIgnite);

  // ── Conclusione: entra in home ─────────────────────────────
  function enter() {
    if (locked) return;
    locked = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    try { clip.pause(); } catch (e) {}
    intro.style.transition = 'opacity .6s ease';
    intro.style.opacity = '0';
    intro.style.pointerEvents = 'none';
    window.scrollTo(0, 0);
    document.documentElement.classList.remove('eih-intro-on');
    setTimeout(function () {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      if (window.ScrollTrigger) { try { window.ScrollTrigger.refresh(); } catch (e) {} }
    }, 650);
  }

  g('ix-skip').addEventListener('click', enter);
  document.addEventListener('keydown', function (e) { if (!locked && e.key === 'Escape') enter(); });

  // ── Avvio + reti di sicurezza ──────────────────────────────
  var pp = clip.play(); if (pp && pp.catch) pp.catch(function () { showIgnite(); }); // autoplay bloccato → mostra "Entra"
  clip.addEventListener('error', showIgnite);
  // Safety: se il clip non parte/finisce, mostra comunque l'accensione.
  setTimeout(function () { if (!ended && (!clip.currentTime || clip.paused)) showIgnite(); }, 4000);
  setTimeout(function () { if (!ended) showIgnite(); }, 17000);
})();
