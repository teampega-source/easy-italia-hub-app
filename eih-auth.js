/* ═══════════════════════════════════════════════════════════════════════════
   Easy Italia Hub — auth + data bridge (eih-auth.js)
   ───────────────────────────────────────────────────────────────────────────
   A zero-build, browser-side IIFE that exposes two globals:

       window.EIH_AUTH  — authentication (sign up / in / out, current user)
       window.EIH_DB    — a thin data layer for Phase-1 data (deadlines, …)

   IT WORKS IN TWO MODES, decided automatically at load time:

     • REAL mode   — when /api/config reports { configured:true } (i.e. the
                     SUPABASE_URL + SUPABASE_ANON_KEY env vars are set in
                     Vercel). The Supabase JS client is imported from a CDN and
                     all calls hit Supabase. RLS scopes every row to the user.

     • DEMO mode   — today, with no keys set (or if config/CDN fail). Nothing is
                     imported; every call falls back to the SAME localStorage /
                     IndexedDB the existing pages already use, so the current
                     demo experience keeps working byte-for-byte.

   The whole module is ADDITIVE and currently referenced by NO page. It is safe
   to <script src> on any page: in demo mode it is inert (it only writes the
   localStorage keys the existing demo flow already writes), and it NEVER throws
   on load — any failure degrades silently to demo mode (console.info, not error).

   Pages can await readiness:   await window.EIH_AUTH.ready;

   ── Data shapes (kept identical to the existing pages so demo data matches) ──
     localStorage 'eih-deadlines' → [ { id, date:'YYYY-MM-DD', title, note } ]
                                     (see preview/dashboard.html)
     localStorage 'eih-permesso'  → single object
                                     { tipo, presentazione, questura, ricevuta,
                                       scadenza, status, history, updatedAt }
                                     (see preview/permesso-tracker.html)
     localStorage 'eih-registered' = '1'  → demo "logged-in" gate used by pages
     localStorage 'eih-demo-user'  → { email, name }  (demo profile, this module)

   ── Documents / files ──
     File storage is intentionally NOT reimplemented here. When Supabase is
     configured, uploads will use the Supabase Storage bucket 'documents'
     (RLS-scoped per user). In demo mode the existing IndexedDB code path on the
     documents page stays the source of truth — do not duplicate it here.

   ── Supabase tables expected in REAL mode (created out-of-band) ──
     deadlines           ( id, user_id, date, title, note, … )  + RLS
     permesso_practices  ( user_id PK/unique, data jsonb, … )    + RLS
   RLS policies must restrict every row to auth.uid() = user_id so the public
   anon key is safe to ship to the browser.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // Idempotent: never install twice if the script is included on a page twice.
  if (window.EIH_AUTH && window.EIH_DB) return;

  // ── Supabase JS client, loaded lazily from a CDN only in REAL mode ──
  // CSP NOTE (for vercel.json, handled by the main agent): allowing this needs
  //   script-src  https://cdn.jsdelivr.net
  //   connect-src https://*.supabase.co
  var SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

  // localStorage keys shared with the existing pages (do NOT rename).
  var LS_REGISTERED = "eih-registered";
  var LS_DEMO_USER = "eih-demo-user";

  // ── module-private state ──────────────────────────────────────────────────
  var supabase = null;     // the Supabase client in REAL mode, else null
  var configured = false;  // true once we know a real backend is wired up
  var demo = true;         // default to demo; flipped off only on success

  // ── Turnstile (verifica bot/human alla registrazione) ─────────────────────
  var _tsWidget = null, _tsLoading = null;
  function tsSiteKey() { try { return (typeof window !== "undefined" && window.EIH_TURNSTILE_SITEKEY) || null; } catch (e) { return null; } }
  function tsLoadScript() {
    if (typeof window !== "undefined" && window.turnstile) return Promise.resolve();
    if (_tsLoading) return _tsLoading;
    _tsLoading = new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true; s.defer = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
    return _tsLoading;
  }

  // ── tiny, never-throwing localStorage helpers ─────────────────────────────
  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, val); return true; } catch (e) { return false; }
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }
  function lsGetJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function lsSetJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }

  // Stable-ish id for demo records (mirrors the pages' own uid() style).
  function uid(prefix) {
    return (prefix || "d") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── INIT: ask the server whether a backend is configured, then maybe load it ─
  // Resolves to true (REAL mode) or false (DEMO mode). NEVER rejects: any error
  // path resolves false so the caller can always `await ready` without a catch.
  var ready = (function init() {
    return Promise.resolve()
      .then(function () {
        // 1) Same-origin config probe. fetch may be unavailable in odd embeds.
        if (typeof fetch !== "function") return null;
        return fetch("/api/config", {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        }).then(function (r) {
          return r && r.ok ? r.json() : null;
        });
      })
      .then(function (cfg) {
        // Site key Turnstile (pubblica) per la verifica bot alla registrazione.
        try { if (typeof window !== "undefined") window.EIH_TURNSTILE_SITEKEY = (cfg && cfg.turnstileSiteKey) || null; } catch (e) {}
        // 2) Not configured (today) → stay in demo mode, import nothing.
        if (!cfg || !cfg.configured || !cfg.url || !cfg.anonKey) {
          console.info("[EIH] Demo mode: no Supabase backend configured yet — using local storage.");
          return false;
        }
        // 3) Configured → dynamically import the Supabase client from the CDN.
        //    Native dynamic import(): la CSP del sito non abilita 'unsafe-eval',
        //    quindi `new Function` verrebbe bloccato → il client non si caricava
        //    e il sito ricadeva in demo. import() diretto è consentito.
        return import(SUPABASE_ESM)
          .then(function (mod) {
            var createClient = mod && mod.createClient;
            if (typeof createClient !== "function") {
              throw new Error("supabase-js: createClient not found in module");
            }
            supabase = createClient(cfg.url, cfg.anonKey, {
              auth: { persistSession: true, autoRefreshToken: true },
            });
            configured = true;
            demo = false;

            // Keep eih-registered in sync so gated pages work in REAL mode.
            supabase.auth.onAuthStateChange(function (event, session) {
              if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session && session.user) {
                lsSet(LS_REGISTERED, "1");
                lsSetJSON(LS_DEMO_USER, {
                  email: session.user.email || "",
                  name: (session.user.user_metadata && session.user.user_metadata.name) || "",
                });
              } else if (event === "SIGNED_OUT") {
                lsRemove(LS_REGISTERED);
                lsRemove(LS_DEMO_USER);
              }
            });

            // Sync on load: user may already have a persisted valid session.
            return supabase.auth.getSession().then(function (res) {
              var session = res && res.data && res.data.session;
              if (session && session.user) {
                lsSet(LS_REGISTERED, "1");
                lsSetJSON(LS_DEMO_USER, {
                  email: session.user.email || "",
                  name: (session.user.user_metadata && session.user.user_metadata.name) || "",
                });
              }
              console.info("[EIH] Supabase backend active.");
              return true;
            });
          })
          .catch(function (err) {
            // CDN/import failure → fall back to demo silently (info, not error).
            // Never log the keys or any secret — only a short, generic reason.
            console.info("[EIH] Supabase client unavailable — falling back to demo mode.", reason(err));
            supabase = null;
            configured = false;
            demo = true;
            return false;
          });
      })
      .catch(function (err) {
        // Any unexpected failure (config fetch, JSON, etc.) → demo mode.
        console.info("[EIH] Config unavailable — using demo mode.", reason(err));
        supabase = null;
        configured = false;
        demo = true;
        return false;
      });
  })();

  // Short, non-sensitive error string for logging (never includes keys/URLs).
  function reason(err) {
    try { return (err && err.message) ? String(err.message) : ""; } catch (e) { return ""; }
  }

  // After init settles, mark the global flags so isConfigured()/isDemo() are
  // correct whether or not the caller awaited `ready`.
  ready.then(function (ok) { configured = !!ok; demo = !ok; });

  // ════════════════════════════════════════════════════════════════════════
  // window.EIH_AUTH — authentication, identical surface in both modes.
  // Every method is async and resolves (errors are returned, not thrown) so a
  // page can rely on them without try/catch around each call.
  // ════════════════════════════════════════════════════════════════════════
  var EIH_AUTH = {
    // Promise that resolves when init has finished (true=real, false=demo).
    ready: ready,

    // Synchronous mode getters (accurate after `ready` resolves; before that
    // they reflect the safe default = demo).
    isConfigured: function () { return configured; },
    isDemo: function () { return demo; },

    // Raw Supabase client (REAL mode only; null in demo). For pages that need
    // queries beyond the EIH_DB helpers. Accurate after `ready` resolves.
    client: function () { return supabase; },

    /** Verifica bot attiva? (site key Turnstile presente) */
    captchaEnabled: function () { return !!tsSiteKey(); },
    /** Monta il widget Turnstile nel container dato (idempotente). */
    renderCaptcha: function (el) {
      var key = tsSiteKey();
      if (!key || !el) return Promise.resolve(null);
      return tsLoadScript().then(function () {
        if (typeof window === "undefined" || !window.turnstile) return null;
        if (_tsWidget != null) { try { window.turnstile.reset(_tsWidget); } catch (e) {} return _tsWidget; }
        try { _tsWidget = window.turnstile.render(el, { sitekey: key, theme: "auto" }); } catch (e) { _tsWidget = null; }
        return _tsWidget;
      });
    },
    /** Token corrente del widget ('' se non ancora risolto). */
    getCaptchaToken: function () {
      try { return (window.turnstile && _tsWidget != null) ? (window.turnstile.getResponse(_tsWidget) || "") : ""; } catch (e) { return ""; }
    },
    /** Reset del widget (i token sono monouso). */
    resetCaptcha: function () { try { if (window.turnstile && _tsWidget != null) window.turnstile.reset(_tsWidget); } catch (e) {} },

    /**
     * Register a user.
     *  REAL: supabase.auth.signUp; optional `meta` stored in user_metadata.
     *  DEMO: marks the local demo "account" so the existing gated pages work.
     * Returns { user, session, error } (REAL) or { user, demo:true } (DEMO).
     */
    signUp: function (email, password, meta, captchaToken) {
      return ready.then(function () {
        if (configured && supabase) {
          var opts = { data: meta || {} };
          if (captchaToken) opts.captchaToken = captchaToken;
          return supabase.auth
            .signUp({ email: email, password: password, options: opts })
            .then(function (res) {
              return { user: (res.data && res.data.user) || null, session: (res.data && res.data.session) || null, error: res.error || null };
            });
        }
        // DEMO: persist a minimal local profile + the registered gate.
        var name = (meta && (meta.name || meta.full_name)) || "";
        lsSet(LS_REGISTERED, "1");
        lsSetJSON(LS_DEMO_USER, { email: email || "", name: name });
        return { user: { email: email || "", name: name }, demo: true, error: null };
      });
    },

    /**
     * Sign in.
     *  REAL: supabase.auth.signInWithPassword.
     *  DEMO: same effect as signUp — marks the device as registered.
     */
    signIn: function (email, password) {
      return ready.then(function () {
        if (configured && supabase) {
          return supabase.auth
            .signInWithPassword({ email: email, password: password })
            .then(function (res) {
              return { user: (res.data && res.data.user) || null, session: (res.data && res.data.session) || null, error: res.error || null };
            });
        }
        // DEMO: keep/refresh the local profile and the registered gate.
        var existing = lsGetJSON(LS_DEMO_USER, {}) || {};
        lsSet(LS_REGISTERED, "1");
        lsSetJSON(LS_DEMO_USER, { email: email || existing.email || "", name: existing.name || "" });
        return { user: { email: email || existing.email || "", name: existing.name || "" }, demo: true, error: null };
      });
    },

    /**
     * Sign in with Google (OAuth).
     *  REAL: supabase.auth.signInWithOAuth → redirect to Google, back to `redirectTo`.
     *  DEMO: no real provider; returns { demo:true } so the caller can inform the user.
     */
    signInWithGoogle: function (redirectTo) {
      return ready.then(function () {
        if (configured && supabase) {
          return supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: redirectTo || (window.location.origin + "/dashboard") }
          }).then(function (res) {
            return { error: (res && res.error) || null };
          });
        }
        return { demo: true, error: null };
      });
    },

    /**
     * Sign out.
     *  REAL: supabase.auth.signOut.
     *  DEMO: clears the local registered gate + demo profile.
     */
    signOut: function () {
      return ready.then(function () {
        if (configured && supabase) {
          return supabase.auth.signOut().then(function (res) {
            lsRemove(LS_REGISTERED);
            lsRemove(LS_DEMO_USER);
            return { error: (res && res.error) || null };
          });
        }
        lsRemove(LS_REGISTERED);
        lsRemove(LS_DEMO_USER);
        return { error: null, demo: true };
      });
    },

    /**
     * Password reset — sends email if account exists, silently succeeds otherwise.
     * NEVER reveals whether the email is registered (anti-enumeration).
     * Returns { error: null } always from the caller's perspective.
     */
    resetPassword: function (email, redirectTo) {
      return ready.then(function () {
        if (configured && supabase) {
          return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo || (window.location.origin + '/dashboard')
          }).then(function () {
            return { error: null };
          }).catch(function () {
            return { error: null };
          });
        }
        return { error: null, demo: true };
      });
    },

    /**
     * Current user, or null if not signed in.
     *  REAL: supabase.auth.getUser → user | null.
     *  DEMO: the stored demo user object iff 'eih-registered' is set, else null.
     */
    getUser: function () {
      return ready.then(function () {
        if (configured && supabase) {
          return supabase.auth.getUser().then(function (res) {
            return (res && res.data && res.data.user) || null;
          }).catch(function () { return null; });
        }
        if (lsGet(LS_REGISTERED)) {
          return lsGetJSON(LS_DEMO_USER, { email: "", name: "" });
        }
        return null;
      });
    },

    /**
     * Subscribe to auth-state changes.
     *  REAL: supabase.auth.onAuthStateChange(cb) → returns its subscription.
     *  DEMO: no live events; call cb once with the current state and return a
     *        no-op unsubscribe handle so callers can treat both modes alike.
     * cb signature mirrors Supabase: (event, session).
     *
     * Robust to being called BEFORE init has settled: if the mode isn't known
     * yet we wait for `ready`, then either register the real subscription or
     * emit the demo event exactly once. A live forwarder bridges any real
     * subscription created post-`ready` to the caller's handle so unsubscribe
     * always works regardless of timing.
     */
    onChange: function (cb) {
      var noop = { data: { subscription: { unsubscribe: function () {} } } };
      if (typeof cb !== "function") return noop;

      // Fast path: mode already known to be REAL → return the real handle now.
      if (configured && supabase) {
        try { return supabase.auth.onAuthStateChange(cb); } catch (e) { /* fall through */ }
      }

      // Otherwise resolve after init. Keep a handle we can unsubscribe through.
      var realSub = null;       // the Supabase subscription, once created
      var cancelled = false;    // set if the caller unsubscribed before init
      ready.then(function () {
        if (cancelled) return;
        if (configured && supabase) {
          try {
            var r = supabase.auth.onAuthStateChange(cb);
            realSub = r && r.data && r.data.subscription ? r.data.subscription : null;
          } catch (e) { /* leave realSub null; nothing to forward */ }
          return;
        }
        // DEMO: emit current state once.
        var signedIn = !!lsGet(LS_REGISTERED);
        var session = signedIn ? { user: lsGetJSON(LS_DEMO_USER, { email: "", name: "" }) } : null;
        try { cb(signedIn ? "SIGNED_IN" : "SIGNED_OUT", session); } catch (e) { /* ignore */ }
      });

      // Handle that works in both modes and at any timing.
      return {
        data: {
          subscription: {
            unsubscribe: function () {
              cancelled = true;
              if (realSub && typeof realSub.unsubscribe === "function") {
                try { realSub.unsubscribe(); } catch (e) { /* ignore */ }
              }
            },
          },
        },
      };
    },
  };

  // ════════════════════════════════════════════════════════════════════════
  // window.EIH_DB — thin data layer for Phase-1 data. Works in both modes.
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Generic table helper backing a list of rows either in Supabase or in a
   * localStorage array under key `eih-<name>`.
   *
   * Returns { list, insert, remove }:
   *   list()        → Promise<Array>            (all rows for this user)
   *   insert(obj)   → Promise<row>              (adds one; returns the stored row)
   *   remove(id)    → Promise<{ error }>        (deletes by id)
   *
   * In REAL mode, RLS auto-scopes reads/writes to the signed-in user, so we do
   * not pass user_id from the client. In DEMO mode the array lives on-device.
   */
  function table(name) {
    var lsKey = "eih-" + name;
    return {
      list: function () {
        return ready.then(function () {
          if (configured && supabase) {
            return supabase.from(name).select("*").then(function (res) {
              return (res && res.data) || [];
            }).catch(function () { return []; });
          }
          var arr = lsGetJSON(lsKey, []);
          return Array.isArray(arr) ? arr : [];
        });
      },
      insert: function (obj) {
        var row = Object.assign({}, obj || {});
        return ready.then(function () {
          if (configured && supabase) {
            return supabase.from(name).insert(row).select().then(function (res) {
              var rows = (res && res.data) || [];
              return rows[0] || row;
            });
          }
          // DEMO: ensure an id, append to the on-device array.
          if (!row.id) row.id = uid();
          var arr = lsGetJSON(lsKey, []);
          if (!Array.isArray(arr)) arr = [];
          arr.push(row);
          lsSetJSON(lsKey, arr);
          return row;
        });
      },
      remove: function (id) {
        return ready.then(function () {
          if (configured && supabase) {
            return supabase.from(name).delete().eq("id", id).then(function (res) {
              return { error: (res && res.error) || null };
            });
          }
          var arr = lsGetJSON(lsKey, []);
          if (!Array.isArray(arr)) arr = [];
          arr = arr.filter(function (x) { return x && x.id !== id; });
          lsSetJSON(lsKey, arr);
          return { error: null };
        });
      },
    };
  }

  // Pre-built helper for the deadlines table/array (key: 'eih-deadlines').
  var deadlinesTable = table("deadlines");

  var EIH_DB = {
    // Expose the generic helper for any future "list" table.
    table: table,

    // ── Deadlines ── shape: { id, date:'YYYY-MM-DD', title, note } ──
    // Mirrors localStorage 'eih-deadlines' used by preview/dashboard.html.
    listDeadlines: function () {
      return deadlinesTable.list();
    },
    addDeadline: function (obj) {
      var src = obj || {};
      var row = {
        id: src.id || uid(),
        date: typeof src.date === "string" ? src.date : "",
        title: typeof src.title === "string" ? src.title : "",
        note: typeof src.note === "string" ? src.note : "",
      };
      return deadlinesTable.insert(row);
    },
    deleteDeadline: function (id) {
      return deadlinesTable.remove(id);
    },

    // ── Permesso practice ── single object per user ──
    // REAL: a row in 'permesso_practices' (RLS-scoped); we keep the practice
    //       payload under a `data` column so the existing object shape is
    //       preserved verbatim. DEMO: localStorage 'eih-permesso' (one object,
    //       NOT an array — matches preview/permesso-tracker.html).
    getPermesso: function () {
      return ready.then(function () {
        if (configured && supabase) {
          return supabase.from("permesso_practices").select("*").limit(1).then(function (res) {
            var rows = (res && res.data) || [];
            var rec = rows[0];
            if (!rec) return null;
            // Prefer a `data` payload if present; otherwise return the row.
            return rec.data != null ? rec.data : rec;
          }).catch(function () { return null; });
        }
        return lsGetJSON("eih-permesso", null);
      });
    },
    savePermesso: function (obj) {
      var practice = obj || {};
      return ready.then(function () {
        if (configured && supabase) {
          // user_id is NOT NULL with no DB default; must be sent by the client.
          // RLS INSERT policy enforces user_id = auth.uid(), so this is safe.
          return supabase.auth.getUser().then(function (res) {
            var uid = res && res.data && res.data.user && res.data.user.id;
            if (!uid) return practice; // unauthenticated — skip silently
            return supabase
              .from("permesso_practices")
              .upsert({ user_id: uid, data: practice }, { onConflict: "user_id" })
              .select()
              .then(function (res) {
                var rows = (res && res.data) || [];
                var rec = rows[0];
                return rec && rec.data != null ? rec.data : practice;
              })
              .catch(function () { return practice; });
          }).catch(function () { return practice; });
        }
        lsSetJSON("eih-permesso", practice);
        return practice;
      });
    },

    // ── Documents (files) ──
    // NOT implemented here. When configured, file uploads will use the Supabase
    // Storage bucket 'documents' (RLS per user). In demo mode the existing
    // IndexedDB path on the documents page remains the source of truth; this
    // module deliberately does not reimplement that storage.
  };

  // ── publish globals ───────────────────────────────────────────────────────
  window.EIH_AUTH = EIH_AUTH;
  window.EIH_DB = EIH_DB;
})();
