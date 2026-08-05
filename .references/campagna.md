# Campagna promozionale — programma

Stato: 5 agosto 2026. Dati esterni verificati; restano da confermare in
piattaforma i punti segnati «da verificare in Ads Manager».

## Il punto di partenza, detto senza giri

Il prodotto è **gratuito e in quattro lingue**, e questo cambia tutto rispetto a
una campagna normale:

- **Non si vende niente**, quindi la conversione è *l'iscrizione*, non l'acquisto.
  Il costo per iscrizione è l'unico numero che conta.
- **Il vantaggio competitivo è la lingua** — con un limite che cambia il piano:
  **Google Ads non supporta il singalese.** Non è tra le 48 lingue disponibili, e
  le creatività in singalese vengono rifiutate («Unsupported language»). Il tamil
  invece c'è (`ta`, criterion 1130). Quindi: su Google si va in tamil, in
  italiano e in inglese; **il singalese passa da YouTube organico, Meta e
  TikTok**, dove la lingua della creatività non è vincolata allo stesso modo.
- **Il pubblico è piccolo, concentrato e più maturo di quanto ci si aspetti.**
  113.705 residenti (ISTAT, 1.1.2025). Sette province coprono la gran parte:
  Milano 21.024 · Napoli 16.566 · Verona 11.004 · Roma 10.188 · Messina 4.101 ·
  Firenze 3.913 · Catania 3.670. Poi Brescia 3.281 e Palermo 2.772.
  Il 28% sta al Sud e nelle Isole, contro il 17% medio degli extra-UE: è una
  comunità molto più meridionale della media, e Napoli pesa quanto Roma e Verona
  messe insieme.
  **Età: oltre il 54% ha più di 40 anni, solo il 26,6% sta fra i 18 e i 39**
  (media non comunitari: 38,4%). Questo sposta il baricentro da TikTok a
  Facebook, e va detto prima di scrivere il piano dei canali.
  Non è un mercato da scalare: è un mercato da *saturare*. La frequenza conta
  più della portata, e le liste di retargeting si riempiono in fretta.
- **La ripartizione fra singalese e tamil non è un dato pubblico.** ISTAT e il
  Ministero non rilevano lingua o etnia. Le stime in giro risalgono al 2013 e non
  sono citabili. Conseguenza pratica: **non si pianifica il budget su una
  ripartizione presunta** — si spende uguale sulle due lingue per due settimane e
  si lascia decidere ai risultati.

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

**1. Google Ads — ricerca.** Prima di tutto, perché intercetta chi ha il
problema adesso. Tre gruppi separati:
- *in tamil*: lingua supportata, targeting linguistico pieno. Poca concorrenza.
- *in italiano*: solo coda lunga specifica («rinnovo permesso ricevuta persa»),
  mai i termini generici — nel settore legale in Italia stanno fra 2 e 8 €/click,
  con picchi molto più alti.
- *keyword in caratteri singalesi con annuncio in inglese*: le parole chiave non
  seguono la stessa policy delle creatività, quindi si può intercettare chi cerca
  in singalese mostrando un annuncio in una lingua ammessa, e portarlo su una
  landing che il sito serve già in singalese. **Non è documentato ufficialmente:
  va provato con poco budget prima di farci conto.**

**2. YouTube.** È qui che il singalese recupera quello che perde su Google Ads.
Il promo verticale funziona come annuncio; i tutorial lunghi in singalese e tamil
funzionano come presidio permanente. CPV di riferimento per lo skippable
in-stream: circa 0,024 $ (dato globale Q1 2026 — quello italiano non è verificato).

**3. Meta — Facebook prima di Instagram.** Qui sta il grosso del pubblico, ed è
adulto: con il 54% della comunità sopra i 40 anni, Facebook conta più di
Instagram, non il contrario. CPM Italia intorno ai 6-7 $, CPC ~1 $ (fonti
secondarie). Da luglio 2026 Meta aggiunge una commissione sulle impression
consegnate in Italia (~3%, fuori budget campagna, appare in fattura).

**4. TikTok — ultimo, e con aspettative basse.** Il pubblico giovane della
comunità è una minoranza (26,6% fra i 18 e i 39 anni). Vale per le seconde
generazioni, che poi spiegano il sito ai genitori: notorietà, non conversione.
Minimi rigidi: **50 $/giorno per campagna, 20 $/giorno per gruppo di annunci** —
sono i minimi più alti fra tutte le piattaforme, e su un pubblico così stretto è
facile spendere male.
⚠️ TikTok richiede che la lingua della creatività corrisponda alle lingue
accettate per il paese targetizzato: **una creatività in singalese o tamil su
target Italia può essere rifiutata**. Da provare con un annuncio pilota.

## Il campo minato: pubblicità su «temi sociali» in UE

Questo punto va letto per intero prima di aprire un account pubblicitario.

**Meta ha vietato in tutta l'UE gli annunci su temi sociali, elezioni e politica
dal 6 ottobre 2025** (regolamento UE 2024/900 sulla trasparenza della pubblicità
politica). Non esiste più il percorso «verifica l'identità e metti il disclaimer»:
è semplicemente vietato. **E l'immigrazione è uno degli otto temi sociali
elencati da Meta.**

La distinzione che ci salva è **advocacy contro servizio**, e Meta la mette nera
su bianco nella sua tabella:

| Vietato in UE | Ammesso in UE |
|---|---|
| «Serve una riforma dell'immigrazione, ora!» | «Contatta i nostri avvocati esperti in immigrazione.» |
| «Dobbiamo unirci a sostegno dei rifugiati.» | «Guarda il nostro documentario sulla vita in un campo profughi.» |

Easy Italia Hub sta strutturalmente nella colonna di destra: «Guida gratuita al
permesso di soggiorno», «Come si ottiene lo SPID, con l'assistente in singalese e
tamil», «Corsi di italiano gratuiti». Ma il registro va tenuto con disciplina.

**Da evitare tassativamente, nelle creatività e sul sito:** prese di posizione su
politiche migratorie, decreti flussi, riforme della cittadinanza; toni da
rivendicazione («insieme possiamo cambiare», «basta burocrazia ingiusta»);
qualsiasi riferimento a partiti o referendum.

**Tre cose sul funzionamento del controllo, che cambiano il modo di lavorare:**
1. **Meta esamina anche la landing page**, non solo l'annuncio. Un testo di
   rivendicazione su easyitaliahub.it può far rifiutare un annuncio impeccabile.
   → **serve un audit del tono del sito prima di lanciare.**
2. **Chi insiste a pubblicare annunci classificati come temi sociali rischia la
   restrizione permanente dell'account.** Non si fanno tentativi «per vedere se
   passa»: si parte da creatività inequivocabilmente di servizio.
3. **Google**: dal 1 aprile 2026 le campagne devono dichiarare a livello di
   account se contengono pubblicità politica UE. Va dichiarato esplicitamente
   **no**. Una piattaforma informativa gratuita non rientra nella definizione, ma
   la dichiarazione è obbligatoria comunque.

**TikTok** vieta la pubblicità politica in tutto il mondo, e il divieto include
esplicitamente l'*issue advocacy*. Stessa regola: servizio sì, rivendicazione no.

## L'etichetta AI: tre spunte, non una

L'etichetta impressa sul video assolve l'articolo 50 del Reg. UE 2024/1689. **Non
basta per le piattaforme**, che hanno obblighi propri e li fanno rispettare
separatamente:

- **Google Ads**: controllo manuale per dichiarare l'uso di AI generativa di
  terze parti. Da luglio 2026 esiste il pannello «Come è stato creato questo
  annuncio» in My Ad Center.
- **Meta**: dichiarazione in Gestione inserzioni per creatività fotorealistiche
  generate con AI. Da giugno 2026 rilevamento automatico via metadati C2PA.
- **TikTok**: toggle AIGC. Le fonti riportano **strike immediati**, non
  avvertimenti, per contenuti AI non dichiarati.

Un avatar sintetico fotorealistico che parla in camera è il caso più
regolamentato che esista. Va dichiarato ovunque, sempre.

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

## Un angolo che i dati regalano

Nel 2024 ci sono state **2.648 acquisizioni di cittadinanza** nella comunità
srilankese, e il **52,3% per trasmissione dai genitori o al compimento dei 18
anni**. Ci sono 16.676 alunni srilankesi nelle scuole italiane. È esattamente la
finestra dei dodici mesi di cui parla la guida «Costruire il futuro»: migliaia di
famiglie ogni anno hanno quel problema, in quel momento preciso, e quasi nessuno
gliel'ha spiegato.

È il miglior gancio della campagna: non «iscriviti alla piattaforma», ma
«tuo figlio compie 18 anni: hai dodici mesi». Intento altissimo, momento
identificabile, e sta comodamente nella colonna «servizio» di Meta.

## Da verificare in piattaforma, prima di pianificare il budget

- Presenza effettiva di singalese e tamil nei menù di targeting linguistico di
  **Meta** e **TikTok**: nessuna delle due pubblica l'elenco completo.
- CPM e CPV specifici per l'Italia: i benchmark 2026 reperibili sono globali.
- Percentuale esatta della commissione Meta sulle impression in Italia.
- Specifiche ufficiali di Reels e TikTok: le pagine ufficiali non erano
  raggiungibili, i valori in uso vengono da fonti secondarie concordi.

## Fonti principali

ISTAT via tuttitalia.it (residenti al 1.1.2025) · Ministero del Lavoro,
*La comunità Srilankese in Italia — Rapporto annuale 2025* · Google Ads API,
tabella dei codici lingua · Google Advertising Policies, «Unsupported language» ·
Meta Newsroom, 2025: fine della pubblicità su temi sociali in UE · presentazione
Meta agli inserzionisti UE · TikTok Ads Manager, budget e policy sulla lingua
degli annunci · TikTok Advertising Policies, «Politics, Governments and
Elections» · YouTube Help 14328491 (dichiarazione contenuti sintetici) ·
blog.google 09/07/2026 (etichette AI negli annunci).
