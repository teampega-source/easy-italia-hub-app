# I tre avvisi — cosa è collegato e cosa resta da fare

Il codice è tutto in piedi. Mancano solo tre account gratuiti e quattro
variabili d'ambiente: finché non ci sono, **niente si rompe e niente esce dal
nostro server** — ogni pezzo controlla se è configurato e, se non lo è, tace.

---

## 1 · Il sito risponde? — sorveglianza HTTP

**Cosa c'è già:** `api/salute.js`, raggiungibile su `/api/salute`.

Non è una pagina qualsiasi: interroga davvero Supabase e controlla che le
chiavi ci siano. Risponde **200** se tutto è in piedi, **503** se qualcosa di
essenziale è giù. Sorvegliare la home direbbe «tutto bene» anche con il
database in pausa, perché l'HTML lo serve la rete di distribuzione.

**Da fare:** un account su [Better Stack](https://betterstack.com/better-uptime)
(10 controlli ogni 3 minuti, con pagina di stato) o
[UptimeRobot](https://uptimerobot.com) (50 controlli ogni 5 minuti).

Tre controlli bastano:

| Indirizzo | Cosa dice se cade |
|---|---|
| `https://easyitaliahub.it/api/salute` | database o chiavi giù — cercare la parola chiave `"ok":true` nella risposta |
| `https://easyitaliahub.it/` | il sito non si apre proprio |
| `https://easyitaliahub.it/api/chat` | l'assistente non risponde (accetta POST: usare il metodo giusto o un controllo a parola chiave) |

Nessuna variabile d'ambiente da impostare.

---

## 2 · I lavori automatici girano ancora? — battito

**Cosa c'è già:** `api/_battito.js`, chiamato alla fine di ogni lavoro. Manda un
ping quando il lavoro finisce bene e un ping su `/fail` quando fallisce.

**Da fare:** un account su [healthchecks.io](https://healthchecks.io) (20
controlli gratis). Creare tre controlli, copiare l'indirizzo di ping di
ciascuno e incollarlo dove indicato.

| Lavoro | Quando gira | Variabile | Dove si imposta |
|---|---|---|---|
| Digest scadenze | ogni giorno 7:30 UTC | `BATTITO_SCADENZE` | Vercel → Settings → Environment Variables |
| Digest voli | ogni giorno 7:00 UTC | `BATTITO_VOLI` | Vercel → Settings → Environment Variables |
| Avvisi del Consolato | lunedì 5:17 UTC | `BATTITO_AVVISI` | GitHub → Settings → Secrets → Actions |

Su healthchecks.io il periodo va impostato a **1 giorno** per i primi due e a
**1 settimana** per il terzo, con una tolleranza di qualche ora: è quella
differenza che distingue «in ritardo» da «morto».

---

## 3 · Qualcuno sta sbattendo contro un errore? — errori del browser

**Cosa c'è già:** `assets/eih-errori.js` (caricato da tutte le pagine) manda gli
errori a `api/errore.js`, che li scrive nei log della funzione. Questo funziona
**già adesso**, senza configurare niente: i log si leggono su Vercel.

Si manda il minimo: messaggio, file, riga, percorso della pagina, lingua. Niente
query, niente contenuto dei campi, niente identificativi — il sito raccoglie
codici fiscali e numeri di passaporto e un raccoglitore sbadato sarebbe la
peggiore delle fughe. Al massimo cinque errori per pagina, lo stesso errore una
volta sola.

**Da fare, se vuoi anche l'avviso e la cronologia:** un account su
[Sentry](https://sentry.io) (5.000 errori/mese) — oppure
[GlitchTip](https://glitchtip.com) o [Bugsink](https://www.bugsink.com), che
parlano lo stesso protocollo. Copiare il DSN e impostarlo su Vercel:

    SENTRY_DSN = https://xxxx@yyy.ingest.sentry.io/123456

In alternativa, o in aggiunta, un webhook qualsiasi (Slack, Discord, Telegram
tramite ponte):

    ERRORI_WEBHOOK = https://hooks.slack.com/services/...

**Attenzione, questa è una decisione, non un dettaglio.** Finché le due
variabili sono vuote, gli errori restano nei nostri log e non esce niente.
Impostando il DSN si manda un dato tecnico a un fornitore terzo: va aggiunto
alla privacy policy fra i responsabili del trattamento (art. 28 GDPR) e, se si
usa Sentry, conviene scegliere la **regione europea** (`de.sentry.io`). Senza
quella riga in privacy policy, non impostare il DSN.

---

## In sintesi

| Serve | Costo | Tempo |
|---|---|---|
| Account Better Stack o UptimeRobot + 3 monitor | 0 | 10 minuti |
| Account healthchecks.io + 3 controlli + 3 variabili | 0 | 15 minuti |
| Log degli errori su Vercel | 0 | già attivo |
| Sentry (facoltativo, prima la privacy policy) | 0 | 15 minuti |

Nessuno dei tre corregge niente: avvisano. La riparazione resta a una persona —
o a me, quando me lo dici.
