# 📌 RESUME — Dove siamo arrivati

> Ultimo aggiornamento: 2 luglio 2026 (ricognizione + fix)

## 🆕 2 luglio: ricognizione completa + fix sicurezza

- **Supabase security FIX DEFINITIVO** — `handle_new_user()` e `set_updated_at()` avevano ancora EXECUTE a `PUBLIC` (la revoca del 23/6 su anon/authenticated era inefficace perché ereditavano da PUBLIC). Migration `revoke_public_execute_trigger_functions` applicata → **advisor security: 0 lint**.
- **`api/go.js`** — redirect via `res.redirect()` sostituito con `statusCode`/`Location` espliciti (elimina il path deprecato `url.parse` DEP0169 negli helper Vercel).
- **RESUME.md riallineato** — riferimenti corretti: le API email sono `api/email.js` (form contatti) e `api/newsletter.js` (`api/contact.js`/`api/remind.js` non esistono più).

## Stato attuale — REALE

**LIVE su `easyitaliahub.it`** (Vercel, auto-deploy da `main`). Stack: HTML statico + Vanilla JS + Vercel Serverless + Supabase + Gemini AI. Nessun build step.

### Funziona (verificato live)
- **Chat AI** — Gemini + RAG (`api/chat.js`, `api/_knowledge.js`), fallback modelli, rate-limit, hardening.
- **Supabase** — progetto `lmbkskjezffizvivnqyc` ACTIVE_HEALTHY (Postgres 17, eu-west-1): 12 tabelle tutte con RLS, bucket `documents` privato, advisor security a zero. **Tabelle a 0 righe: nessun utente reale ancora.**
- **Email** — Resend LIVE (`api/email.js`, `api/newsletter.js` → wasapeiris@gmail.com).
- **Sito** — ~50 pagine, i18n IT/EN/SI/TA, PWA, dark mode, command palette, SEO/OG dinamici (`/api/og`), security headers, cron `/api/flight-digest` (lun 07:00).

### Aperto / bloccato
- **GA4** — `eih.js` ha ancora placeholder `G-XXXXXXXXXX`: serve creare la property GA4 e impostare l'ID reale (o rimuovere il codice).
- **Doppio progetto Vercel** — `deploy` (serve il dominio) + `easy-italia-hub-app` (solo vercel.app) puntano allo stesso repo → ogni push builda 2 volte. Eliminare il duplicato dal dashboard Vercel (azione manuale, distruttiva).
- **Voli Amadeus** — `api/flights.js` pronto, in demo finché mancano `AMADEUS_CLIENT_ID`/`AMADEUS_CLIENT_SECRET` (developers.amadeus.com).
- **Email dominio** — Cloudflare Email Routing (`info@`, `partner@`, `ads@`, `privacy@easyitaliahub.it`) + verifica dominio su Resend (DKIM/SPF): da fare, servono gli account dell'utente.
- **Stripe** — `abbonamenti.html` è vetrina; flusso reale richiede `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.
- **Branch `claude/jarvis-r8pi7k`** — chat AI personale `/ai` via proxy NVIDIA NIM + Gradio "nim-space" (mai in produzione): decidere se mergiare, tenere o archiviare.

## Note ambiente
- Preview locale: `npx serve . -l 3000` dalla root.
- Red-team chat: `node scripts/chat-redteam.mjs <url>`.
- Migrations Supabase registrate: `create_documents_bucket_and_policies`, `fix_rls_initplan_security_searchpath`, `revoke_public_execute_trigger_functions`.
