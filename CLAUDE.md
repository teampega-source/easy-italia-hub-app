# Istruzioni per Claude

## Stile di risposta
- Estremamente breve e orientato all'azione
- Rispondere sempre in italiano
- Zero frasi di riempimento (no "Certamente", "Ecco la soluzione", "Ottima domanda", ecc.)
- Non ripetere la richiesta dell'utente
- Non spiegare cosa si sta per fare — farlo e basta
- Spiegare il "perché" solo se non è ovvio dal contesto

## Output
- Emettere solo il codice o le modifiche essenziali
- Niente documentazione non richiesta
- Niente commenti ridondanti nel codice

## Flusso di lavoro
- Usare `/plan` per analizzare il codebase prima di scrivere modifiche complesse
- Usare `/compact` per condensare la cronologia quando il contesto diventa lungo

---

# Codebase: Easy Italia Hub

## Panoramica

Piattaforma multilingue (IT/EN/SI/TA) per la comunità dello Sri Lanka in Italia. Fornisce guide burocratiche, AI assistant, marketplace comunitario, e strumenti utili (tracker permesso, CV builder, calcolatori INPS, ecc.).

**Stack:** HTML statico + Vanilla JS + Vercel Serverless Functions + Supabase + Gemini AI

**Deploy:** Vercel (auto-deploy su push a `main`). Nessun build step — il sito viene servito as-is.

**Stato corrente:** Funziona in modalità demo (dati in localStorage/IndexedDB). Backend Supabase non ancora attivato in produzione.

---

## Struttura directory

```
/
├── index.html                  # Landing page principale
├── [24 altre pagine .html]     # Una per feature/sezione
├── eih.css                     # Stili globali (variabili CSS, tema, layout)
├── eih.js                      # Runtime condiviso (nav, footer, i18n, dark mode)
├── eih-auth.js                 # Auth + data bridge (Supabase o localStorage)
├── fx-comparator.js            # Widget comparatore valute
├── news-ticker.js              # Ticker notizie RSS
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker (offline)
├── vercel.json                 # Config Vercel + security headers
├── package.json                # Solo @vercel/og come dipendenza
├── api/                        # Vercel Serverless Functions
│   ├── chat.js                 # AI Consigliere (Gemini + RAG)
│   ├── _knowledge.js           # Knowledge base RAG (14 argomenti)
│   ├── config.js               # Endpoint config runtime (chiavi Supabase)
│   ├── contact.js              # Form contatti (Resend)
│   ├── remind.js               # Reminder email (Resend)
│   ├── news.js                 # Feed notizie (RSS scraper)
│   ├── fx.js                   # Tassi di cambio (cached 24h)
│   ├── og.mjs                  # OG image generator (@vercel/og)
│   ├── stripe-checkout.js      # Avvia sessione Stripe
│   ├── stripe-donate.js        # Donazioni one-off
│   ├── stripe-webhook.js       # Webhook Stripe → Supabase
│   └── test/chat-redteam.mjs   # Red-team suite (12 test sicurezza AI)
├── assets/
│   ├── eih-*.css               # CSS component-scoped
│   ├── img/                    # SVG, illustrazioni, loghi
│   └── vendor/                 # Leaflet, i18n, librerie terze
├── supabase/
│   └── schema.sql              # Schema DB completo (12 tabelle, RLS, trigger)
└── scripts/
    └── set-domain.sh           # Script idempotente per cambio dominio
```

---

## Pagine HTML (25 totale)

| File | Scopo |
|------|-------|
| `index.html` | Landing page: hero, FAQ, FX comparator, news ticker, modal auth |
| `percorso.html` | "Il mio percorso": 9 fasi di vita, simulatore stipendio, quiz italiano |
| `guide.html` | Guide burocratiche (permesso, SPID, ecc.) con sezioni annidate |
| `community.html` | Marketplace, connessioni, eventi |
| `dashboard.html` | Dashboard utente: scadenze, documenti, profilo |
| `documenti.html` | Archiviatore documenti (upload, scadenze) |
| `permesso-tracker.html` | Tracker rinnovo permesso con reminder |
| `cv-builder.html` | Generatore CV + export PDF |
| `moduli.html` | Template lettere (4 preset) |
| `assegno-unico.html` | Calcolatore assegno unico |
| `diritti-inps.html` | Checker diritti INPS |
| `money-transfer.html` | Comparatore rimesse |
| `mappa.html` | Mappa servizi (Leaflet + geolocalizzazione) |
| `news.html` | Feed notizie (RSS aggregator) |
| `opportunita.html` | Lavoro e studio |
| `abbonamenti.html` | Piani abbonamento (Stripe) |
| `chi-siamo.html`, `contatti.html` | Istituzionali |
| `privacy.html`, `cookie.html`, `termini.html`, `note-legali.html` | Legali |
| `benvenuto.html` | Onboarding nuovo utente |
| `404.html` | Pagina 404 brandizzata |

---

## JavaScript (browser)

### `eih.js` — Runtime condiviso
- Inietta nav + footer su ogni pagina (pattern DRY)
- Sistema i18n: 4 lingue (IT/EN/SI/TA), persistito in localStorage
- Toggle menu mobile, lang switcher, dark mode
- Animazioni: page transitions, scroll-reveal, custom cursor, preloader

### `eih-auth.js` — Auth + data bridge
**Architettura dual-mode:**
- **REAL:** Client Supabase JS (attivo quando env vars impostate)
- **DEMO:** localStorage / IndexedDB (modalità attuale in produzione)

Funzioni principali: sign up/in/out, `onAuthStateChange()`, sync dati utente.
Forme dati: `eih-deadlines`, `eih-permesso`, profilo utente.

### `fx-comparator.js`
- Chiama `/api/fx` per tassi live
- Comparazione multi-valuta (USD, EUR, GBP, INR, LKR)
- Grafici + trend storici (cached)

### `news-ticker.js`
- Fetcha `/api/news`
- Animazione scrolling marquee

---

## API Serverless (`/api/`)

### `chat.js` — AI Consigliere
- Provider: Google Gemini (free tier, fallback chain)
- RAG via `_knowledge.js` (keyword match, top-K)
- **Sicurezza:** 12-threat model (prompt injection, jailbreak, DoS, leak segreti)
- Limiti: max 30 messaggi, 4000 char/msg, 16000 char totali
- Rate limit: 20 req/min per IP (best-effort, warm instance)
- Demo mode quando `GEMINI_API_KEY` non impostata

### `_knowledge.js` — Knowledge base RAG
Chunk curati su 14 argomenti: fasi piattaforma, permesso, SPID, codice fiscale, residenza, tessera sanitaria, INPS, cittadinanza, rimesse, fatturazione, community, marketplace.

### `config.js`
Restituisce `{ configured, url, anonKey }` — consente auto-upgrade da demo a Supabase senza cambio codice client. Cache CDN 60s.

### `contact.js` / `remind.js`
Email via Resend API. Demo mode (200 OK senza invio) quando `RESEND_API_KEY` non impostata.

### `news.js` / `fx.js`
Cache rispettivamente 4h e 24h (controllo costi). Feed RSS da 3–4 fonti Sri Lanka.

### `stripe-*.js`
Checkout, donazioni, webhook → aggiorna tabella `subscriptions` su Supabase.

---

## Database (Supabase/PostgreSQL)

Schema in `/supabase/schema.sql`. 12 tabelle + 2 funzioni + trigger + RLS.

**Tabelle principali:**
- `profiles` — 1:1 con `auth.users` (nome, lingua, città)
- `subscriptions` — piani (free/premium/premium_plus/business), stato Stripe
- `deadlines` — scadenze utente (sync con localStorage `eih-deadlines`)
- `permesso_practices` — dati tracker (JSONB, sync con localStorage `eih-permesso`)
- `documents` — metadati file (ref a Supabase Storage bucket `documents`)
- `chat_history` — log conversazioni AI (JSONB messages)

**RLS:** Ogni tabella ha policy `WHERE auth.uid() = user_id`. La anon key è sicura nel browser.

**Trigger:**
- `set_updated_at()` — bumpa `updated_at` su ogni UPDATE
- `handle_new_user()` — crea riga `profiles` al signup

---

## Stili CSS

| File | Scopo |
|------|-------|
| `eih.css` | Tema core: variabili CSS, tipografia, grid, animazioni |
| `eih-theme.css` | Override dark mode |
| `eih-atmosphere.css` | Sfondi animati canvas, parallax, mouse tracking |
| `eih-welcome.css` | Stili landing page |
| `assets/eih-*.css` | Component-scoped (modal, buttons, cards) |

**Font:** Playfair Display (headings) + Inter (body) via Fontshare CDN.
**Colore tema:** `#7d7058` (taupe).

---

## Variabili d'ambiente

### Config Supabase (esposte al browser via `/api/config`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Segreti server-only
- `SUPABASE_SERVICE_ROLE_KEY` — admin (solo webhook, mai esposta)
- `GEMINI_API_KEY` — accesso LLM (da aistudio.google.com, free tier)
- `GEMINI_MODEL` — default: `gemini-2.5-flash`
- `RESEND_API_KEY` — email service
- `CONTACT_TO_EMAIL` — destinatario form contatto
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Tutte opzionali:** app funziona al 100% in demo mode senza nessuna di queste.

---

## Convenzioni di sviluppo

### HTML
- Ogni pagina include `<link href="eih.css">` + `<script src="eih.js">` + `<script src="eih-auth.js">`
- Nav e footer non sono nel sorgente HTML — vengono iniettati da `eih.js`
- URL canonici senza `.html` (clean URLs via `vercel.json`)

### JavaScript
- Vanilla JS, no framework, no build tool
- Dati persistiti in localStorage con prefisso `eih-`
- Nessuna libreria npm nel browser (tutto CDN o vendor locale)
- Funzioni API via `fetch()` verso `/api/*`

### CSS
- Variabili CSS per colori/spacing (no preprocessor)
- Selettori specifici per componente (no utility-first)
- Dark mode via classe `.dark` su `<body>` + variabili ridefinite

### API Functions
- CommonJS (`require()`), non ESM (eccetto `og.mjs`)
- Sempre `Content-Type: application/json` in risposta
- CORS: `Access-Control-Allow-Origin: *` su tutti gli endpoint
- Demo mode esplicito quando env vars mancanti

---

## Sicurezza

- **CSP** in `vercel.json`: allowlist per Unsplash, OSM, Stripe, Fontshare, Leaflet
- **HSTS**, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- **RLS Supabase**: ogni query scoped a `auth.uid()`
- **Rate limit chat**: 20 req/min per IP (best-effort)
- **Hardening AI**: sistema prompt resistente a 12 categorie di attacchi (vedi `api/HARDENING.md`)
- **Input bounds**: messaggi chat capped a 30 turni, 4KB ciascuno, 16KB totale

---

## Comandi utili

```bash
# Preview locale
npx serve . -l 3000

# Cambio dominio (es. da placeholder a dominio reale)
./scripts/set-domain.sh easyitaliahub.it

# Red-team test AI endpoint
node api/test/chat-redteam.mjs https://your-deploy.vercel.app
```

**Non esiste build step.** Non eseguire `npm run build` o simili.

---

## Prossimi passi (da RESUME.md)

1. **Email:** Attivare Cloudflare Email Routing + verificare dominio su Resend → impostare `RESEND_API_KEY` e `CONTACT_TO_EMAIL`
2. **Supabase:** Creare progetto, eseguire `supabase/schema.sql`, creare bucket `documents` (privato), impostare `SUPABASE_URL` + `SUPABASE_ANON_KEY` → redeploy (auto-upgrade da demo)
3. **Stripe:** Setup account + prodotti, verificare webhook → impostare `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
4. **Post-launch:** Dominio reale via `set-domain.sh`, Google Search Console, GA4

---

## File di documentazione aggiuntiva

| File | Contenuto |
|------|-----------|
| `README.md` | Overview progetto + setup deploy |
| `RESUME.md` | Stato dettagliato + prossimi passi |
| `SUPABASE-SETUP.md` | Guida attivazione backend step-by-step |
| `DOMINIO.md` | Guida cambio dominio |
| `api/README.md` | Setup Gemini free tier |
| `api/HARDENING.md` | Analisi sicurezza AI (threat model) |
