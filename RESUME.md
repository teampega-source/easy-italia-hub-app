# 📌 RESUME — Dove siamo arrivati

> Ultimo aggiornamento: 3 agosto 2026 (lingua predefinita inglese)

## 🆕 3 agosto: la lingua predefinita del sito è l'inglese

Chi arriva senza aver mai scelto una lingua vede il sito in inglese. L'italiano è
diventato una scelta come le altre. Verifica: `node scripts/audit-lingua-predefinita.mjs`
apre ogni pagina con `localStorage` vuoto — 59 su 59 partono in inglese.

- **Una sola fonte di verità** — lo snippet in cima al `<head>` (uguale su tutte le
  61 pagine) calcola la lingua e la espone come `window.EIH_LANG`. Prima il valore
  predefinito `'it'` era ripetuto in una ventina di punti fra script e pagine.
- **Applicare una lingua non è sceglierla** — `applyLang` salvava `eih-lang` a ogni
  caricamento, quindi ogni visitatore aveva «italiano» in memoria pur non avendolo
  mai chiesto. Ora salva solo il selettore, e insieme scrive `eih-lang-scelta`.
  Chi non ha quel segno riparte dall'inglese, una volta sola: **chi aveva scelto
  singalese o tamil prima di oggi perde la preferenza** e deve rifarla.
- **Niente più `navigator.language`** — un browser impostato in italiano non è una
  scelta fatta sul sito.
- **Service worker a `eih-v99`** — gli asset sono serviti dalla cache prima della
  rete: senza cambiare versione, chi ha il sito installato avrebbe continuato a
  ricevere i vecchi script.
- **Canonical legato all'indirizzo, non alla preferenza** — dipendeva dalla lingua
  attiva; con l'inglese predefinito ogni pagina senza prefisso avrebbe dichiarato
  di essere `/en`, anche a Google.
- **`api/chat.js`** risponde in inglese quando il client non dichiara la lingua.

**Resta in italiano, e va deciso a parte:** `<title>`, `<meta name="description">`
e i tag Open Graph di tutte le pagine, più `og:locale: it_IT`. La traduzione è
client-side, quindi l'anteprima di un link su WhatsApp o Facebook e il titolo che
Google mostra restano italiani. Tradurli significa rifare 59 pagine e mettere in
conto l'effetto sul posizionamento delle ricerche italiane.

## 3 agosto: il sito è tradotto per intero

## 🆕 3 agosto: il sito è tradotto per intero

- **Audit delle lingue a zero** — `node scripts/audit-lingue.mjs` (59 pagine × en/si/ta) non trova più né chiavi `data-i18n` ferme all'italiano né frammenti di corpo non tradotti; `node scripts/audit-cornice.mjs` conferma menu, piede e modali. Si partiva da 341 frammenti in singalese su 51 pagine.
- **Causa dei titoli in italiano** — `eih-motion.js` spezza ogni titolo in una `<span>` per parola e in italiano non ha nessun traduttore da aspettare: l'estrazione registrava `Aprire | un | conto`, impronte che nessuna traduzione poteva agganciare. `scripts/estrai-testi.mjs` ora blocca quello script.
- **`data-i18n-ph` era applicato solo da `assets/index.js`** — sulle pagine col solo `eih.js` i segnaposto dei campi restavano in italiano. Ora lo applica anche `eih.js`.
- **Eccezioni nel markup** — nomi propri, marchi, sigle di volo, codici fiscali, hashtag, token colore e email d'esempio sono marcati `data-no-tr`, con la ragione accanto al testo. Nuovi strumenti: `scripts/segna-no-tr.py` e `scripts/elenca-non-tradotti.mjs`.
- **Dizionari potati** — tolte 122 voci morte da `traduzioni/` (74 identiche all'italiano, 48 residui dei titoli spezzati): `assets/i18n/` non cambia di un byte.
- **Produzione verificata** — 59/59 HTML e 180/180 dizionari serviti da `easyitaliahub.it` identici al repo (`/abbonamenti` è un redirect voluto in `vercel.json`).
- Procedimento e trappole in `.references/ripresa-traduzioni.md` (parola magica: `riprendi traduzioni`).

## 2 luglio: ricognizione completa + fix sicurezza

- **Supabase security FIX DEFINITIVO** — `handle_new_user()` e `set_updated_at()` avevano ancora EXECUTE a `PUBLIC` (la revoca del 23/6 su anon/authenticated era inefficace perché ereditavano da PUBLIC). Migration `revoke_public_execute_trigger_functions` applicata → **advisor security: 0 lint**.
- **`api/go.js`** — redirect via `res.redirect()` sostituito con `statusCode`/`Location` espliciti (elimina il path deprecato `url.parse` DEP0169 negli helper Vercel).
- **RESUME.md riallineato** — riferimenti corretti: le API email sono `api/email.js` (form contatti) e `api/newsletter.js` (`api/contact.js`/`api/remind.js` non esistono più).
- **Doppio progetto Vercel RISOLTO** — duplicato `easy-italia-hub-app` (solo *.vercel.app, nessun dominio custom) eliminato dal dashboard. Resta solo `deploy` (easyitaliahub.it), verificato live: ogni push ora builda una volta sola.
- **Branch `claude/jarvis-r8pi7k` ELIMINATO** — contenuto obsoleto (restyling superato + chat `/ai` mai usata). SHA di recupero: `80439d4`.

## Stato attuale — REALE

**LIVE su `easyitaliahub.it`** (Vercel, auto-deploy da `main`). Stack: HTML statico + Vanilla JS + Vercel Serverless + Supabase + Gemini AI. Nessun build step.

### Funziona (verificato live)
- **Chat AI** — Gemini + RAG (`api/chat.js`, `api/_knowledge.js`), fallback modelli, rate-limit, hardening.
- **Supabase** — progetto `lmbkskjezffizvivnqyc` ACTIVE_HEALTHY (Postgres 17, eu-west-1): 12 tabelle tutte con RLS, bucket `documents` privato, advisor security a zero. **Tabelle a 0 righe: nessun utente reale ancora.**
- **Email** — Resend LIVE (`api/email.js`, `api/newsletter.js` → wasapeiris@gmail.com).
- **Sito** — 59 pagine, i18n IT/EN/SI/TA tradotto per intero (audit a zero), PWA, dark mode, command palette, SEO/OG dinamici (`/api/og`), security headers, cron `/api/flight-digest` (lun 07:00).
- **GA4** — attivo con ID reale `G-13TEJWCKZZ` in `eih.js` (decisione: si tiene).
- **Email invio dal dominio** — Resend verificato via DNS: DKIM `resend._domainkey` + SPF/MX su `send.easyitaliahub.it` attivi; invio da `notifiche@easyitaliahub.it`. (Ricezione `info@` ecc. non configurata: nessun MX sul root, NS su IONOS — serve solo se si vuole ricevere posta sul dominio.)

### Aperto / bloccato
- **Voli Amadeus** — tralasciato per decisione utente (2/7). `api/flights.js` resta in demo; riattivabile con `AMADEUS_CLIENT_ID`/`AMADEUS_CLIENT_SECRET`.
- **Stripe** — `abbonamenti.html` è vetrina; flusso reale richiede `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.

## Note ambiente
- Preview locale: `npx serve . -l 3000` dalla root.
- Red-team chat: `node scripts/chat-redteam.mjs <url>`.
- Migrations Supabase registrate: `create_documents_bucket_and_policies`, `fix_rls_initplan_security_searchpath`, `revoke_public_execute_trigger_functions`.
