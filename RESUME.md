# 📌 RESUME — Dove siamo arrivati

> Ultimo aggiornamento: 23 giugno 2026 (sessione 2)

## 🆕 23 giugno (sessione 2): voli Amadeus + fix sicurezza/performance Supabase

- **Voli: switch a Amadeus** — `api/flights.js` riscritto per usare Amadeus Flight Cheapest Date Search (test env, chiave istantanea). Env necessarie: `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET` (developers.amadeus.com → crea app). Fino ad allora resta in demo mode.
- **Supabase security fix** — `set_updated_at` search_path immutabile; `handle_new_user` non più eseguibile via REST da anon/authenticated.
- **Supabase RLS performance** — tutte le 40+ policy RLS aggiornate con `(select auth.uid())` per evitare re-evaluation per-riga.
- **Supabase multiple permissive policies** — `community_posts` e `marketplace_ads`: 2 policy SELECT mergiate in 1 (`status='published' OR user_id=...`).

## 🆕 23 giugno: servizi esterni ATTIVATI

- **Chat AI LIVE** — `GEMINI_API_KEY` impostata su Vercel (production + preview). Fine modalità demo: la chat risponde con Gemini + RAG.
- **Email LIVE** — `RESEND_API_KEY` impostata. Form contatti (`/api/contact`) e reminder (`/api/remind`) inviano email reali a `wasapeiris@gmail.com`.
- **Supabase backend completato** — `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_SECRET_KEY` impostate; `site_url` + redirect URI auth configurati; bucket `documents` privato con policy RLS per-utente.
- **sitemap.xml** — riscritto con tutte e 29 le pagine (rimossi i path hreflang inesistenti).

## 🆕 Oggi: Supabase LIVE

- **Supabase attivato** — schema SQL (12 tabelle + trigger + RLS) eseguito, bucket `documents` privato creato.
- **Vercel** — `SUPABASE_URL` e `SUPABASE_ANON_KEY` impostati su tutti gli ambienti (production + preview + development).
- **eih-auth.js** — REAL mode completato: sincronizza `eih-registered` con la sessione Supabase (login/logout/reload). Gestione errori e conferma email nel modal login.
- **documenti.html** — aggiunto `eih-auth.js`.
- **PR #12 mergiata su main** → Vercel ha ridistribuito in produzione con tutto il codice aggiornato.

## 🆕 Ondata "qualità award" (tutta in produzione)
- **Brand**: favicon/icone app, og-image 1200×630 (anteprime WhatsApp OK), illustrazioni SVG per le card hero.
- **Motion**: smooth scroll Lenis + GSAP, parallasse hero, tipografia cinetica, marquee reattivo, progress bar.
- **PWA**: manifest + service worker (offline) + pagina 404 brand.
- **Command palette** Ctrl/Cmd+K su tutte le pagine.
- **Dark mode** con toggle persistente su tutte le pagine.
- **i18n COMPLETO**: tutte le pagine contenuto (guide, opportunità, community,
  news, mappa, chi-siamo, contatti, abbonamenti, money-transfer) tradotte
  integralmente in EN/SI/TA via `EIH_I18N_EXTRA`; termini burocratici in italiano.
- **Generatore Moduli e Lettere** (`/moduli`): 4 modelli precompilabili → PDF.
- **Atmosphere v2**: sfondo immersivo multi-layer con parallasse e mouse.
- **Dominio**: guida `DOMINIO.md` + `scripts/set-domain.sh` (switch in 1 comando).

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

**Attivare email: Resend + Cloudflare** — account GIÀ CREATI dall'utente,
manca solo la configurazione. Da fare appena si riprende:
1. **Cloudflare Email Routing**: dominio `easyitaliahub.it` → creare gli
   inoltri `info@`, `partner@`, `ads@`, `privacy@` verso la casella personale
   (wasapeiris@gmail.com). Aggiungere i record MX/TXT che Cloudflare propone.
2. **Resend**: verificare il dominio `easyitaliahub.it` (record DKIM/SPF da
   aggiungere sempre in Cloudflare DNS) e generare la API key.
3. **Vercel env**: impostare `RESEND_API_KEY` + `CONTACT_TO_EMAIL` su tutti
   gli ambienti + Redeploy. Da quel momento form contatti e newsletter
   (`api/contact.js`) escono dalla demo mode e arrivano email reali.
4. Test finale: inviare un messaggio dal form di `/contatti` e una iscrizione
   newsletter dal footer, verificare la ricezione.

### Step successivo: attivare Supabase
Richiede l'UTENTE (account + chiavi), guida completa in
`SUPABASE-SETUP.md`:
1. Creare il progetto Supabase (piano Free) e salvare la password DB.
2. Eseguire `supabase/schema.sql` nel SQL Editor.
3. Creare il bucket **privato** `documents` nello Storage.
4. Copiare **Project URL** + **anon public key**.
5. Su Vercel: aggiungere `SUPABASE_URL` e `SUPABASE_ANON_KEY` (tutti gli
   ambienti) + **Redeploy**.

Sblocca a cascata: account reali → email promemoria → pagamenti.

## ✅ Chiusi di recente
- **Contatti/link utili negli articoli** — FATTO: box "Link e contatti utili"
  in tutte le 10 sezioni di `guide.html` (+ `assegno-unico`, `diritti-inps`,
  `riconoscimento-titoli`), con link a uffici e siti ufficiali.
- **Meta Open Graph/Twitter** — FATTO: prima solo `index.html` li aveva; ora
  tutte le 25 sottopagine hanno tag OG/Twitter completi con immagine OG
  dinamica per-pagina via `/api/og?t=…&s=…`. `og-image.jpg` è un'immagine
  brandizzata reale (non placeholder).

## ℹ️ In sospeso (dopo Supabase / opzionali)
- **Dominio reale** — canonical/OG/hreflang puntano ancora al placeholder `easyitaliahub.it`.
- **Email (Resend)** — `api/contact.js` ora inoltra form contatti + newsletter
  al proprietario; `api/remind.js` invia i promemoria. Per attivarle servono su
  Vercel: `RESEND_API_KEY` (dominio verificato su Resend) e `CONTACT_TO_EMAIL`
  (casella dove ricevere le notifiche). Senza chiavi → demo mode.
- **Inoltro caselle dominio** — creare/inoltrare `info@`, `partner@`, `ads@`,
  `privacy@easyitaliahub.it` verso la casella personale (es. Cloudflare Email
  Routing), altrimenti i mailto del sito rimbalzano.
- **Pagamenti (Stripe)** — flusso reale per il freemium (`abbonamenti.html` è solo vetrina);
  env future `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (solo server).

## Note ambiente
- Server preview locale: `npx serve . -l 3000` dalla root del repo.
- Funzioni serverless in `api/` (chat, fx, news, config) — girano su Vercel.
