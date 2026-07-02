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

## Come generare la depth map da una foto

Modelli monoculari (una foto → depth):
- **Depth Anything V2** / **MiDaS** (locale o via HuggingFace Space)
- Output: normalizzare in 0–255, bianco vicino. Se il modello dà il contrario, invertire.

Le foto reali sono ancora da fornire (generazione AI bloccata dalla egress policy
dell'ambiente). Nel frattempo i placeholder procedurali rendono l'effetto dimostrabile.
