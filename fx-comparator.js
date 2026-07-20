/* ═══════════════════════════════════════════════════════════
   Easy Italia Hub — FX comparator widget (EUR → LKR rimesse)
   Self-contained vanilla JS. No dependencies, no globals leaked.

   Renders into <div id="fx-comparator" aria-live="polite"></div> on the
   landing page (the page provides the heading; we render the rest).

   Data: fetched ONCE from the SAME-ORIGIN endpoint GET /api/fx (a Vercel
   serverless function that proxies a free FX API). We NEVER call a third-party
   API from the client — the page CSP would block it; /api/fx does it server-side.

   HONESTY: the figure shown is the INTERBANK (mid-market) reference rate, an
   indicative amount only. What the recipient actually gets depends on each
   provider's fees and exchange-rate margin. We say so, and link out to Wise /
   Western Union / Ria for a real, live quote.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // ── Theme tokens (mirror eih.css so the widget matches the editorial look) ──
  var C = {
    fg: "#1c1a17",
    fgSecondary: "#565049",
    fgMuted: "#857e72",
    gold: "#7c7059",
    goldDim: "rgba(124,112,89,0.14)",
    coral: "#eb5939",
    border: "rgba(118,118,118,0.16)",
    borderBright: "rgba(118,118,118,0.30)",
    surface: "#f1eee9",
    surfaceSoft: "rgba(40,36,30,0.035)",
    radius: "10px",
  };

  var ENDPOINT = "/api/fx";
  var DEFAULT_AMOUNT = 100;

  // Provider links for getting the REAL, live quote (fees + margin included).
  var PROVIDERS = [
    { name: "Wise", url: "/api/go?to=wise&ref=fx", aff: true },
    { name: "Remitly", url: "/api/go?to=remitly&ref=fx", aff: true },
    { name: "Western Union", url: "https://www.westernunion.com" },
    { name: "Ria", url: "https://www.riamoneytransfer.com" },
  ];

  // ── Helpers ───────────────────────────────────────────────
  // Italian-style thousands separator ("." for thousands), no decimals for LKR.
  function formatLKR(n) {
    if (!isFinite(n)) return "—";
    var rounded = Math.round(n);
    try {
      return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(rounded);
    } catch (e) {
      // Fallback formatter if Intl is unavailable: group digits with ".".
      return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  }

  function formatEUR(n) {
    if (!isFinite(n)) return "—";
    try {
      return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(n);
    } catch (e) {
      return String(n);
    }
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      for (var k in props) {
        if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
        if (k === "style") node.style.cssText = props[k];
        else if (k === "text") node.textContent = props[k];
        else if (k === "html") node.innerHTML = props[k];
        else node.setAttribute(k, props[k]);
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        if (children[i]) node.appendChild(children[i]);
      }
    }
    return node;
  }

  function init() {
    var root = document.getElementById("fx-comparator");
    if (!root) return; // contract: if the placeholder is absent, do nothing.

    // Clear any previous content (idempotent if init runs twice).
    root.textContent = "";

    // ── Card shell ──────────────────────────────────────────
    var card = el("div", {
      style:
        "max-width:560px;padding:1.4rem 1.5rem;border-radius:" + C.radius + ";" +
        "background:" + C.surface + ";border:1px solid " + C.border + ";" +
        "color:" + C.fg + ";font:inherit;line-height:1.6;",
    });

    // ── Input row (label + number input + currency hint) ────
    var inputId = "fx-eur-amount";
    var label = el("label", {
      for: inputId,
      style:
        "display:block;font-size:.8rem;font-weight:600;letter-spacing:.02em;" +
        "color:" + C.fgSecondary + ";margin-bottom:.4rem;",
      text: "Importo da inviare (EUR)",
    });

    var input = el("input", {
      id: inputId,
      type: "number",
      min: "1",
      step: "1",
      inputmode: "decimal",
      value: String(DEFAULT_AMOUNT),
      "aria-describedby": "fx-result fx-disclaimer",
      style:
        "width:100%;max-width:220px;padding:.6rem .75rem;font:inherit;" +
        "font-size:1.05rem;color:" + C.fg + ";background:#fffdf9;" +
        "border:1px solid " + C.borderBright + ";border-radius:" + C.radius + ";" +
        "outline-color:" + C.gold + ";",
    });

    var inputWrap = el("div", { style: "margin-bottom:1rem;" }, [label, input]);

    // ── Result line (aria-live so screen readers hear updates) ──
    var result = el("div", {
      id: "fx-result",
      role: "status",
      "aria-live": "polite",
      style:
        "font-size:1.1rem;font-weight:600;color:" + C.fg + ";" +
        "padding:.85rem 1rem;border-radius:" + C.radius + ";" +
        "background:" + C.goldDim + ";border:1px solid rgba(124,112,89,0.22);" +
        "margin-bottom:.85rem;min-height:1.4em;",
      text: "Caricamento del tasso…",
    });

    // ── Small "rate / updated" meta line ────────────────────
    var meta = el("div", {
      style: "font-size:.78rem;color:" + C.fgMuted + ";margin-bottom:.85rem;",
      text: "",
    });

    // ── Disclaimer (HONESTY — always shown) ─────────────────
    var disclaimer = el("p", {
      id: "fx-disclaimer",
      style:
        "font-size:.8rem;line-height:1.55;color:" + C.fgSecondary + ";" +
        "margin:0 0 .9rem;padding-left:.75rem;border-left:3px solid " + C.coral + ";",
    });

    // ── Provider links (get the REAL quote) ─────────────────
    var providerIntro = el("div", {
      style: "font-size:.8rem;color:" + C.fgMuted + ";margin-bottom:.45rem;",
      text: "Ottieni un preventivo reale (commissioni e cambio inclusi). Alcuni link sono affiliati:",
    });

    var linkRow = el("div", {
      style: "display:flex;flex-wrap:wrap;gap:.5rem;",
    });
    PROVIDERS.forEach(function (p) {
      var a = el("a", {
        href: p.url,
        target: "_blank",
        rel: p.aff ? "sponsored noopener" : "noopener",
        style:
          "display:inline-flex;align-items:center;text-decoration:none;" +
          "font-size:.82rem;font-weight:500;color:" + C.fg + ";" +
          "padding:.4rem .85rem;border-radius:9999px;" +
          "background:" + C.surfaceSoft + ";border:1px solid " + C.borderBright + ";",
        text: p.name + " ↗",
      });
      linkRow.appendChild(a);
    });

    card.appendChild(inputWrap);
    card.appendChild(result);
    card.appendChild(meta);
    card.appendChild(disclaimer);
    card.appendChild(providerIntro);
    card.appendChild(linkRow);
    root.appendChild(card);

    // ── State ───────────────────────────────────────────────
    var state = {
      rate: null,    // LKR per 1 EUR
      stale: false,  // true if /api/fx returned the static fallback
      ok: false,     // true once we have any usable rate
      error: false,  // true if /api/fx was unreachable
      updated: "",   // upstream "time_last_update_utc" or ISO
    };

    function amount() {
      var v = parseFloat(input.value);
      if (!isFinite(v) || v <= 0) return 0;
      return v;
    }

    function disclaimerText() {
      var base =
        "Tasso interbancario (mid-market) indicativo: l'importo realmente ricevuto " +
        "dipende dalle commissioni e dal margine di cambio del provider. " +
        "Non è un preventivo in tempo reale per singolo provider.";
      if (state.stale) {
        base = "Tasso indicativo non aggiornato. " + base;
      }
      return base;
    }

    function render() {
      // Error: no rate available at all.
      if (state.error) {
        result.textContent = "Tasso non disponibile al momento.";
        meta.textContent = "";
      } else if (!state.ok || state.rate == null) {
        result.textContent = "Caricamento del tasso…";
        meta.textContent = "";
      } else {
        var amt = amount();
        var received = amt * state.rate;
        if (amt <= 0) {
          result.textContent = "Inserisci un importo valido (almeno €1).";
        } else {
          result.textContent =
            "Invii €" + formatEUR(amt) + " → ricevi circa LKR " + formatLKR(received);
        }
        var ratePart = "1 EUR ≈ " + formatLKR(state.rate) + " LKR";
        if (state.stale) {
          meta.textContent = ratePart + " · tasso indicativo non aggiornato";
        } else if (state.updated) {
          meta.textContent = ratePart + " · aggiornato: " + state.updated;
        } else {
          meta.textContent = ratePart;
        }
      }
      disclaimer.textContent = disclaimerText();
    }

    // Recompute locally on input change — NO refetch (rate is cached in state).
    input.addEventListener("input", render);
    input.addEventListener("change", render);

    render(); // initial loading paint + disclaimer (always present)

    // ── Fetch the rate ONCE from same-origin /api/fx ────────
    function loadRate() {
      // Guard for very old environments; modern targets always have fetch.
      if (typeof fetch !== "function") {
        state.error = true;
        render();
        return;
      }
      fetch(ENDPOINT, { headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("http_" + r.status);
          return r.json();
        })
        .then(function (data) {
          var lkr = data && data.rates ? data.rates.LKR : null;
          var n = typeof lkr === "number" ? lkr : parseFloat(lkr);
          if (!isFinite(n) || n <= 0) throw new Error("no_lkr");
          state.rate = n;
          state.ok = true;
          state.stale = !!data.stale || data.source === "fallback";
          state.updated = typeof data.updated === "string" ? data.updated : "";
          state.error = false;
          render();
        })
        .catch(function () {
          // Graceful failure: keep input + disclaimer + provider links visible,
          // just tell the user the rate is unavailable. NEVER throw / leave empty.
          state.error = true;
          state.ok = false;
          render();
        });
    }

    loadRate();
  }

  // On DOMContentLoaded (or immediately if the DOM is already parsed).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
