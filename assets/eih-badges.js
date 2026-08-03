/* Easy Italia Hub — motore Badge (corsi → esame → livello → sblocco funzioni).
   Persistenza: localStorage (demo). Struttura pronta per sync Supabase futuro.
   Espone window.EIHBadges. */
(function (g) {
  'use strict';
  var KEY = 'eih-badge';

  // Livelli in ordine crescente. min = punteggio minimo (%) per ottenerlo.
  var LEVELS = [
    { id: 'bronzo',  min: 60, color: '#b07a46', name: { it: 'Bronzo',  en: 'Bronze',   si: 'ලෝකඩ',      ta: 'வெண்கலம்' } },
    { id: 'argento', min: 75, color: '#9aa3ad', name: { it: 'Argento', en: 'Silver',   si: 'රිදී',       ta: 'வெள்ளி' } },
    { id: 'oro',     min: 85, color: '#c8a96e', name: { it: 'Oro',     en: 'Gold',     si: 'රන්',        ta: 'தங்கம்' } },
    { id: 'platino', min: 95, color: '#6fb0c7', name: { it: 'Platino', en: 'Platinum', si: 'ප්ලැටිනම්', ta: 'பிளாட்டினம்' } }
  ];

  // Cosa sblocca ciascun livello (label multilingua). Cumulativo.
  var UNLOCKS = {
    bronzo:  [{ it: 'Profilo verificato con badge pubblico', en: 'Verified profile with public badge', si: 'තහවුරු කළ පැතිකඩ', ta: 'சரிபார்க்கப்பட்ட சுயவிவரம்' }],
    argento: [{ it: 'Scheda attività sulla mappa dei servizi', en: 'Business listing on the services map', si: 'සේවා සිතියමේ ලැයිස්තුගත කිරීම', ta: 'சேவை வரைபடத்தில் பட்டியல்' },
              { it: 'Contatti diretti dalla community', en: 'Direct contacts from the community', si: 'ප්‍රජාවෙන් සෘජු සම්බන්ධතා', ta: 'சமூகத்திலிருந்து நேரடி தொடர்புகள்' }],
    oro:     [{ it: 'Articolo redazionale dedicato', en: 'Dedicated editorial article', si: 'කැපවූ සංස්කරණ ලිපිය', ta: 'பிரத்யேக தலையங்கக் கட்டுரை' },
              { it: 'Consigliato dal Consigliere AI', en: 'Recommended by the AI Advisor', si: 'AI උපදේශක නිර්දේශය', ta: 'AI ஆலோசகர் பரிந்துரை' }],
    platino: [{ it: 'Referente dedicato (account manager)', en: 'Dedicated account manager', si: 'කැපවූ ගිණුම් කළමනාකරු', ta: 'பிரத்யேக கணக்கு மேலாளர்' },
              { it: 'Accesso a tutte le funzioni Pro e Business', en: 'Access to all Pro & Business features', si: 'සියලු Pro සහ Business විශේෂාංග', ta: 'அனைத்து Pro & Business அம்சங்கள்' }]
  };

  function get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function rank(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return i; return -1; }
  function levelById(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return null; }
  function levelForScore(score) { var r = null; for (var i = 0; i < LEVELS.length; i++) if (score >= LEVELS[i].min) r = LEVELS[i]; return r; }

  // Assegna il badge in base al punteggio, tenendo sempre il migliore.
  function award(score) {
    var lv = levelForScore(score);
    var cur = get();
    if (cur && typeof cur.score === 'number' && cur.score >= score) return cur;
    if (!lv) { // sotto la soglia minima: registra il tentativo senza livello
      var fail = { level: null, score: score, date: new Date().toISOString() };
      if (!cur) { try { localStorage.setItem(KEY, JSON.stringify(fail)); } catch (e) {} return fail; }
      return cur;
    }
    var rec = { level: lv.id, score: score, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    whenDB(function () { pushRemote(rec); });
    return rec;
  }

  // Registra un livello già calcolato dall'esame (upgrade-only per rango).
  // Usato dagli esami a più stadi (base -> Bronzo/Argento, avanzato -> Oro/Platino).
  function record(level, score) {
    var cur = get();
    var newRank = level ? rank(level) : -1;
    if (newRank < 0) return cur || { level: null, score: score, date: new Date().toISOString() };
    if (cur && cur.level) {
      var cr = rank(cur.level);
      if (cr > newRank) return cur;                                  // non declassare
      if (cr === newRank && (cur.score || 0) >= score) return cur;   // stesso livello, non peggiorare
    }
    var rec = { level: level, score: score, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    whenDB(function () { pushRemote(rec); });
    return rec;
  }

  // ── Sync Supabase (via EIH_DB, RLS owner-only). Fallback silenzioso. ──
  function whenDB(cb, tries) {
    tries = tries || 0;
    if (window.EIH_DB && window.EIH_DB.table) { cb(); return; }
    if (tries > 40) return; // ~10s
    setTimeout(function () { whenDB(cb, tries + 1); }, 250);
  }
  function pushRemote(rec) {
    if (!rec || !rec.level || !(window.EIH_DB && window.EIH_DB.table)) return;
    try { var r = window.EIH_DB.table('user_badges').insert({ level: rec.level, score: rec.score }); if (r && r.catch) r.catch(function () {}); } catch (e) {}
  }
  // Riconcilia locale <-> remoto tenendo il punteggio migliore. cb() a fine.
  function sync(cb) {
    whenDB(function () {
      try {
        window.EIH_DB.table('user_badges').list().then(function (rows) {
          var loc = get();
          function better(a, b) { if (!b || !b.level) return !!(a && a.level); if (!a || !a.level) return false; return rank(a.level) > rank(b.level) || (rank(a.level) === rank(b.level) && (a.score || 0) > (b.score || 0)); }
          if (rows && rows.length) {
            var best = null;
            rows.forEach(function (r) { if (r && r.level) { var cand = { level: r.level, score: r.score, date: r.created_at || new Date().toISOString() }; if (better(cand, best)) best = cand; } });
            if (best && better(best, loc)) { try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) {} loc = best; }
            if (loc && loc.level && better(loc, best)) pushRemote(loc);
          } else if (loc && loc.level) { pushRemote(loc); }
          if (cb) cb();
        }).catch(function () { if (cb) cb(); });
      } catch (e) { if (cb) cb(); }
    });
  }

  // true se l'utente ha almeno il livello richiesto.
  function has(id) { var c = get(); return !!(c && c.level && rank(c.level) >= rank(id)); }

  function unlocksUpTo(id) {
    var out = [], r = rank(id);
    for (var i = 0; i <= r; i++) { var u = UNLOCKS[LEVELS[i].id] || []; for (var j = 0; j < u.length; j++) out.push(u[j]); }
    return out;
  }

  var styled = false;
  function injectStyle() {
    if (styled) return; styled = true;
    var s = document.createElement('style');
    s.textContent = '.eih-badge-chip{display:inline-flex;align-items:center;gap:.4rem;padding:.28rem .7rem;border-radius:999px;font-size:.78rem;font-weight:600;color:var(--bc,#c8a96e);background:color-mix(in srgb,var(--bc,#c8a96e) 14%,transparent);border:1px solid color-mix(in srgb,var(--bc,#c8a96e) 38%,transparent);line-height:1}.eih-badge-chip svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}';
    document.head.appendChild(s);
  }

  var AWARD_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"/></svg>';

  // Restituisce l'HTML di un chip badge per un livello.
  function chip(id, lang) {
    var lv = levelById(id); if (!lv) return '';
    injectStyle();
    lang = lang || (function () { var d = window.EIH_LANG || 'en'; try { return localStorage.getItem('eih-lang') || d; } catch (e) { return d; } })();
    return '<span class="eih-badge-chip" style="--bc:' + lv.color + '">' + AWARD_SVG + (lv.name[lang] || lv.name.it) + '</span>';
  }

  // Corsi di formazione completati? (prerequisito per l'esame)
  var COURSE_KEY = 'eih-corso-completato';
  function coursesDone() { try { return localStorage.getItem(COURSE_KEY) === '1'; } catch (e) { return false; } }
  function markCoursesDone() { try { localStorage.setItem(COURSE_KEY, '1'); } catch (e) {} }

  g.EIHBadges = {
    LEVELS: LEVELS, UNLOCKS: UNLOCKS, get: get, award: award, has: has, rank: rank,
    levelById: levelById, levelForScore: levelForScore, unlocksUpTo: unlocksUpTo, chip: chip,
    coursesDone: coursesDone, markCoursesDone: markCoursesDone, sync: sync, record: record
  };
})(window);
