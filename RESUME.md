# 📌 RESUME — Dove siamo arrivati

> Ultimo aggiornamento: 11 giugno 2026 (sera)

## 🆕 Ondata "qualità award" (tutta in produzione)
- **Brand**: favicon/icone app, og-image 1200×630 (anteprime WhatsApp OK), illustrazioni SVG per le card hero.
- **Motion**: smooth scroll Lenis + GSAP, parallasse hero, tipografia cinetica, marquee reattivo, progress bar.
- **PWA**: manifest + service worker (offline) + pagina 404 brand.
- **Command palette** Ctrl/Cmd+K su tutte le pagine.
- **Dark mode** con toggle persistente su tutte le pagine.
- **i18n**: tamil aggiunto al layer condiviso (nav/footer ora IT/EN/SI/TA);
  titolo+intro tradotti in EN/SI/TA sulle 10 pagine principali via `EIH_I18N_EXTRA`.
  **Resta da fare**: corpo completo delle pagine interne nelle 4 lingue.

## Stato attuale
Il sito **Easy Italia Hub** è LIVE su Vercel con **deploy automatico da GitHub**
(ogni push su `main` ridistribuisce). Frontend e strumenti demo sono completi;
il prossimo blocco di lavoro è l'**attivazione di Supabase** (account reali).

## ✅ Completato

### Sito e contenuti (~20 pagine)
- **Landing `index.html`** — tema chiaro editoriale, hero "La comunità srilankese
  in Italia", FAQ, statistiche animate, widget rotante "In evidenza", ticker news
  Sri Lanka (RSS), comparatore tassi di cambio (FX), card cliccabili con sfondi
  animati, modali auth + pacchetti, footer legale.
- **Il Mio Percorso `percorso.html`** — Life Journey a 9 fasi con onboarding
  guidato, simulatore busta paga, simulatore mutuo, mini-quiz di italiano.
- **Pagine contenuto** — guide, community, news, mappa interattiva (Leaflet),
  dashboard, opportunità, money-transfer, chi-siamo, contatti, abbonamenti
  + pagine legali (privacy, cookie, termini, note-legali).
- **SEO completo** — title/description, canonical, OG, Twitter, hreflang
  (IT/EN/SI/TA), JSON-LD, robots.txt, sitemap.xml. i18n della home (teaser FX + FAQ).

### Chat AI
- Backend serverless `api/chat.js` su **Gemini** con catena di fallback dei
  modelli (priorità `gemini-2.5-flash`, quota free-tier).
- Hardening anti-abuso (`api/HARDENING.md`) + test red-team
  (`api/test/chat-redteam.mjs`). Knowledge base in `api/_knowledge.js`.

### Strumenti "Fase 1" (client-side, modalità demo)
- **Tracker Permesso di Soggiorno** — `permesso-tracker.html` (localStorage `eih-permesso`).
- **CV Builder** — `cv-builder.html`.
- **Archivio Documenti** — `documenti.html` (IndexedDB `eih-docs`).
- **Dashboard** — scadenze in localStorage (`eih-deadlines`).

### Backend Supabase (pronto ma SPENTO)
- `supabase/schema.sql` — schema completo: 12 tabelle, trigger profili, RLS.
- `eih-auth.js` — layer EIH_AUTH/EIH_DB; landing auth + dashboard + tracker già
  cablati per passare ad account reali.
- `SUPABASE-SETUP.md` — guida passo-passo per l'attivazione.
- Finché le env non ci sono, l'app resta automaticamente in **modalità demo**
  (dati solo nel browser, nessuna chiamata di rete a Supabase).

### Infrastruttura
- Deploy Vercel PRODUZIONE attivo, repo GitHub `teampega-source/easy-italia-hub-app`
  collegato (push su `main` → redeploy automatico).
- Security headers verificati live (CSP, HSTS, nosniff, X-Frame DENY,
  Referrer-Policy, Permissions-Policy) via `vercel.json`. CSP include Leaflet.

## ⏭️ PROSSIMO STEP (riprendere da qui)

**Attivare Supabase** — richiede l'UTENTE (account + chiavi), guida completa in
`SUPABASE-SETUP.md`:
1. Creare il progetto Supabase (piano Free) e salvare la password DB.
2. Eseguire `supabase/schema.sql` nel SQL Editor.
3. Creare il bucket **privato** `documents` nello Storage.
4. Copiare **Project URL** + **anon public key**.
5. Su Vercel: aggiungere `SUPABASE_URL` e `SUPABASE_ANON_KEY` (tutti gli
   ambienti) + **Redeploy**.

Sblocca a cascata: account reali → email promemoria → pagamenti.

## ℹ️ In sospeso (dopo Supabase / opzionali)
- **Dominio reale** — canonical/OG/hreflang puntano ancora al placeholder `easyitaliahub.it`.
- **Immagine OG 1200×630** — `og-image.jpg` ancora placeholder (anteprime WhatsApp/social).
- **Email transazionali (Resend)** — promemoria scadenze; env futura `RESEND_API_KEY` (solo server).
- **Pagamenti (Stripe)** — flusso reale per il freemium (`abbonamenti.html` è solo vetrina);
  env future `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (solo server).

## Note ambiente
- Server preview locale: `npx serve . -l 3000` dalla root del repo.
- Funzioni serverless in `api/` (chat, fx, news, config) — girano su Vercel.
