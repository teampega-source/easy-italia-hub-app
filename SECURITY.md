# Sicurezza — Easy Italia Hub

Ultimo aggiornamento: 27 novembre 2026.

Questo documento traduce le 19 misure richieste in stato reale. **Non tutte
possono essere chiuse da qui**: alcune vivono nella dashboard Supabase, in
Vercel o in GitHub. Dove serve un accesso che il repository non ha, lo dico
esplicitamente invece di segnare una spunta falsa.

## Quadro rapido

| # | Misura | Stato | Dove |
|---|--------|-------|------|
| 1 | Chiave pubblica del database | ✅ nel codice | `api/config.js` espone solo URL + anon key |
| 2 | RLS | 🟡 pronta, da applicare | `supabase/migration-010.sql`, `migration-012-hardening.sql` |
| 3 | Crittografia dati sensibili | 🟡 at-rest Supabase; field-level non implementato | vedi sotto |
| 4 | Autenticazione sul server | ✅ per Stripe; form pubblici per design | `api/stripe.js`, `api/_security.js` |
| 5 | Accesso ai log | 🟡 codice ripulito; dashboard non disponibile | `logError`, Vercel Logs |
| 6 | Manomissione campi | ✅ identità dal JWT, non dal body | `api/stripe.js`, RLS |
| 7 | Cookie di sessione | 🟡 non usiamo cookie nostri; Supabase usa storage client | vedi sotto |
| 8 | Hash password | ✅ gestito da Supabase Auth | Supabase |
| 9 | Tentativi di accesso | 🟡 rate limit applicativo + limiti Supabase | `api/_ratelimit.js` |
| 10 | Protezioni bot | 🟡 Turnstile predisposto, widget da montare | `api/_security.js` |
| 11 | Query parametrizzate | ✅ PostgREST/encodeURIComponent, niente SQL concatenato | `api/*` |
| 12 | Validazione input | ✅ helper condiviso | `api/_security.js` |
| 13 | Escaping URL/contenuti | ✅ `escapeHtml` + `safeUrl` + CSP | `api/_security.js` |
| 14 | Limite upload | 🟡 SQL pronto; limite client da verificare | `migration-012` |
| 15 | Risposte API minime | ✅ niente service key, errori generici | `api/config.js`, `_security.js` |
| 16 | Header di sicurezza | ✅ | `vercel.json` |
| 17 | HTTPS forzato | ✅ HSTS + CSP `upgrade-insecure-requests` | `vercel.json` |
| 18 | Scansione dipendenze | ✅ 0 high/critical; 2 moderate note | `npm audit`, Dependabot |
| 19 | Documentazione | ✅ questo file | — |

## Dettaglio e cose da fare in dashboard

### 1. Chiave pubblica
`api/config.js` restituisce solo `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`TURNSTILE_SITE_KEY` e la chiave pubblica VAPID. Non legge né restituisce
`SUPABASE_SERVICE_ROLE_KEY`. La anon key è pubblica per progetto: la protezione
vera è la RLS.

### 2. RLS
- `migration-010.sql` toglie INSERT/UPDATE/DELETE su `subscriptions`: il piano
  lo scrive solo il webhook Stripe con service role.
- `migration-012-hardening.sql` crea `content_calendar` e `news_items` con RLS
  attiva e nessuna policy (solo service role), aggiunge le colonne newsletter e
  revoca i grant diretti.
- **Da fare:** eseguire `migration-012-hardening.sql` nel SQL Editor del progetto
  `lmbkskjezffizvivnqyc`. Verifica:
  ```sql
  select tablename, rowsecurity from pg_tables
  where schemaname = 'public' order by tablename;
  ```
  Tutte le tabelle con dati utente devono avere `rowsecurity = true`.

### 3. Crittografia
Supabase cifra i dati at-rest e in transito (TLS). Non salviamo numeri di carta:
Stripe ospita il checkout. I dati del tracker permesso sono personali ma
necessari; non vanno duplicati in analytics, email o log.
**Non implementato:** cifratura field-level con chiave gestita dall'app. Farlo
bene richiede un KMS/Vault e una migrazione dei dati; senza chiave disponibile
non ha senso aggiungere `pgcrypto` con la chiave nel codice. Se il rischio lo
richiede, la via è Supabase Vault + una funzione server-side che decifra solo
per il proprietario.

### 4. Autenticazione server
`api/stripe.js` ricava l'utente dal Bearer JWT Supabase (`/auth/v1/user`) e
ignora `user_id` nel body. `api/stripe-webhook.js` verifica la firma Stripe.
Le form pubbliche (contatti, newsletter) non hanno login per design: sono
protette da same-origin, honeypot, rate limit e Turnstile quando configurato.

### 5. Log
`api/_security.js#logError` tronca a 300 caratteri e non logga token, email o
service key. `api/email.js` logga lo status Resend, non il contenuto delle email.
**Da fare:** accesso Vercel → Logs non disponibile da questo workspace. Per
audit duraturi serve un Log Drain verso un servizio esterno; non è stato
configurato perché richiede un account e una destinazione.

### 6. Manomissione campi
- identità Stripe: solo JWT;
- `subscriptions`: revoca UPDATE/INSERT/DELETE al client;
- `permesso_practices`: RLS owner-only e UNIQUE(user_id);
- newsletter: `confirmed` e `token` sono scritti solo dal server con service role;
- `content_calendar`/`news_items`: nessun accesso client.

### 7. Cookie
L'app non imposta cookie di sessione propri: Supabase JS conserva il token nel
browser. Questo evita CSRF sui cookie, ma espone il token a XSS; la CSP e
l'escaping sono la difesa. Se in futuro si passa a cookie, usarli
`HttpOnly; Secure; SameSite=Lax` e aggiungere CSRF token.

### 8. Password
Supabase Auth gestisce hashing (bcrypt) e reset. Il sito non vede né salva la
password. Non aggiungere mai un hash custom.

### 9. Tentativi di accesso
`api/_ratelimit.js` limita newsletter (3/min), contatti (8/min), promemoria
(2/min) per IP. È memoria per istanza: su più istanze non è globale.
**Da fare:** verificare in Supabase → Authentication → Rate Limits che i limiti
siano attivi; attivare CAPTCHA lato Supabase se si vede abuso.

### 10. Bot
`verifyTurnstile` è pronto ma resta permissivo finché non imposti
`TURNSTILE_REQUIRED=1`. **Attenzione:** attivalo solo dopo aver montato il
widget con la site key, altrimenti newsletter e contatti vengono rifiutati.
C'è anche un honeypot (`website`) su newsletter e contatti.

### 11. Query parametrizzate
Non c'è SQL concatenato: si usa PostgREST con `encodeURIComponent` e query
parametrizzate. I workflow n8n usano il nodo Supabase, non SQL libero.

### 12. Validazione input
`validEmail`, `text(value,max)`, `cleanLang` e i limiti dimensionali sono in
`api/_security.js`. `deadlines` è limitato a 50 elementi; i campi testuali hanno
un massimo. Le API pubbliche non devono accettare HTML.

### 13. Escaping
`escapeHtml` per le email, `safeUrl` per link esterni (solo http/https, niente
credenziali), `safePath` per redirect interni (niente `//` o schemi). La CSP
blocca script inline non previsti e `object-src`.

### 14. Upload
`migration-012` imposta sul bucket `documents`: 10 MB e MIME
`application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
**Da fare:** se il client `eih-documenti` permette altri formati o dimensioni,
allinearlo; il limite server è quello che conta.

### 15. Risposte minime
`api/config` non restituisce segreti; gli errori sono generici; `Cache-Control:
no-store` sulle risposte con dati. Non aggiungere mai la service key a una
risposta, a un file statico o a `NEXT_PUBLIC_*`/`VITE_*`.

### 16. Header
`vercel.json` applica a tutte le pagine: CSP, HSTS, `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`,
`X-Permitted-Cross-Domain-Policies: none`, `X-DNS-Prefetch-Control: off`.
La CSP usa `'unsafe-inline'` per script: è un compromesso per le pagine statiche
esistenti. Ridurlo è un lavoro separato (non fatto qui).

### 17. HTTPS
HSTS con `includeSubDomains` e `preload`, più `upgrade-insecure-requests` nella
CSP. **Da fare:** verificare che il dominio non sia mai servito in HTTP e che
tutti i sottodomini siano HTTPS prima di chiedere il preload.

### 18. Dipendenze
- Rimosso `shadcn` (dev, non usato): da 26 vulnerabilità a 3.
- `@vercel/og` resta a `0.6.3`: la `1.0.3` non si importa correttamente in
  Node locale (`hb.wasm` mancante). Non è un upgrade sicuro senza test sul
  runtime Edge.
- `npm audit`: **0 critical, 0 high, 2 moderate** (`satori`/`fflate`, ZIP64).
  Non c'è un fix non-breaking disponibile al momento; il pacchetto è usato solo
  per generare l'immagine OG, non per input arbitrari.
- Dependabot settimanale e workflow `security-audit.yml`.

### 19. Documentazione
Questo file. Le istruzioni operative sono nei commenti delle migrazioni e nel
README n8n.

## Cose che restano bloccate (dichiarate)

- **SQL Supabase**: nessun accesso al SQL Editor/service role da questo
  workspace. La migrazione è pronta ma non applicata.
- **Vercel Logs/Log Drain**: richiede accesso al progetto; non disponibile.
- **GitHub Secrets** per social/n8n/cron: non configurati; i workflow restano
  inattivi.
- **n8n**: non installato e senza credenziali; è stato fatto solo il test
  statico.
- **Turnstile**: secret/widget non configurati; il codice è pronto.
- **Crittografia field-level**: richiede gestione chiavi; non implementata.

## Segnalare un problema

Scrivi a `info@easyitaliahub.it` senza allegare dati personali. Non aprire una
issue pubblica con token, email o screenshot di dashboard.
