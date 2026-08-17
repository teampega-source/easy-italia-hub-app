---
name: remove-ai-watermarks
description: "Ispeziona e rimuove filigrane di provenienza AI da immagini e video con la CLI remove-ai-watermarks: etichette visibili, filigrane invisibili (SynthID, TrustMark, DWT-DCT), metadati e dichiarazioni C2PA. Usare quando: identificare che filigrane porta un file, ripulire una generazione propria, indagare un falso positivo, verificare cosa resta dopo una conversione. Vale su file locali, non sui media già pubblicati sul sito."
source: wiltodelta/remove-ai-watermarks (upstream CLAUDE.md + docs/cli.md)
---

# Remove AI Watermarks

CLI Python per le filigrane di provenienza AI. Pacchetto su PyPI:
`remove-ai-watermarks` (0.26.x). Progetto: github.com/wiltodelta/remove-ai-watermarks

## Limite non negoziabile per questo repo

Easy Italia Hub pubblica immagini generate con AI e le marca `data-ai-gen`,
obbligo dell'art. 50 Reg. UE 2024/1689 (sanzioni fino a 15M€). **Sulle immagini
l'etichetta resta sempre**: questa skill non si usa per toglierla, né per
ripulire i metadati di un'immagine prima del deploy.

Video, voci sintetiche e ogni altro caso: **decide l'utente, volta per volta**.
Chiedere prima di toccare qualsiasi filigrana su un media destinato al sito.

Ambiti legittimi: capire cosa porta dentro un file (`identify`), lavorare su
materiale proprio non destinato al sito, indagare un falso positivo, verificare
cosa sopravvive a una conversione o a un ridimensionamento.

Fuori ambito anche a monte: la CLI non tocca filigrane che proteggono l'asset a
pagamento di terzi (banche immagini, anteprime tiled, marketplace). Non usarla
per aggirarle.

## Installazione

Non è installata di default. La sessione è effimera: va reinstallata ogni volta.

```bash
uv tool install "remove-ai-watermarks[visible,detect,heif]"   # oppure pipx install
remove-ai-watermarks --help
```

Gli extra sono modulari e pesano molto: `[visible]` per i pixel (OpenCV),
`[detect]` per i segnali DWT-DCT, `[trustmark]` per Adobe TrustMark (Python
3.11–3.12), `[video]` più ffmpeg sul PATH per i video, `[migan]`/`[lama]` per
l'inpainting, `[qwen-zimage]` per le invisibili (richiede CUDA — in questo
container non c'è GPU). `[all]` scarica tutto: evitarlo salvo necessità.

## Comandi

| Comando | Cosa fa |
|---|---|
| `identify FILE` | Elenca i segnali trovati: metadati, C2PA, visibili, invisibili |
| `metadata FILE` | Solo metadati e dichiarazioni C2PA — nessun extra richiesto |
| `visible FILE` | Rimuove etichette visibili note dal registro |
| `erase FILE --region X,Y,W,H` | Cancella una regione indicata a mano, generica |
| `invisible FILE` | Filigrane invisibili — serve CUDA |
| `all FILE` | Tutto insieme — serve CUDA |
| `video …` | Le stesse operazioni sui video — serve ffmpeg |
| `batch …` | Lotti; richiede lo stesso extra della modalità scelta |

Partire sempre da `identify`: dice cosa c'è prima di toccare qualsiasi cosa, ed è
l'unico comando utile nella maggior parte dei casi.

## Note operative

- Lavorare su una copia in `/tmp/.../scratchpad`, mai sull'originale in `assets/`.
- Nessun modello va scaricato per `identify` e `metadata`: se un comando inizia a
  scaricare pesi, è perché è stato scelto un extra ML.
- La rimozione non è garantita né reversibile: verificare l'esito con un secondo
  `identify` e confrontare i due output.
