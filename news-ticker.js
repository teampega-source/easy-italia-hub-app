/* Easy Italia Hub — Live news ticker (left rail).
   Fetches same-origin /api/news (server-side RSS aggregator) and renders an
   auto-scrolling vertical list of Sri Lankan headlines. Each item opens the
   original source in a new tab. Degrades gracefully if the API is unavailable
   (e.g. local static preview) and respects prefers-reduced-motion. */
(function () {
  var rail = document.getElementById("news-rail");
  if (!rail) return;
  var track = rail.querySelector(".nr-track");
  var foot = rail.querySelector(".nr-foot");
  if (!track) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ago(iso) {
    if (!iso) return "";
    var t = Date.parse(iso);
    if (isNaN(t)) return "";
    var s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "ora";
    if (s < 3600) return Math.floor(s / 60) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    return Math.floor(s / 86400) + "g";
  }
  function itemHTML(it) {
    var when = ago(it.date);
    return (
      '<a class="nr-item" href="' + esc(it.link) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="nr-src">' + esc(it.source) + (when ? " · " + when : "") + "</span>" +
      '<span class="nr-title">' + esc(it.title) + "</span></a>"
    );
  }

  function showEmpty() {
    track.innerHTML =
      '<p class="nr-empty">Notizie non disponibili al momento.<br><a href="news.html">Vai alle news →</a></p>';
  }

  function render(items) {
    if (!items || !items.length) { showEmpty(); return; }
    var html = items.map(itemHTML).join("");
    // duplicate the list for a seamless infinite loop (unless reduced motion)
    track.innerHTML = reduce ? html : html + html;
    if (!reduce) {
      requestAnimationFrame(function () {
        var loopHeight = track.scrollHeight / 2;          // height of one copy
        var dur = Math.max(24, Math.round(loopHeight / 16)); // ~16px per second
        track.style.animationDuration = dur + "s";
        track.classList.add("nr-animate");
      });
    }
  }

  var done = false;
  function fail() { if (!done) { done = true; showEmpty(); } }
  var killer = setTimeout(fail, 8000);

  fetch("/api/news", { headers: { Accept: "application/json" } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) {
      if (done) return;
      done = true; clearTimeout(killer);
      render(d && d.items);
    })
    .catch(function () { clearTimeout(killer); fail(); });
})();
