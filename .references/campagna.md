# Campagna promozionale — programma

Stato: bozza del 5 agosto 2026. I costi per piattaforma sono in verifica.

## Il punto di partenza, detto senza giri

Il prodotto è **gratuito e in quattro lingue**, e questo cambia tutto rispetto a
una campagna normale:

- **Non si vende niente**, quindi la conversione è *l'iscrizione*, non l'acquisto.
  Il costo per iscrizione è l'unico numero che conta.
- **Il vantaggio competitivo è la lingua.** In italiano il sito compete con CAF,
  patronati, studi legali e decine di siti di informazione: parole chiave care e
  affollate. In **singalese e in tamil non compete con nessuno**. Lì il costo per
  contatto è una frazione, e il pubblico è esattamente quello giusto.
  Tutto il piano ruota attorno a questo.
- **Il pubblico è piccolo e concentrato.** Poche decine di migliaia di persone,
  in una dozzina di città. Non è un mercato da scalare: è un mercato da
  *saturare*. Con un pubblico così, la frequenza conta più della portata, e le
  liste di retargeting si riempiono in fretta.

## Fase 0 — Prima di spendere un euro: la misurazione

**Nessuna campagna parte finché questi quattro punti non sono chiusi.** Senza,
si paga per traffico che non si può né attribuire né ottimizzare.

1. **GA4 non copre la home.** `eih.js` monta GA4 (`G-13TEJWCKZZ`), ma
   `index.html` non carica `eih.js`: carica `assets/index.js`. La pagina dove
   atterrerà ogni annuncio è l'unica senza analytics. Va spostata l'inizializzazione
   in uno script condiviso, o duplicata in `assets/index.js`.

2. **GA4 parte senza consenso.** Il blocco in `eih.js` gira all'avvio, mentre
   `eih-consent.js` dichiara che «nessun analytics/marketing è caricato» senza
   consenso. Le due cose si contraddicono, e la seconda è quella giusta: GA4 va
   agganciato a `window.EIH_CONSENT.analytics === true`. È un problema di legge
   prima che di misurazione.

3. **L'iscrizione non è tracciata.** Non esiste un evento di conversione. Serve
   un evento su registrazione completata, in `registrati.html` dove oggi si fa
   `location.href = dest`. Da lì si alimentano GA4 e le piattaforme.

4. **Nessun pixel di piattaforma.** Meta, TikTok e Google Ads non hanno niente.
   Vanno installati e agganciati allo stesso consenso di marketing.

**Disciplina UTM**: ogni annuncio con `utm_source` / `utm_medium` /
`utm_campaign` / `utm_content` (`utm_content` = variante creativa **e** lingua).
Senza `utm_content` non si saprà mai se ha funzionato il singalese o il tamil, e
quella è la domanda più importante di tutta la campagna.

## Fase 1 — Materiali

Il master è il promo verticale 1440×2560, 46,9 s, con la card finale.
Da lì servono i tagli, perché ogni piattaforma premia durate diverse:

| taglio | dove | contenuto |
|---|---|---|
| 6 s | bumper YouTube | solo il gancio + la card |
| 15 s | TikTok, Reels, Shorts | problema → soluzione → card |
| 30 s | Demand Gen, in-stream | versione ridotta |
| 47 s | YouTube organico, sito | integrale |

**Le lingue.** Il parlato è in inglese. Le versioni singalese e tamil si fanno
con **sottotitoli impressi**, non con un nuovo doppiaggio: costano nulla, si
leggono senza audio (come guarda la maggioranza), e il video resta uno solo.
La card finale è già tradotta nelle quattro lingue in
`scripts/monta-promo-finale.mjs`.

**Etichetta AI.** È impressa sul video per tutta la durata. Va comunque
attivata anche la spunta «contenuto generato dall'AI» dentro ogni piattaforma:
sono due obblighi distinti, uno di legge (art. 50 Reg. UE 2024/1689) e uno di
policy della piattaforma.

## Fase 2 — Organico, prima del pagato

Mandare traffico a pagamento verso un marchio sconosciuto, per un servizio
gratuito, converte male: «gratis» da uno sconosciuto suona come una truffa —
e questo pubblico le truffe le ha viste davvero (v. la guida sui nulla osta
venduti). Servono due settimane di presenza organica prima di aprire il
rubinetto.

- **Canale WhatsApp**: esiste già ed è il canale giusto per questo pubblico.
  Va alimentato prima, perché è lì che la community si fida.
- **Gruppi Facebook della comunità srilankese in Italia**: presenza come
  persona, non come marchio. Rispondere a domande vere, linkare la guida
  pertinente. Il pubblico adulto è lì.
- **YouTube**: caricare il promo e 3-4 tutorial lunghi (rinnovo permesso, SPID,
  codice fiscale) **in singalese e tamil**. Sono ricerche che le persone fanno
  già, in un'offerta dove non c'è nessuno. È l'unico canale che continua a
  portare iscritti anche a budget zero, per anni.
- **Instagram e TikTok**: aprire e pubblicare i tagli da 15 s con il gancio
  «lo sapevi che hai diritto a…».

## Fase 3 — A pagamento, un canale alla volta

L'ordine non è casuale: si parte da chi cerca già (intento alto, volumi bassi)
e si sale verso chi non sa di avere un problema (intento basso, volumi alti).

**1. Google Ads — ricerca.** Prima tutto, perché intercetta chi ha il problema
adesso. Due gruppi separati:
- *in singalese e tamil*: traslitterazioni e termini che il pubblico usa
  davvero. Poca concorrenza, costi bassi.
- *in italiano*: solo coda lunga specifica («rinnovo permesso ricevuta persa»),
  mai i termini generici, che costano quanto un avvocato ci mette a comprarli.

**2. YouTube — Demand Gen + in-feed.** Il promo funziona qui: verticale, con
una persona che parla. Targeting per lingua e per interessi legati allo Sri
Lanka, geografia sulle prime dieci province.

**3. Meta — Facebook e Instagram.** Il grosso del pubblico adulto. Campagne
separate per lingua, mai mescolate: servono a misurare quale lingua rende.

**4. TikTok.** CPM più basso e pubblico più giovane: seconde generazioni, che
sono anche quelle che poi spiegano il sito ai genitori. Vale come canale di
notorietà, non di conversione diretta.

**Un rischio da verificare prima di caricare le carte di credito:** Meta
classifica come «temi sociali, elezioni o politica» una parte dei contenuti
sull'immigrazione. Se ci ricadiamo servono verifica d'identità dell'inserzionista,
disclaimer «Pagato da» e archivio pubblico degli annunci — e cadono alcune
opzioni di targeting. Non blocca la campagna, ma cambia i tempi: la verifica
richiede giorni. Va accertato **prima**.

## Fase 4 — Cosa guardare, e quando fermarsi

Una sola metrica di comando: **costo per iscrizione, per lingua e per canale.**

- Prime due settimane: budget uguale su tutti i canali, per misurare, non per
  crescere. Non si tocca niente prima di 50 conversioni per canale.
- Poi si sposta il budget su quello che costa meno, non su quello che piace di più.
- Un pubblico piccolo si «brucia»: sopra una frequenza di 4-5 lo stesso annuncio
  smette di funzionare e comincia a infastidire. Servono tre varianti creative
  per canale, a rotazione.

## Il numero che dice se ha senso

Il sito non vende: non c'è un ricavo con cui pagare gli annunci. Quindi il tetto
di spesa non lo decide il ritorno, lo decide quanto vale un'iscrizione per il
progetto. Va deciso quel numero **prima** di cominciare, altrimenti la campagna
non ha un criterio per fermarsi.

---
Da completare con i costi reali per piattaforma, le opzioni di targeting
linguistico verificate e le regole 2026 sui contenuti AI negli annunci.
