# Ripresa: traduzione completa del sito

Parola magica dell'utente: **`riprendi traduzioni`** → leggere questo file ed eseguirlo dall'inizio.

## Obiettivo
Dal 3 agosto 2026 la lingua predefinita del sito e' **l'inglese**: chi arriva
senza aver mai scelto vede l'inglese, e l'italiano e' una scelta come le altre.
Il markup resta scritto in italiano — e' il testo di partenza da cui si estrae,
non la lingua in cui il sito si presenta. Chi tocca gli script deve sapere che
la lingua la decide lo snippet in cima al `<head>` e la espone come
`window.EIH_LANG`; `eih-lang-scelta` distingue una scelta vera dal valore
predefinito, e ogni script che imposta `eih-lang` per una prova deve scrivere
anche quello (`scripts/estrai-testi.mjs` estrae in italiano solo grazie a questo).
Controllo: `node scripts/audit-lingua-predefinita.mjs`.

Se l'utente sceglie singalese o tamil, **tutto** dev'essere in quella lingua.
Uniche eccezioni: nomi propri e documenti blasonati (SPID, codice fiscale,
permesso di soggiorno…). Gli spazi pubblicitari non fanno eccezione.

## Com'è fatta la traduzione
- **Cornice** (menu, piede, modali): `data-i18n` in `eih.js` / `assets/index.js`
  + dizionario condiviso `traduzioni/_ui.json` → `scripts/monta-ui.py` →
  `assets/i18n/_ui.<lg>.json`.
- **Corpo pagina**: `assets/eih-i18n-page.js` cerca l'impronta FNV-1a del testo
  italiano in `assets/i18n/<pagina>.<lg>.json`.
- **Catena**: `scripts/estrai-testi.mjs` → `i18n-src/<pagina>.json`
  (impronta → italiano); si scrive a mano `traduzioni/<pagina>.<lg>.json`
  (italiano → traduzione); `scripts/monta-traduzioni.py` monta l'uscita.
- **Eccezioni volute**: si dichiarano nel markup con `data-no-tr`, non in un
  elenco dentro gli script. La ragione vive accanto al testo.
  `scripts/segna-no-tr.py` mette l'attributo sull'elemento che contiene
  esattamente quel testo, così non si fa a mano su decine di pagine.

## Stato: l'audit esce a zero
`node scripts/audit-lingue.mjs` (59 pagine × en/si/ta) non trova più né chiavi
`data-i18n` ferme all'italiano né frammenti di corpo non tradotti;
`node scripts/audit-cornice.mjs` dice «Cornice tradotta in si e ta».
Si partiva da 341 frammenti in singalese su 51 pagine.

## Come si è arrivati a zero (per rifarlo dopo nuove pagine)

1. **Estrarre** — `scripts/estrai-testi.mjs` blocca `eih-motion.js`: la
   tipografia cinetica spezza ogni titolo in una `<span>` per parola e in
   italiano non ha nessun traduttore da aspettare, quindi lo fa subito. Senza
   quel blocco si estraeva «Aprire | un | conto», impronte che nessuna
   traduzione può agganciare.
   ```
   ln -sfn /opt/node22/lib/node_modules/playwright node_modules/playwright
   npx serve . -l 3100 --no-request-logging &
   node scripts/estrai-testi.mjs http://localhost:3100
   ```
   Il server muore sotto carico (EMFILE): estrarre a blocchi di ~10 pagine
   (`node scripts/estrai-testi.mjs http://localhost:3100 pag1,pag2,…`) e
   riavviarlo fra un blocco e l'altro. Se una pagina dice CARICAMENTO FALLITO
   il suo file non viene toccato: rifare solo quelle.

2. **Vedere cosa manca davvero** — `node scripts/elenca-non-tradotti.mjs
   http://localhost:3100 <pagine> <lingua>` stampa i testi ancora in italiano
   pagina per pagina, pronti da incollare in `traduzioni/`. È l'audit visto dal
   lato di chi traduce.

3. **Separare le due cose**: quello che va tradotto e quello che resta com'è.
   Nomi propri, marchi, sigle di volo, indirizzi email d'esempio, codici
   fiscali, hashtag, token colore → `data-no-tr` nel markup. Frasi, termini
   burocratici e titoli → `traduzioni/<pagina>.<lg>.json`.
   Restano tradotti di proposito, anche se sembrano nomi: `Tessera Sanitaria`,
   `guardia medica`, `Medico di Medicina Generale (MMG)`, `foglio rosa`,
   `Scuola Italiana`, `Travel Hub Sri Lanka`, `Patronato INPS`, `Privacy` e
   `Cookie Policy`.

4. **Montare e ricontrollare**: `python3 scripts/monta-traduzioni.py`, poi
   `node scripts/audit-lingue.mjs` finché non esce 0.

## Aperto: il contenuto delle lezioni dei corsi

L'estrazione girava da visitatore anonimo, e su `corsi` le lezioni si aprono
solo per gli iscritti: **il corpo delle lezioni non è mai entrato nel giro delle
traduzioni**. Ora `scripts/estrai-testi.mjs` imposta `eih-registered`, e la
copertura di `corsi` scende dal 100% apparente al 67% reale (350 frammenti,
234 tradotti).

I 116 frammenti scoperti **non vanno tradotti tutti**: sono in buona parte
materia di studio — `cena`, `cibo`, `chiave`, `Ciao!`, `Buongiorno` sono le
parole che l'utente deve imparare, non testo da sostituire (stesso caso del
frasario medico, che è marcato `data-no-tr`). Vanno tradotte le **spiegazioni**
intorno agli esempi («Le doppie consonanti si pronunciano più a lungo»), e per
farlo serve separare nel markup l'esempio dalla glossa. È un lavoro a parte, da
decidere: nessuno dei due tagli è ovvio.

Le lezioni avanzate hanno lo stesso problema e non compaiono nemmeno
nell'estrazione, perché servono il badge: l'estrattore si ferma allo stato
«iscritto senza badge», che è quello che vede la maggioranza.

## Trappole già pagate
- **Il container si riavvia e riporta indietro l'albero di lavoro.** Committare
  e *pushare* dopo ogni passo, non alla fine.
- `pkill -f "serve . -l 3100"` ammazza anche la shell che ha quella stringa
  nella propria riga di comando: tenere il pid in un file e uccidere quello.
- `data-i18n-ph` (segnaposto dei campi) era applicato solo da
  `assets/index.js`: sulle pagine col solo `eih.js` restava in italiano. Ora lo
  applica anche `eih.js`.
- Il metro dell'inglese guarda le sole vocali accentate italiane, dopo aver
  tolto le parole con l'iniziale maiuscola: `×` non è una lettera, `Abarekà` è
  un nome proprio e `vesak kûdu` è una traslitterazione dal singalese.
- Un elemento con `data-i18n` **e** `data-no-tr` dichiara che il valore resta
  com'è di proposito (`SPID`, `SIM / eSIM`): l'audit lo salta.
- `scripts/monta-ui.py` deve calcolare l'impronta su **unità UTF-16**
  (`s.encode('utf-16-le')`), non su punti di codice: altrimenti le voci con
  emoji non combaciano con `charCodeAt()` del browser.
- `toLocaleDateString('si-LK'/'ta-IN')` ripiega sull'inglese: le date restano
  in `it-IT`, è voluto (commento in `news.html`).
- Gli script che usano playwright vanno lanciati **dalla radice del repo**, non
  dallo scratchpad.
