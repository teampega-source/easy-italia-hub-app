# n8n Automazioni — Easy Italia Hub

Workflow n8n pronti per l'importazione. **Non sono attivi in produzione**: questo
repository non contiene un server n8n né le credenziali. Il "giro di prova" che
si può fare qui è statico e senza segreti:

```bash
node scripts/n8n/verifica-workflow.mjs
```

Controlla JSON, connessioni, trigger, tabelle e campi Supabase. Per il giro
reale servono n8n, le credenziali qui sotto e un evento di prova.

## Stato dei workflow

| File | Trigger | Stato | Note |
|------|---------|-------|------|
| `01-welcome-email.json` | Webhook POST `/eih-new-user` | pronto da importare | Non inserisce in `public.users`: il profilo lo crea il trigger Supabase. Invia email + Slack. |
| `02-permesso-reminder.legacy.json` | — | **deprecato** | Sostituito dal cron Vercel `api/email` → `api/_digest.js`. Non importarlo: duplicherebbe i promemoria. |
| `03-social-autopost.json` | Webhook POST `/eih-social-post` | pronto da importare | Buffer/Instagram/TikTok; richiede i token Buffer. |
| `04-lead-generation.json` | Webhook POST `/eih-lead` | pronto da importare | Lead B2B → Supabase + email + Slack. |
| `05-weekly-content-calendar.json` | Cron lunedì 8:00 | pronto **dopo migration-012** | Scrive solo bozze in `content_calendar`; modello `gpt-4o-mini`. |
| `06-eur-lkr-alert.json` | Cron giornaliero 8:00 | pronto da importare | ExchangeRate API → email quando EUR/LKR supera soglia. |
| `07-news-immigration.json` | Cron ogni 6h | pronto **dopo migration-012** | RSS Ministero dell'Interno → `news_items` + Slack. Niente traduzione automatica non approvata. |
| `08-whatsapp-chatbot.json` | Webhook WhatsApp Cloud API | pronto da importare | Chatbot Atena; richiede token Meta. |
| `09-visto-srilanka.json` | Webhook POST `/eih-visto-srilanka` | pronto da importare | Info visto Sri Lanka → email. |

## Prima di attivare

1. Applica `supabase/migration-012-hardening.sql` nel SQL Editor del progetto
   `lmbkskjezffizvivnqyc`. Crea `content_calendar`, `news_items`, le colonne
   newsletter e i vincoli UNIQUE per gli upsert.
2. Importa solo i workflow che ti servono, uno alla volta.
3. Configura le credenziali e fai un test manuale con "Execute workflow".
4. Attiva il workflow solo dopo un'esecuzione riuscita.
5. Per 01 collega il webhook a `N8N_WEBHOOK_NEW_USER`; per 03/04/09 agli
   endpoint indicati. Se il webhook non è configurato, il flusso Vercel
   esistente continua a funzionare.

## Credenziali da configurare in n8n

```text
supabase-creds        → Supabase URL + Service Role Key (solo server)
resend-smtp           → smtp.resend.com:465, user: resend, pass: RESEND_API_KEY
slack-creds           → Slack Bot Token (xoxb-...)
eih-webhook-auth      → Header Auth: nome header e valore condiviso con Vercel
                        (es. X-EIH-Webhook: <segreto lungo casuale>)
openai-creds          → OpenAI API Key (03, 04, 05, 08)
BUFFER_TOKEN          → Buffer Access Token (03)
BUFFER_INSTAGRAM_ID   → profilo Instagram in Buffer (03)
BUFFER_TIKTOK_ID      → profilo TikTok in Buffer (03)
WHATSAPP_TOKEN        → WhatsApp Cloud API token (08)
WHATSAPP_PHONE_ID     → numero WhatsApp Business (08)
WHATSAPP_VERIFY_TOKEN → token verifica webhook Meta (08)
```

La Service Role Key non va mai nel browser, in Vercel `NEXT_PUBLIC_*`/`VITE_*`
o in un file committato. Va solo nella credenziale n8n.

## Test reale minimo (quando n8n è disponibile)

- **01**: esegui il webhook con `{"email":"test@example.com","name":"Test","language":"it"}`;
  verifica una sola email e un messaggio Slack.
- **05**: esegui manualmente; controlla 5 righe `draft` in `content_calendar` e
  che nessun post sia pubblicato automaticamente.
- **07**: esegui manualmente; controlla che il feed venga letto, che `link` sia
  unico e che Slack mostri al massimo 8 notizie. Se il feed cambia formato, il
  nodo Code deve fallire con un messaggio chiaro, non salvare righe vuote.
- **02/`_digest`**: usa `GET /api/email?tipo=newsletter&dry=1` con
  `Authorization: Bearer $CRON_SECRET`; non invia e restituisce il conteggio.

## Webhook URLs

- `N8N_WEBHOOK_NEW_USER` → dopo la registrazione
- `N8N_WEBHOOK_SOCIAL_POST` → quando un video è pronto
- `N8N_WEBHOOK_LEAD` → form contatti
- `N8N_WEBHOOK_VISTO` → form info visto Sri Lanka

## Alternativa a Buffer

- **Later** (free: 30 post/mese)
- **Publer** (free: 3 profili)
- **Meta Graph API** (gratuita, richiede Business Account)
