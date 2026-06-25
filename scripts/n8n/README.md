# n8n Automazioni — Easy Italia Hub

Workflow n8n pronti per importazione. Self-host n8n: `docker run -d -p 5678:5678 n8nio/n8n`

## Workflow disponibili

| File | Trigger | Funzione |
|------|---------|----------|
| `01-welcome-email.json` | Webhook POST `/eih-new-user` | Benvenuto nuovo utente → Supabase + email + Slack |
| `02-permesso-reminder.json` | Cron giornaliero 9:00 | Reminder permessi in scadenza (30gg) |
| `03-social-autopost.json` | Webhook POST `/eih-social-post` | Auto-post video Atena su Instagram + TikTok via Buffer |
| `04-lead-generation.json` | Webhook POST `/eih-lead` | Lead B2B → Supabase + email AI personalizzata + Slack |
| `05-weekly-content-calendar.json` | Cron lunedì 8:00 | AI genera piano 5 post settimanali Atena × EIH |

## Credenziali da configurare in n8n

```
supabase-creds    → Supabase URL + Service Role Key
resend-smtp       → SMTP host: smtp.resend.com, porta 465, user: resend, pass: RESEND_API_KEY
slack-creds       → Slack Bot Token (xoxb-...)
openai-creds      → OpenAI API Key (solo workflow 03, 04, 05)
BUFFER_TOKEN      → Buffer Access Token (workflow 03)
BUFFER_INSTAGRAM_ID → ID profilo Instagram in Buffer
BUFFER_TIKTOK_ID  → ID profilo TikTok in Buffer
```

## Come importare

1. Apri n8n → Menu → Import from file
2. Seleziona il file JSON
3. Configura le credenziali
4. Attiva il workflow

## Webhook URLs (dopo import)

Copia l'URL dal nodo Webhook in n8n e aggiungilo come variabile d'ambiente in Vercel:
- `N8N_WEBHOOK_NEW_USER` → usare in `api/auth.js`
- `N8N_WEBHOOK_SOCIAL_POST` → chiamare quando un video è pronto per la pubblicazione
- `N8N_WEBHOOK_LEAD` → usare nel form contatti

## Servizi gratuiti alternativi a Buffer

Per il social posting consultare `.references/free-for-dev/README.md`. Alternative:
- **Later** (free tier: 30 post/mese)
- **Publer** (free tier: 3 profili)
- Direttamente via **Meta Graph API** (gratuito, richiede Business Account)
