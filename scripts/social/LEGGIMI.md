# Pubblicazione automatica — come accenderla

Due automazioni, tutte e due gratuite, che girano su GitHub Actions dentro
questo repository. Nessun server da mantenere.

| Cosa | Quando parte | Cosa fa |
|---|---|---|
| `pubblica-novita.yml` | ogni giorno alle 07:23 UTC + a mano | annuncia le pagine nuove o aggiornate su Telegram, Bluesky e Facebook Page. Al primo giro parte da dieci guide scelte, non dall'archivio. |
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

In locale, senza segreti, il giro è sempre di prova:

```bash
node scripts/social/pubblica.mjs --dry-run
MAX_POST=10 node scripts/social/pubblica.mjs --dry-run
```

Il secondo comando mostra tutte e dieci le guide del primo giro. Per guardare
l'arretrato senza pubblicarlo:

```bash
MAX_POST=100 node scripts/social/pubblica.mjs --dry-run --tutte
```

## Come decide cosa pubblicare

Legge `sitemap.xml`: le quattro lingue di una pagina contano come una sola
notizia. Pubblica se il `lastmod` è più recente di quello registrato in
`state.json`, al massimo due pagine per giro (le più recenti). Lo stato avanza
solo per i canali che hanno accettato il post, così un errore di rete non fa
perdere l'annuncio.

**Il primo giro.** Con `state.json` vuoto il motore non annuncia l'archivio:
parte da dieci guide scelte a mano (`PRIMO_GIRO` in `pubblica.mjs`) e segna
tutte le altre come già viste. Due al giorno, quindi cinque giorni. Se
preferisci partire da zero e aspettare la prima modifica vera:

```bash
node scripts/social/pubblica.mjs --semina
```

`--semina` scrive nello stato tutte le pagine attuali e non pubblica niente.
La prima modifica successiva sarà la prima notizia.

**I post sono in quattro lingue.** Ogni post porta italiano, sinhala, tamil e
inglese. I testi vengono dalle traduzioni già presenti nel sito:
`EIH_I18N_EXTRA` (`page.h1`/`page.lead`, oppure la voce della chiave
`data-i18n` quando la pagina traduce così titolo e sommario), i blocchi
`en/si/ta` scritti dentro la pagina, `traduzioni/<pagina>.<lingua>.json` e
infine `assets/i18n/<pagina>.<lingua>.json`, il dizionario del browser. Da lì
il titolo si ricompone pezzo per pezzo, come fa il browser con l'h1 spezzato
da `<br>` ed `<em>`; se un pezzo non è tradotto il titolo non si usa. Niente
traduzione inventata: se una lingua non c'è, il blocco non compare e il log lo
dice pagina per pagina. Una pagina che non risponde, o che risponde senza
titolo, viene saltata e non finisce nello stato.

Ogni blocco porta il link della propria lingua: chi legge in tamil finisce
sulla pagina tamil, non su quella italiana con il selettore in cima. Su
Bluesky, dove il limite è 300 caratteri compreso il link, restano italiano e
le lingue della community, e l'inglese solo se avanza spazio. Le descrizioni
sono tagliate a 320 caratteri per stare dentro il limite di Telegram.

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
