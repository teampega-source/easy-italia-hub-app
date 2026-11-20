# Pubblicazione automatica — come accenderla

Due automazioni, tutte e due gratuite, che girano su GitHub Actions dentro
questo repository. Nessun server da mantenere.

| Cosa | Quando parte | Cosa fa |
|---|---|---|
| `pubblica-novita.yml` | ogni giorno alle 07:23 UTC + a mano | annuncia le pagine nuove o aggiornate su Telegram e Bluesky |
| `indexnow.yml` | a ogni push su `main` + ogni giorno | dice a Bing/Yandex/Naver/Seznam quali URL sono cambiate |

## Perché Telegram e Bluesky

Sono gli unici canali che nel 2026 si possono davvero automatizzare gratis:
token immediato, nessuna approvazione, nessun costo per chiamata.

- **Facebook / Instagram**: API gratuita ma serve app Meta con verifica del
  business; in pratica conviene passarci da un pianificatore con piano free.
- **X**: non esiste più un piano gratuito per chi si iscrive oggi (si paga a
  post).
- **TikTok**: richiede un audit dell'app.
- **Canale WhatsApp**: non ha API per i canali (solo WhatsApp Business, a
  pagamento per messaggio).

## 1. Telegram (5 minuti)

1. Apri Telegram, cerca **@BotFather**, scrivi `/newbot`, scegli un nome e uno
   username. Ti risponde con un token tipo `123456789:AAE...`.
2. Crea il canale pubblico (o usa quello che hai) e aggiungi il bot come
   **amministratore** con il permesso di pubblicare.
3. Prendi l'ID del canale: incolla nel canale un messaggio e inoltrarlo a
   **@userinfobot**, oppure apri
   `https://api.telegram.org/bot<TOKEN>/getUpdates` dopo aver scritto nel
   canale: il campo `chat.id` è quello che serve (per i canali è negativo,
   tipo `-1001234567890`).

## 2. Bluesky (3 minuti)

1. Entra su bsky.app → **Settings** → **App passwords** → crea una password
   dedicata (non usare la password dell'account).
2. Ricorda il tuo handle completo, tipo `easyitaliahub.bsky.social`.

## 3. Testi con l'AI (opzionale, gratuito)

Senza chiavi i post usano titolo e descrizione della pagina, che è già
decoroso. Con una chiave diventano più naturali.

- **Google Gemini**: https://aistudio.google.com/apikey → piano gratuito.
- **Groq**: https://console.groq.com/keys → piano gratuito.

Lo script prova prima Gemini, poi Groq, poi torna al testo base. Un errore
dell'AI non blocca mai la pubblicazione.

## 4. Inserisci i segreti su GitHub

Repository → **Settings** → **Secrets and variables** → **Actions** →
*New repository secret*. Nomi esatti:

```
TELEGRAM_BOT_TOKEN      token di BotFather
TELEGRAM_CHAT_ID        id del canale (negativo, es. -1001234567890)
BLUESKY_HANDLE          easyitaliahub.bsky.social
BLUESKY_APP_PASSWORD    app password di Bluesky
GEMINI_API_KEY          opzionale
GROQ_API_KEY            opzionale
```

## 5. Prova

Actions → **Pubblica le novità** → *Run workflow* → spunta `dry_run` per
vedere cosa pubblicherebbe senza pubblicare. Togli la spunta per pubblicare
davvero.

## Come decide cosa pubblicare

Legge `sitemap.xml`: le quattro lingue di una pagina contano come una sola
notizia. Pubblica se il `lastmod` è più recente di quello registrato in
`state.json`, al massimo due pagine per giro (le più recenti). Lo stato avanza
solo per i canali che hanno accettato il post, così un errore di rete non fa
perdere l'annuncio.

Restano fuori: home, ricerca, pagine legali, area personale e abbonamenti.

## Se qualcosa non va

- **Nessun post**: controlla che i segreti esistano e che il bot sia
  amministratore del canale.
- **Telegram 400 "chat not found"**: `TELEGRAM_CHAT_ID` sbagliato (deve essere
  l'id del canale, non lo username).
- **Bluesky 401**: la app password è stata revocata o l'handle è sbagliato.
- **IndexNow 403**: il file `<chiave>.txt` non è raggiungibile su
  `https://easyitaliahub.it/<chiave>.txt` (deve essere pubblicato, non solo
  nel repo).
