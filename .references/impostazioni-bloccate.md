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
