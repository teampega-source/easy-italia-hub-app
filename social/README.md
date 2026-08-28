# Agente social — fase 1, funzionante

Costruito sulla specifica «Easy Italia Hub — AI Social & Community Manager».
Gira davvero: `node social/cli.mjs` produce le bozze di oggi. Non è un mockup,
e non è nemmeno tutto il sistema: sotto c'è scritto cosa c'è, cosa manca e
perché alcune cose non si possono fare affatto.

    node social/prove.mjs     # 41 controlli, senza rete e senza chiavi
    node social/cli.mjs       # il giro di oggi → social/coda/AAAA-MM-GG/

---

## Prima di tutto: cosa Facebook non permette

La richiesta originale parlava di «likes, commenti e inviti». Tre cose, tre
risposte diverse, tutte verificate sulla documentazione Meta e non dedotte:

| Azione | Via API ufficiale | Cosa fa il sistema |
|---|---|---|
| Pubblicare sulla nostra Pagina | **sì**, `pages_manage_posts` | pubblica da solo, un post al giorno |
| Leggere i commenti ai nostri post | **sì**, `pages_read_user_content` | li porta nel rapporto |
| Rispondere ai commenti sui nostri post | **sì**, `pages_manage_engagement` | risposte fisse da solo, domande vere in coda |
| Mettere like a post di altri, come Pagina | **no**, non esiste l'endpoint | resta manuale |
| Commentare sotto post altrui | **no**, non esiste l'endpoint | prepara il testo, il dito è tuo |
| Invitare in blocco chi ha messo like | **no**, solo nell'interfaccia | resta manuale |

Farle lo stesso con un browser pilotato significa aggirare una protezione: lo
vieta la specifica (§11) e Meta chiude la Pagina. Su una pagina che è il canale
di una comunità, quel rischio non vale nessuna crescita.

Sui **gruppi** c'è un dettaglio in più: Meta ha chiuso la Groups API nell'aprile
2024. Non è che servano permessi più difficili — l'endpoint non esiste più per
nessuno. Entrare in un gruppo, pubblicare, commentare lì dentro: tutto manuale,
per sempre, finché non riaprono.

**La conseguenza pratica, in tre righe.** La Pagina lavora da sola: pubblica un
post al giorno e risponde ai commenti facili senza che tu faccia niente. I
commenti veri li prepara e li lascia a te. I gruppi te li serve pronti da
incollare: dieci minuti, non due ore.

---

## Cosa c'è, oggi

```
social/
  cli.mjs              il giro quotidiano
  prove.mjs            41 controlli, offline
  pubblica.mjs         la parte che lavora da sola, con cinque cancelli
  rapporto.mjs         il rapporto da leggere dal telefono
  memoria.json         cosa è già uscito e dove: senza, l'agente si ripete
  gruppi.json          i tuoi gruppi (il modello è gruppi.esempio.json)
  lib/marca.mjs        voce, lingue, formati, temi regolati
  lib/sicurezza.mjs    Safety Agent: regole scritte, non un prompt
  lib/registro.mjs     la memoria e le regole di ripetizione
  lib/ai.mjs           un solo cancello verso il modello, con ripiego asciutto
  agenti/fonti.mjs     Scout sulle nostre fonti verificate
  agenti/contenuto.mjs Content Agent + lingue
  agenti/comunita.mjs  risposte ai commenti: fisse in automatico, vere in coda
  agenti/gruppi.mjs    i messaggi per i gruppi, con la rotazione
  connettori/meta.mjs  API ufficiali Meta, spente finché non c'è il token
  schema.sql           le tabelle per la fase 2 (Supabase)
```

### Come lavora da sola, e dove si ferma

**La Pagina** pubblica un post al giorno, da sola, ma solo se passano **cinque
cancelli**: l'interruttore `SOCIAL_AUTOPUBBLICA=1` è acceso, Meta è collegato,
il testo non è grezzo, il controllo di sicurezza non ha alzato nemmeno un
avviso, e la memoria dice che quel tema non è già uscito nelle ultime tre
settimane. Se uno solo dice no, il pezzo torna in coda.

**I commenti**: rispondono da sole solo le frasi fisse — «grazie», «è gratis?»,
«in che lingue?» — scritte a mano in quattro lingue, senza modello di mezzo.
Ogni domanda vera va in revisione. Una risposta plausibile e sbagliata sotto un
nostro post diventa la nostra posizione ufficiale, e chi la legge ci va allo
sportello.

**I gruppi**: mai automatici. L'agente sceglie i gruppi di oggi rispettando i
tempi — nello stesso gruppo si torna dopo sette giorni — scrive un tema diverso
per ognuno e tiene il conto. Tu apri il rapporto, copi, incolli.

### La memoria

`social/memoria.json` è quello che rende l'autonomia sicura: un agente senza
memoria ripubblica lo stesso post ogni giorno e scrive tre volte a settimana
nello stesso gruppo, che è il modo più veloce per farsi cacciare. Il lavoro
automatico la riscrive e la spinge nel repository a ogni giro.

**Scout** (spec §4) pesca dai contenuti che abbiamo già verificato: avvisi del
Consolato, sezioni delle guide con la loro fascia di fonti, strumenti del sito.
Ogni opportunità porta la fonte, e il punteggio crolla se non ce l'ha. Lo Scout
sul web aperto arriva quando arrivano i permessi Meta: uno Scout che finge di
leggere Facebook produrrebbe opportunità inventate, che è il difetto peggiore
perché sembra funzionare.

**Content** (§6) produce post Facebook, caption Instagram, copione Reel e Storia
in sinhala, italiano, inglese e tamil. Le lingue non sono traduzioni: l'agente
riscrive per chi legge, e lascia in italiano i nomi delle pratiche — *permesso
di soggiorno*, *codice fiscale*, *questura* — perché sono le parole da dire
allo sportello.

**Safety** (§3) gira su ogni pezzo prima che lo veda una persona. Sono regole
scritte, non un secondo prompt: un modello che si autovaluta dice di sì quasi
sempre. Blocca promesse di esito, scambio di like, richieste di dati personali,
e i temi regolati senza fonte ufficiale.

**Approvazione** (§12): quello che non passa i cancelli esce con `✓` pronto,
`•` da rivedere o `✕` scartato, e il perché scritto accanto.

**Senza chiavi non finge.** Senza `GEMINI_API_KEY` la catena gira lo stesso e
produce bozze *grezze*, montate dai pezzi verificati, marcate come tali nel
rapporto. Serve a provare tutto senza spendere.

---

## Accendere i pezzi

Nessuno è obbligatorio: quello che manca resta spento e dichiarato.

| Variabile | A cosa serve | Dove |
|---|---|---|
| `GEMINI_API_KEY` | scrivere davvero i testi (c'è già per l'assistente del sito) | ambiente / GitHub Secrets |
| `META_PAGE_ID`, `META_PAGE_TOKEN` | leggere commenti e pubblicare sulla Pagina | GitHub Secrets |
| `SOCIAL_AUTOPUBBLICA=1` | l'interruttore: senza, non pubblica mai da solo | GitHub Secrets |
| `RESEND_API_KEY`, `SOCIAL_REPORT_TO` | il rapporto quotidiano via email | GitHub Secrets |

Per i due token Meta serve una app Meta con la verifica del business e i
permessi approvati: è l'unico passaggio che non si può accorciare, e va fatto
una volta sola.

---

## Cosa manca rispetto alla specifica

Fase 1 è questa, e gira. Le altre, in ordine di utilità reale:

- **Fase 2** — Partner CRM e tabelle su Supabase (`schema.sql` è già pronto):
  servono quando lo storico non sta più in un file.
- **Fase 3** — Analytics: quali temi, lingue e orari funzionano. Ha senso solo
  con qualche settimana di dati veri; farlo prima significa inventare.
- **Fase 4** — dashboard Next.js. Utile quando le persone che approvano saranno
  più di una: oggi il rapporto in Markdown si legge dal telefono e costa zero.

Lo stack della specifica (Next.js + FastAPI + Redis + Celery + VPS Docker) è
stato adattato a quello che il progetto ha già: Node senza dipendenze, GitHub
Actions come scheduler, Supabase quando servirà. Stessa architettura, stessa
separazione fra agenti, zero costi in più e nessun server da tenere in vita.
