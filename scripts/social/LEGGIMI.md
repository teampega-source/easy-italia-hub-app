# Pubblicazione automatica — come accenderla

Due automazioni, tutte e due gratuite, che girano su GitHub Actions dentro
questo repository. Nessun server da mantenere.

| Cosa | Quando parte | Cosa fa |
|---|---|---|
| `pubblica-novita.yml` | ogni giorno alle 07:23 UTC + a mano | annuncia le pagine nuove o aggiornate su Telegram, Bluesky e Facebook Page |
| `indexnow.yml` | a ogni push su `main` + ogni giorno | dice a Bing/Yandex/Naver/Seznam quali URL sono cambiate |

## Perché Telegram e Bluesky

Sono gli unici canali che nel 2026 si possono davvero automatizzare gratis:
token immediato, nessuna approvazione, nessun costo per chiamata.

- **Facebook Page**: API gratuita con un token di pagina a lunga durata
  (app Meta + verifica per l'accesso avanzato). Lo script lo supporta: se
  `FACEBOOK_PAGE_ID` e `FACEBOOK_PAGE_TOKEN` ci sono, pubblica anche lì.
- **Instagram**: come Facebook ma serve un account business collegato; per
  ora lo si copre con un pianificatore free.
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

## 3. Facebook Page (opzionale, 10 minuti)

1. Su developers.facebook.com crea un'app di tipo *Business*.
2. Con **Graph API Explorer** chiedi i permessi `pages_manage_posts` e
   `pages_read_engagement` per la tua pagina.
3. Genera un **token di pagina** (non utente), poi allungalo con
   *Access Token Debugger* → **Extend**.
4. Salva l'id della pagina (si vede in *Informazioni sulla pagina*) e il
   token come segreti. Se l'app è in modalità sviluppo funziona già sulle
   pagine di cui sei amministratore; per l'uso continuativo serve la verifica
   del business.

## 4. Inserisci i segreti su GitHub

Repository → **Settings** → **Secrets and variables** → **Actions** →
*New repository secret*. Nomi esatti:

```
TELEGRAM_BOT_TOKEN      token di BotFather
TELEGRAM_CHAT_ID        id del canale (negativo, es. -1001234567890)
BLUESKY_HANDLE          easyitaliahub.bsky.social
BLUESKY_APP_PASSWORD    app password di Bluesky
FACEBOOK_PAGE_ID        id numerico della pagina
FACEBOOK_PAGE_TOKEN     token di pagina a lunga durata
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

**I post sono bilingui.** Il blocco italiano viene dalla pagina italiana; il
blocco inglese dalle traduzioni vere della stessa pagina, cioè
`traduzioni/<pagina>.en.json` e i blocchi `EIH_I18N_EXTRA` scritti dentro la
pagina — le stesse fonti che usa il browser, non una traduzione inventata dallo
script. Se una pagina non è tradotta, il post esce solo in italiano e il log lo
dice. Ogni blocco porta il link della propria lingua; su Bluesky, dove il
limite è 300 caratteri compreso il link, restano i due titoli e il link
italiano.

Restano fuori: home, ricerca, pagine legali, area personale e abbonamenti.

## Se qualcosa non va

- **Nessun post**: controlla che i segreti esistano e che il bot sia
  amministratore del canale.
- **Telegram 400 "chat not found"**: `TELEGRAM_CHAT_ID` sbagliato (deve essere
  l'id del canale, non lo username).
- **Bluesky 401**: la app password è stata revocata o l'handle è sbagliato.
- **Facebook 190**: token scaduto o revocato, va rigenerato e ri-esteso.
- **IndexNow 403**: il file `<chiave>.txt` non è raggiungibile su
  `https://easyitaliahub.it/<chiave>.txt` (deve essere pubblicato, non solo
  nel repo).
