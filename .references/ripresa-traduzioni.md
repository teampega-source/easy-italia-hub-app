# Ripresa: traduzione completa del sito

Parola magica dell'utente: **`riprendi traduzioni`** → leggere questo file ed eseguirlo dall'inizio.

## Obiettivo
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

## Fatto (PR #333, mergiata)
Prima si traduce, poi si spezzano i titoli in parole: la tipografia cinetica
(`assets/eih-motion.js`) trasformava ogni titolo in una `<span>` per parola e,
se arrivava prima del traduttore, il titolo non era più una frase e restava in
italiano. Ora aspetta `EIHPageI18N.pronta` (tetto 4 s).
Più: `data-no-tr` su corsi/moduli/podcast, e l'occhiello di `scuola` che
diceva 託児所 al posto di «asilo nido».

## Da fare, in ordine

1. **Ri-estrarre tutto** con il fix attivo — le impronte dei titoli finora
   erano una lotteria.
   ```
   ln -sfn /opt/node22/lib/node_modules/playwright node_modules/playwright
   npx serve . -l 3100 --no-request-logging &
   node scripts/estrai-testi.mjs http://localhost:3100
   ```
   Il server muore sotto carico (EMFILE): estrarre a blocchi di ~15 pagine
   (`node scripts/estrai-testi.mjs http://localhost:3100 pag1,pag2,…`) e
   riavviarlo fra un blocco e l'altro. Se una pagina dice CARICAMENTO FALLITO
   il suo file non viene toccato: rifare solo quelle.

2. **Tradurre i frammenti nuovi.** `python3 scripts/monta-traduzioni.py`
   segnala le voci senza riscontro (testo italiano cambiato) e la copertura
   per pagina. I titoli interi vanno tradotti come frasi, non a pezzi.

3. **Allargare `AMMESSI` in `scripts/audit-lingue.mjs`** — solo classi di
   stringa che nessun markup può marcare una per una:
   - togliere gli emoji iniziali prima del confronto (`🇱🇰 Sinhala`,
     `🎙️ Spotify`, `📘 Sri Lankans in Italy (Facebook)`,
     `🇱🇰 Embassy of Sri Lanka — Rome`);
   - domini `.co` (`coolors.co`);
   - hashtag accentati: `^#\w+$` non prende `#Comunità` → `^#[\p{L}\d_]+$/u`;
   - token colore (`Taupe · #7d7058`);
   - codice fiscale (`^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$`);
   - aeroporti (`Roma Fiumicino (FCO)`, `Milano Malpensa (MXP)`);
   - certificati consolari srilankesi (`Consular Birth Certificate`,
     `Citizenship Registration Certificate`, `Citizenship 1`,
     `new passport in lieu of…`);
   - enti e servizi: `Identity Provider`, `PosteID`, `Namirial ID`,
     `Idealista`, `OpenStreetMap`, `Patente Guru`, `Motorizzazione Civile`,
     `foglio rosa`, `Medico di Medicina Generale (MMG)`, `EDISU/ARDSU/DSU`,
     `European Job Days`, `Portale della Lingua Italiana`,
     `Impara l'italiano con la RAI`, `Easy Italia Academy`.

   **Non** allargare per `Privacy Policy`, `Cookie Policy`, `Scuola Italiana`,
   `Travel Hub Sri Lanka`, `Assegno Unico`, `tessera sanitaria`: `_ui.json` li
   traduce già nelle briciole di pane, quindi ammetterli nasconderebbe un buco
   vero. Vanno tradotti anche nel corpo.

4. **Girare finché non esce 0**: `node scripts/audit-lingue.mjs` (server su
   3100). Ultima misura nota: 116 frammenti su 46 pagine — buona parte dovuti
   al bug dei titoli spezzati, quindi ora saranno meno.

5. Commit, push, PR, merge in autonomia (squash su main).

## Trappole già pagate
- **Il container si riavvia e riporta indietro l'albero di lavoro.** Committare
  e *pushare* dopo ogni passo, non alla fine.
- `scripts/monta-ui.py` deve calcolare l'impronta su **unità UTF-16**
  (`s.encode('utf-16-le')`), non su punti di codice: altrimenti le voci con
  emoji non combaciano con `charCodeAt()` del browser.
- `toLocaleDateString('si-LK'/'ta-IN')` ripiega sull'inglese: le date restano
  in `it-IT`, è voluto (commento in `news.html`).
- Gli script che usano playwright vanno lanciati **dalla radice del repo**, non
  dallo scratchpad.
