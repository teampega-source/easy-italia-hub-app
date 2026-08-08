# Impostazioni bloccate

Questi valori sono stati verificati con lo strumento di misura e vanno bene
così. **Nessuno di questi si tocca di propria iniziativa**: si cambiano solo
quando lo chiede l'utente, a voce, in quella sessione. Se un lavoro futuro
sembra richiedere una modifica qui, si chiede prima.

Ultima verifica: 8 agosto 2026.

## Tavolozza — tema chiaro

Ogni fondo pieno sotto testo bianco, e ogni colore usato come testo su bianco,
sta a 4,5:1 o più (WCAG AA per testo normale). I valori non sono decorativi:
sono la soglia. Schiarirli rompe la leggibilità.

| dove | variabile | valore | bianco sopra |
|---|---|---|---|
| `eih.css` | `--taupe` | `#aa9170` | 3,00 (solo titoli grandi) |
| `eih.css` | `--coral` | `#cb4d31` | 4,52 |
| `eih.css` | `--gold` | `#8d723f` | 4,55 |
| `eih.css` | `--blue` | `#7d7058` | 4,85 |
| `eih.css` | `--blue-deep` | `#665b46` | 6,67 |
| `assets/index.css` | `--taupe` | `#8b7345` | 4,53 |
| `assets/index.css` | `--coral` | `#717780` | 4,51 |
| `assets/index.css` | `--gold` | `#6e747d` | 4,71 |
| `assets/index.css` | `--blue` | `#72777f` | 4,51 |
| `assets/index.css` | `--blue-deep` | `#5b616b` | 6,24 |

Il pulsante `.btn-accent` usa `var(--blue-deep)`/`var(--blue)`: così il fondo
cambia col tema e `--su-accento` resta leggibile. Non rimettere colori fissi.

Colori fissi già portati sopra soglia, da non riportare indietro:
`#cb4d31` (era `#eb5939`) · `#4e74c4` · `#248661` · `#347f96` · `#9b4fe4` ·
`#be5811` · `#d73d3d` · `#0f7a45` · `#676d76` · `#807561` · `#5b4728`.

## Testo sopra i fondi d'accento

`--su-accento` — bianco di giorno (`eih.css`, `assets/index.css`), `#161412`
di notte (`assets/eih-theme.css`). I fondi pieni cambiano colore col tema, il
testo sopra deve seguirli. **Non rimettere `color:#fff` fisso** su una regola
il cui fondo usa `--gold`, `--blue`, `--blue-deep` o `--taupe`.

## Lingua

- Predefinita: **inglese**. L'italiano è una scelta come le altre, e si
  applica solo con `eih-lang-scelta` in localStorage.
- Ogni testo scritto dal JavaScript dopo il caricamento va messo a mano nelle
  quattro lingue: il traduttore a impronte non lo vede.
  Già fatto: `conferma-newsletter.html`, `/cerca`, `eih-search.js`.
- Gli indici di ricerca (`cerca.html`, `eih-search.js`) hanno titoli e parole
  in inglese accanto a quelli italiani. Aggiungendo una voce, mettere
  entrambi, altrimenti quella pagina sparisce per chi cerca in inglese.
- Nomi propri (Wise, Easy Italia Hub, Money Transfer) non si traducono:
  `data-no-tr`, o quarto posto a `true` nella briciola di pane.

## Cornice di ogni pagina

Una pagina nuova carica, in fondo al `<body>`:

```html
<script src="/assets/eih-atmosphere.js" fetchpriority="low" defer></script>
<script src="/assets/eih-palette.js" fetchpriority="low" defer></script>
<script src="/assets/eih-theme.js" defer></script>
<script src="/assets/eih-consent.js" defer></script>
<script src="/assets/eih-misura.js" defer></script>
```

Senza `eih-consent.js` non esce la fascia dei cookie e «Preferenze cookie» nel
piede non apre niente. Senza `eih-theme.js` non c'è il pulsante notte/giorno.

## Misurazione

`assets/eih-misura.js` è l'unico posto dove stanno gli identificativi. Legge
il consenso da sé e non parte senza. GA4: `G-13TEJWCKZZ`. Gli altri campi
(Google Ads, Meta, TikTok) sono vuoti in attesa degli identificativi.

## Misure del testo

Sotto i 1024px nessun testo scende sotto i **13px**: lo garantisce
`assets/eih-leggibilita.css`, che ogni pagina carica per ultimo nella testata
(dopo il proprio `<style>`, altrimenti perde). Il file è generato da
`scripts/genera-leggibilita.py`, che rilegge le regole esistenti comprese
quelle dentro le media query.

- Aggiungendo una misura piccola, **rigenerare** invece di scrivere a mano nel
  file generato.
- `--text-xs` e `--text-sm` salgono a 13 e 15px sotto i 1024px.
- La radice resta a **16px** anche su telefono: c'era `html{font-size:15px}`
  sotto i 480px e rimpiccioliva tutto del 6% proprio dove serve leggere.

## Pulsanti

Il pulsante d'azione pieno è **`.btn-oro`** (in `eih.css`), con `--oro--s`
(stretto) e `--oro--scuro` (fondo inchiostro). Prima esisteva con nove nomi di
pagina — `cta-publish`, `new-btn`, `save-btn`, `suggest-btn`, `gen-btn`,
`correct-btn`, `btn-all`, `confirm-btn`, `hub-cta`, `modal-submit`,
`btn-submit`, `start-btn` — stesso colore e padding sempre un po' diverso.

- Le classi di pagina restano nel markup solo come aggancio per il JS e per i
  delta di posizione (`margin-top`, `width:100%`, `align-self`).
- `.btn-primary` resta il pulsante grigio-blu del sito; `.btn-oro` è quello
  color oro. Sono due cose diverse: non accorparle.
- Il gradiente dorato di `[data-page="esame"] .btn-cta` è fuori tavolozza per
  scelta e **non si tocca** senza che lo chieda l'utente.

## File che devono esistere in radice

`favicon.ico` — ogni browser e ogni crawler lo chiede senza che nessuno lo
linki. Mancava e rispondeva 404 a ogni visita.

## Indicizzazione

Mappa del sito, `noindex` e canonical devono dire la stessa cosa. Una pagina
elencata nella mappa e insieme marcata `noindex` è una contraddizione, e
Search Console la segnala.

Restano **fuori dalla mappa e con `noindex`**, di proposito: `cerca`,
`cv-builder`, `dashboard`, `documenti`, `permesso-tracker`, `profili`,
`registrati`, `benvenuta`, `abbonamenti`, `cookie`, `404`, `offline`.

Dopo ogni modifica alla mappa o a un `<meta name="robots">`:

```
python3 scripts/audit-indicizzazione.py    # esce 1 se qualcosa si contraddice
```

## Affiliazioni

- Wise: camref Partnerize `1110lKde8`, valore predefinito in `api/go.js`.
  `AFF_WISE` lo sovrascrive.
- Ogni link affiliato porta `rel="sponsored"` e la commissione è dichiarata
  nella pagina. Non si toglie.

## Effetti che restano spenti

Il tilt 3D sulle card è stato tolto di proposito (ruotava i riquadri sotto il
mouse e i bordi finivano storti). Non va rimesso.

## Verifiche da rifare dopo un lavoro grosso

```
npx serve . -l 3100 &
node scripts/audit-lingue.mjs              # nessuna carenza su 60 pagine
node scripts/audit-cornice.mjs             # cornice tradotta in si e ta
node scripts/audit-lingua-predefinita.mjs  # il sito parte in inglese
```
