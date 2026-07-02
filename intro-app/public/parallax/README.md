# Asset parallax — naming convention (drop-in)

Metti qui i file reali con **questi nomi esatti**. Appena presenti, sostituiscono
i placeholder procedurali (nessuna modifica al codice richiesta).

| Scena | Foto (color) | Depth map |
|-------|--------------|-----------|
| 1 — Sri Lanka (distacco dalla terra) | `scene1_srilanka.jpg` | `scene1_srilanka_depth.png` |
| 2 — Sopra le nuvole (avvicinamento Italia) | `scene2_clouds_italy.jpg` | `scene2_clouds_italy_depth.png` |
| 3 — Discesa su Italia (arrivo) | `scene3_italy_descent.jpg` | `scene3_italy_descent_depth.png` |

## Specifiche

- **Risoluzione:** 1376×768 (16:9). Anche 1920×1080 va bene, stesso aspect ratio.
- **Depth map:** grayscale, **BIANCO = vicino**, **NERO = lontano** (convenzione MiDaS/Depth-Anything).
- **Formato color:** JPG (qualità ~90). **Depth:** PNG (8-bit grayscale).

## Flusso "domani in un comando"

Appena l'egress è sbloccato (network policy → Custom) e MeiGen genera le 3 foto:

1. Salva le 3 foto qui coi nomi color della tabella.
2. Depth map — **due ricette**:

**A) Qualità HYPER-REAL — Depth Anything V2** (serve egress: `huggingface.co`, `pypi.org`)
```bash
pip install transformers torch pillow
python - <<'PY'
from transformers import pipeline; from PIL import Image
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Large-hf")
for n in ["scene1_srilanka","scene2_clouds_italy","scene3_italy_descent"]:
    d = pipe(Image.open(f"{n}.jpg"))["depth"]   # bianco=vicino già corretto
    d.save(f"{n}_depth.png")
PY
```

**B) Fallback OFFLINE (nessuna rete)** — euristica su Chromium preinstallato:
```bash
node scripts/gen-depth.mjs public/parallax/scene1_srilanka.jpg   # → *_depth.png
```

3. Fatto: i placeholder spariscono da soli, l'intro usa le foto reali.

> Nota depth: grayscale, **BIANCO = vicino**. Se un modello dà l'inverso, invertire i valori.
> Lo shader carica la depth come texture **lineare** (NoColorSpace) — non serve altro.

Finché le foto non ci sono, i placeholder procedurali (con foschia + grana) rendono
l'effetto dimostrabile.
