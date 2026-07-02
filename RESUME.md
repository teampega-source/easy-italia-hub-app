# 📌 RESUME — Dove siamo arrivati

> Ultimo aggiornamento: 2 luglio 2026 (ricognizione + fix)

## 🆕 2 luglio: ricognizione completa + fix sicurezza

- **Supabase security FIX DEFINITIVO** — `handle_new_user()` e `set_updated_at()` avevano ancora EXECUTE a `PUBLIC` (la revoca del 23/6 su anon/authenticated era inefficace perché ereditavano da PUBLIC). Migration `revoke_public_execute_trigger_functions` applicata → **advisor security: 0 lint**.
- **`api/go.js`** — redirect via `res.redirect()` sostituito con `statusCode`/`Location` espliciti (elimina il path deprecato `url.parse` DEP0169 negli helper Vercel).
- **RESUME.md riallineato** — riferimenti corretti: le API email sono `api/email.js` (form contatti) e `api/newsletter.js` (`api/contact.js`/`api/remind.js` non esistono più).
- **Doppio progetto Vercel RISOLTO** — duplicato `easy-italia-hub-app` (solo *.vercel.app, nessun dominio custom) eliminato dal dashboard. Resta solo `deploy` (easyitaliahub.it), verificato live: ogni push ora builda una volta sola.

## Stato attuale — REALE

**LIVE su `easyitaliahub.it`** (Vercel, auto-deploy da `main`). Stack: HTML statico + Vanilla JS + Vercel Serverless + Supabase + Gemini AI. Nessun build step.

### Funziona (verificato live)
- **Chat AI** — Gemini + RAG (`api/chat.js`, `api/_knowledge.js`), fallback modelli, rate-limit, hardening.
- **Supabase** — progetto `lmbkskjezffizvivnqyc` ACTIVE_HEALTHY (Postgres 17, eu-west-1): 12 tabelle tutte con RLS, bucket `documents` privato, advisor security a zero. **Tabelle a 0 righe: nessun utente reale ancora.**
- **Email** — Resend LIVE (`api/email.js`, `api/newsletter.js` → wasapeiris@gmail.com).
- **Sito** — ~50 pagine, i18n IT/EN/SI/TA, PWA, dark mode, command palette, SEO/OG dinamici (`/api/og`), security headers, cron `/api/flight-digest` (lun 07:00).
- **GA4** — attivo con ID reale `G-13TEJWCKZZ` in `eih.js` (decisione: si tiene).
- **Email invio dal dominio** — Resend verificato via DNS: DKIM `resend._domainkey` + SPF/MX su `send.easyitaliahub.it` attivi; invio da `notifiche@easyitaliahub.it`. (Ricezione `info@` ecc. non configurata: nessun MX sul root, NS su IONOS — serve solo se si vuole ricevere posta sul dominio.)

### Aperto / bloccato
- **Voli Amadeus** — tralasciato per decisione utente (2/7). `api/flights.js` resta in demo; riattivabile con `AMADEUS_CLIENT_ID`/`AMADEUS_CLIENT_SECRET`.
- **Stripe** — `abbonamenti.html` è vetrina; flusso reale richiede `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.
- **Branch `claude/jarvis-r8pi7k`** — deciso: **eliminare** (2/7, contenuto obsoleto: restyling superato + chat `/ai` mai usata). Cancellazione bloccata dai permessi della sessione → eliminare dal dashboard GitHub (Branches → cestino). SHA di recupero: `80439d4`.

## Note ambiente
- Preview locale: `npx serve . -l 3000` dalla root.
- Red-team chat: `node scripts/chat-redteam.mjs <url>`.
- Migrations Supabase registrate: `create_documents_bucket_and_policies`, `fix_rls_initplan_security_searchpath`, `revoke_public_execute_trigger_functions`.
