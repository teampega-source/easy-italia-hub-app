// ─────────────────────────────────────────────────────────────
// Easy Italia Hub — Knowledge Base for RAG
// Source of truth for the "Consigliere AI" (see Documento Strategico §3.7, §9-C).
//
// IMPORTANT (per the strategic doc): bureaucratic specifics — fees, deadlines,
// exact procedures — CHANGE over time and MUST be verified against official
// sources at the moment of writing (Polizia di Stato, INPS, Agenzia delle
// Entrate, Ministero dell'Interno). The chunks below give orientation, NOT
// legal certainty. The system prompt instructs the model to always point users
// to the official source for anything that could have changed.
// ─────────────────────────────────────────────────────────────

/** @typedef {{id:string, topic:string, keywords:string[], text:string, source?:string}} Chunk */

/** @type {Chunk[]} */
const KNOWLEDGE = [
  // ── Platform / vision ──
  {
    id: "platform-vision",
    topic: "Cos'è Easy Italia Hub",
    keywords: ["easy italia", "piattaforma", "cos'è", "chi siete", "vision", "percorso", "what is", "platform", "about"],
    text: "Easy Italia Hub è una piattaforma di percorso (non un semplice portale) per gli stranieri che vivono e lavorano in Italia, con attenzione particolare alla comunità srilankese (cingalese e tamil). Il principio: la parte informativa (guide, news, community, servizi) è accessibile a tutti gratis; il 'percorso' guidato personalizzato è un valore aggiunto opzionale. Differenza dai CAF/patronati: loro sono reattivi e trattano la pratica singola, noi siamo proattivi (avvisiamo prima delle scadenze) e colleghiamo i puntini (lavoro → reddito → mutuo → casa) nella lingua della persona.",
  },
  {
    id: "nine-phases",
    topic: "Il Percorso di Vita — le 9 fasi",
    keywords: ["fasi", "percorso", "journey", "stato", "tappe", "9 fasi", "nine phases", "arrivo", "integrazione"],
    text: "Il percorso utente evolve in 9 fasi, ognuna sblocca strumenti diversi: 1) Arrivo (primi 90 giorni: codice fiscale, SIM, conto base, alloggio); 2) Regolarizzazione (permesso di soggiorno, residenza, tessera sanitaria); 3) Lavoro (riconoscimento titoli, busta paga, formazione); 4) Casa (dall'affitto alla proprietà); 5) Famiglia (ricongiungimento, scuola dei figli, assegno unico); 6) Educazione Finanziaria (tasse, contributi, pensione, risparmio); 7) Imprenditoria (partita IVA, regime forfettario); 8) Patrimonio (mutuo, acquisto casa, investimenti); 9) Integrazione Definitiva (cittadinanza, lungo soggiorno UE).",
  },
  // ── Bureaucracy ──
  {
    id: "permesso-soggiorno",
    topic: "Permesso di Soggiorno",
    keywords: ["permesso", "soggiorno", "rinnovo", "kit", "questura", "residence permit", "permit", "poste"],
    text: "Il permesso di soggiorno si richiede/rinnova tramite il 'kit giallo' disponibile agli uffici postali con sportello Sportello Amico; la domanda si presenta in posta e poi si va in Questura per foto e impronte. Il rinnovo va avviato idealmente prima della scadenza (in genere ~60 giorni prima). Documenti tipici: passaporto, marca da bollo, ricevute, documentazione che giustifica il motivo (lavoro, famiglia, studio). Verifica sempre i requisiti aggiornati sul sito della Polizia di Stato (portaleimmigrazione) e del Ministero dell'Interno.",
    source: "Polizia di Stato — portaleimmigrazione.it",
  },
  {
    id: "spid",
    topic: "SPID — Identità Digitale",
    keywords: ["spid", "identità digitale", "posteid", "namirial", "digital identity", "login", "credenziali", "spid a pagamento", "costo spid", "cie", "carta identità elettronica", "6 euro"],
    text: "Lo SPID (Sistema Pubblico di Identità Digitale) serve per accedere ai servizi della Pubblica Amministrazione online. Si ottiene tramite un Identity Provider accreditato (es. PosteID, Namirial, InfoCert, Aruba). Servono: un documento d'identità italiano valido o permesso, la tessera sanitaria/codice fiscale, un'email e un numero di cellulare. Il riconoscimento può essere di persona (es. ufficio postale), via webcam o con CIE/firma digitale. Verifica i provider attivi su spid.gov.it. NOVITÀ 2026: dal 2026 lo SPID di Poste (PosteID) ha un costo di circa 6€ all'anno per il mantenimento (resta gratuito il primo anno, per i minori di 18 anni e per gli iscritti AIRE). Alternativa gratuita: la CIE (Carta d'Identità Elettronica), che dà accesso agli stessi servizi pubblici online.",
    source: "spid.gov.it",
  },
  {
    id: "codice-fiscale",
    topic: "Codice Fiscale",
    keywords: ["codice fiscale", "agenzia entrate", "tax code", "aa4/8", "tessera"],
    text: "Il codice fiscale identifica la persona verso la Pubblica Amministrazione italiana. Si richiede all'Agenzia delle Entrate (modulo AA4/8) con un documento d'identità/passaporto; per i cittadini non UE può essere rilasciato anche dallo Sportello Unico per l'Immigrazione o contestualmente al permesso di soggiorno. È gratuito. Verifica la procedura aggiornata su agenziaentrate.gov.it.",
    source: "Agenzia delle Entrate — agenziaentrate.gov.it",
  },
  {
    id: "residenza",
    topic: "Residenza anagrafica",
    keywords: ["residenza", "anagrafe", "comune", "registry", "iscrizione anagrafica", "carta identità"],
    text: "La residenza anagrafica si registra al Comune dove si vive stabilmente (ufficio Anagrafe). Serve per la carta d'identità, il medico di base e molti diritti. Richiede un documento valido, il permesso di soggiorno in corso di validità e la prova di disponibilità dell'alloggio (contratto di affitto, ospitalità). Dopo la richiesta, la polizia municipale può effettuare un controllo di dimora. Verifica i requisiti sul sito del tuo Comune.",
  },
  {
    id: "tessera-sanitaria",
    topic: "Tessera sanitaria e SSN",
    keywords: ["tessera sanitaria", "ssn", "salute", "medico di base", "asl", "health card", "iscrizione ssn"],
    text: "L'iscrizione al Servizio Sanitario Nazionale (SSN) dà diritto al medico di base e alle cure. Si fa alla ASL del territorio dopo aver ottenuto la residenza (o domicilio) e con permesso di soggiorno valido. Per alcune categorie l'iscrizione è obbligatoria e gratuita, per altre volontaria con contributo. Si ottiene poi la tessera sanitaria. Verifica le regole della tua Regione/ASL.",
  },
  {
    id: "naspi",
    topic: "NASpI — disoccupazione",
    keywords: ["naspi", "disoccupazione", "inps", "unemployment", "licenziamento"],
    text: "La NASpI è l'indennità di disoccupazione INPS per chi perde involontariamente il lavoro dipendente. Va richiesta entro 68 giorni dalla cessazione, tramite il sito INPS (serve SPID), un patronato o il contact center. La durata e l'importo dipendono dalla storia contributiva. Verifica requisiti e importi aggiornati su inps.it.",
    source: "INPS — inps.it",
  },
  {
    id: "cittadinanza",
    topic: "Cittadinanza e lungo soggiorno",
    keywords: ["cittadinanza", "citizenship", "lungo soggiorno", "permesso ue", "naturalizzazione", "10 anni"],
    text: "La cittadinanza italiana per naturalizzazione richiede in genere 10 anni di residenza legale e continuativa per i cittadini non UE (meno in altri casi, es. matrimonio o discendenza). Il permesso di soggiorno UE per soggiornanti di lungo periodo richiede in genere 5 anni di residenza, reddito e l'attestato di conoscenza della lingua italiana (livello A2). Requisiti e tempi cambiano: verifica su interno.gov.it.",
    source: "Ministero dell'Interno — interno.gov.it",
  },
  // ── Finance ──
  {
    id: "money-transfer",
    topic: "Money transfer / rimesse verso lo Sri Lanka",
    keywords: ["money transfer", "rimesse", "wise", "western union", "ria", "remittance", "inviare soldi", "sri lanka"],
    text: "Per inviare denaro verso lo Sri Lanka conviene confrontare i servizi in tempo reale, perché le commissioni e i tassi di cambio variano molto. Wise tende ad avere commissioni basse e cambio reale; Western Union e Ria hanno reti capillari per il ritiro in contanti. La piattaforma aiuta a bilanciare il dovere verso la famiglia in Sri Lanka con la crescita finanziaria in Italia (rimesse intelligenti). Confronta sempre il costo totale (commissione + margine sul cambio) prima di inviare.",
  },
  {
    id: "busta-paga",
    topic: "Busta paga e tasse (educazione finanziaria)",
    keywords: ["busta paga", "lordo", "netto", "irpef", "contributi", "tasse", "payslip", "stipendio"],
    text: "La busta paga mostra la differenza tra lordo e netto: dal lordo si sottraggono i contributi previdenziali (INPS) e l'IRPEF (imposta sul reddito a scaglioni), più eventuali addizionali regionali/comunali. Capire la busta paga aiuta a pianificare risparmio, mutuo e pensione. Per chi pensa di tornare in Sri Lanka è importante sapere cosa succede ai contributi versati in Italia (totalizzazione/convenzioni). I simulatori della piattaforma stimano il netto, ma per i conteggi ufficiali rivolgiti a un commercialista o patronato.",
  },
  {
    id: "partita-iva",
    topic: "Partita IVA e imprenditoria",
    keywords: ["partita iva", "forfettario", "impresa", "business", "minimarket", "ristorante", "aprire attività", "self-employed"],
    text: "Per lavorare in proprio o aprire un'attività serve la partita IVA. Il regime forfettario offre tassazione agevolata sotto una certa soglia di ricavi ed è spesso il punto di partenza per piccole attività (minimarket, ristorazione, servizi di cura, import). Aprire un'impresa richiede anche adempimenti (Camera di Commercio, INPS gestione commercianti/artigiani, eventuali licenze comunali). Conviene farsi seguire da un commercialista, possibilmente che parli la lingua dell'utente.",
  },
  // ── Community / services ──
  {
    id: "community",
    topic: "Community",
    keywords: ["community", "comunità", "supporto", "forum", "persone", "gruppo"],
    text: "La community riunisce migliaia di srilankesi (5.000+) che si supportano ogni giorno: domande pratiche, esperienze, eventi culturali. È pensata come ponte tra chi è appena arrivato e chi è in Italia da anni. Il principio è 'insieme è più facile'.",
  },
  {
    id: "marketplace",
    topic: "Marketplace di professionisti verificati",
    keywords: ["marketplace", "commercialista", "avvocato", "professionisti", "consulenza", "mediatore"],
    text: "La piattaforma offre un marketplace di professionisti verificati (commercialisti, avvocati, mediatori) che parlano la lingua dell'utente. È una delle monetizzazioni più pulite: commissione su consulenze prenotate, mai vendita aggressiva. Utile per pratiche complesse dove la barriera linguistica fa più danni.",
  },
  // ── Lavoro ──
  {
    id: "lavoro-contratti",
    topic: "Lavoro — contratti, diritti e busta paga",
    keywords: ["lavoro", "contratto", "ccnl", "tempo determinato", "indeterminato", "part-time", "straordinario", "ferie", "tredicesima", "tfr", "licenziamento", "dimissioni", "preavviso", "job", "work", "employment"],
    text: "In Italia il rapporto di lavoro dipendente è regolato dal Contratto Collettivo Nazionale di Lavoro (CCNL) del settore. Il contratto può essere a tempo determinato (max 24 mesi, prorogabile) o indeterminato. Diritti fondamentali: ferie pagate (min 4 settimane/anno), tredicesima, TFR (liquidazione ~1 mese di stipendio/anno accantonato), straordinari retribuiti. In caso di licenziamento ingiustificato si ha diritto alla NASpI (disoccupazione INPS). Per le dimissioni serve dare il preavviso previsto dal contratto. Verifica sempre le condizioni specifiche con un patronato o sindacato.",
    source: "Ministero del Lavoro — lavoro.gov.it",
  },
  // ── Casa / affitto ──
  {
    id: "casa-affitto",
    topic: "Casa — affitto, contratto, agevolazioni",
    keywords: ["casa", "affitto", "contratto affitto", "sfratto", "canone", "deposito cauzionale", "agenzia immobiliare", "cedolare secca", "erp", "edilizia popolare", "house", "rent", "apartment"],
    text: "Il contratto di affitto standard in Italia è 4+4 anni (residenziale) o 3+2 anni (transitorio). Va registrato all'Agenzia delle Entrate entro 30 giorni dalla firma — il costo di registrazione è in genere 50/50 tra inquilino e proprietario. Il deposito cauzionale non può superare 3 mensilità. Attenzione: affittare senza contratto registrato espone l'inquilino a sfratti immediati e impedisce la residenza anagrafica. Le case popolari (ERP) richiedono di partecipare ai bandi comunali, con requisiti reddituali e di residenza. Per agevolazioni sull'affitto (bonus affitti, cedolare secca) verifica con il Comune o un CAF.",
    source: "Agenzia delle Entrate — agenziaentrate.gov.it",
  },
  // ── Famiglia ──
  {
    id: "ricongiungimento-familiare",
    topic: "Ricongiungimento familiare",
    keywords: ["ricongiungimento", "famiglia", "coniuge", "figli", "genitori", "family reunification", "visto familiare", "nucleo familiare", "assegno unico"],
    text: "Il ricongiungimento familiare permette di far venire in Italia il coniuge, i figli minori e in alcuni casi i genitori a carico. Richiede: permesso di soggiorno in corso di validità (non sempre il primo — dipende dal tipo), reddito minimo annuo (circa 8.500 € per il primo familiare, di più per ogni aggiunta), alloggio adeguato certificato. Si presenta allo Sportello Unico per l'Immigrazione. I tempi sono lunghi (spesso 6-12 mesi). I figli minori hanno diritto all'iscrizione scolastica indipendentemente dallo stato di soggiorno. L'Assegno Unico spetta anche ai titolari di permesso di soggiorno UE o di lungo periodo.",
    source: "Ministero dell'Interno — interno.gov.it",
  },
  // ── Salute ──
  {
    id: "salute-ssn",
    topic: "Salute — SSN, medico di base, pronto soccorso, STP",
    keywords: ["salute", "medico", "medico di base", "pronto soccorso", "stp", "sanità", "farmaco", "ticket", "ssn", "asl", "health", "doctor", "hospital", "medicine"],
    text: "Chi ha residenza e permesso di soggiorno ha diritto all'iscrizione al SSN: scegli il medico di base alla tua ASL, gratuito per la maggior parte dei lavoratori. Il ticket sanitario dipende dal reddito (ISEE) — molti lavoratori a basso reddito sono esentati. Il Pronto Soccorso è sempre accessibile a chiunque, italiani o stranieri, documentati o no. Chi non ha permesso in regola può usare il Codice STP (Straniero Temporaneamente Presente) per cure urgenti e non urgenti. I farmaci con ricetta hanno un costo ridotto (ticket); alcuni sono gratuiti. Verifica esenzioni e fasce di reddito sul sito della tua Regione o ASL.",
    source: "Ministero della Salute — salute.gov.it",
  },
  // ── Fisco / dichiarazione ──
  {
    id: "730-dichiarazione-redditi",
    topic: "Dichiarazione dei redditi — 730 e modello Redditi",
    keywords: ["730", "dichiarazione redditi", "irpef", "detrazioni", "deduzioni", "caf", "modello redditi", "rimborso", "isee", "fisco", "taxes", "tax return"],
    text: "La dichiarazione dei redditi in Italia si fa con il Modello 730 (per lavoratori dipendenti e pensionati, più semplice, da aprile a settembre) o il Modello Redditi (per autonomi e casi complessi). Si può presentare gratis tramite un CAF o un patronato. Vantaggi: recuperare detrazioni (spese mediche, affitto, istruzione) e deduzioni (contributi volontari, fondi pensione). L'ISEE si calcola separatamente per accedere a bonus e agevolazioni. Chi guadagna solo da lavoro dipendente e non ha altri redditi può non presentarla, ma in genere conviene farlo per recuperare quanto spettante. Verifica scadenze e requisiti su agenziaentrate.gov.it o presso un CAF.",
    source: "Agenzia delle Entrate — agenziaentrate.gov.it",
  },
  // ── Scuola ──
  {
    id: "scuola-figli",
    topic: "Scuola e istruzione per i figli",
    keywords: ["scuola", "scuola materna", "elementare", "media", "superiore", "iscrizione scuola", "asilo", "nido", "figli", "studenti", "education", "school", "children"],
    text: "L'iscrizione scolastica è un diritto per tutti i minori presenti in Italia, indipendentemente dal loro stato di soggiorno. Per iscrivere i figli serve recarsi alla segreteria della scuola scelta con: documento del genitore, codice fiscale del bambino e (se disponibile) permesso di soggiorno. L'istruzione è obbligatoria dai 6 ai 16 anni. Gli asili nido comunali hanno rette proporzionali all'ISEE — spesso ci sono liste d'attesa, meglio iscriversi presto. Molte scuole offrono corsi di italiano L2 per bambini che non parlano la lingua. Per il riconoscimento di titoli di studio esteri dei figli rivolgersi all'Ufficio Scolastico Regionale.",
    source: "Ministero dell'Istruzione — istruzione.gov.it",
  },
];

/**
 * Lightweight keyword retrieval (RAG without a vector DB — suitable for a small,
 * curated KB on serverless). Scores each chunk by keyword/topic overlap with the
 * query and returns the top matches. For larger KBs, swap this for embeddings.
 * @param {string} query
 * @param {number} k
 * @returns {Chunk[]}
 */
function retrieve(query, k = 4) {
  const q = (query || "").toLowerCase();
  const qWords = q.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
  const scored = KNOWLEDGE.map((c) => {
    let score = 0;
    for (const kw of c.keywords) {
      if (q.includes(kw)) score += 3; // full keyword phrase match
    }
    const hay = (c.topic + " " + c.text + " " + c.keywords.join(" ")).toLowerCase();
    for (const w of qWords) {
      if (hay.includes(w)) score += 1; // partial word overlap
    }
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const hits = scored.filter((s) => s.score > 0).slice(0, k).map((s) => s.c);
  // Always include the platform overview so the assistant stays on-brand.
  if (!hits.find((h) => h.id === "platform-vision")) hits.push(KNOWLEDGE[0]);
  return hits;
}

module.exports = { KNOWLEDGE, retrieve };
