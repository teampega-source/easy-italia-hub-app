# Easy Italia Hub — Intro cinematografica (depth-parallax)

App **isolata** Next.js + React Three Fiber. Non tocca le pagine statiche del sito:
gira a sé e, a intro finita, reindirizza al sito reale (`NEXT_PUBLIC_SITE_URL`).

## Cos'è

Intro full-screen "come se fossi dentro il sito": 3 scene continue con crossfade
e depth-map displacement (parallax 3D reale, non CSS):

1. **Sri Lanka** — distacco dalla terra (zoom-out + camera che sale).
2. **Sopra le nuvole** — avvicinamento all'Italia (zoom-in + dolly forward).
3. **Discesa su Italia** — Vesuvio/Colosseo/Pisa/pista (zoom accelerato → white flash → sito).

Tecnica: PlaneGeometry 256×256 + ShaderMaterial; la depth map (bianco=vicino)
sposta i vertici lungo Z → volume reale. Color grading golden-hour + vignetta nello shader.

## Avvio

```bash
cd intro-app
npm install
npm run dev      # http://localhost:3000
```

Build produzione:

```bash
npm run build && npm start
```

## Asset

Le foto reali vanno in `public/parallax/` (vedi `public/parallax/README.md`).
Finché mancano, l'app genera **placeholder procedurali** via canvas, così l'effetto
è già dimostrabile senza binari né rete.

## Progressive enhancement

- `prefers-reduced-motion` → salta l'intro.
- Mobile/coarse pointer → durata −30%, `dpr` limitato a 1.5.
- `sessionStorage.introSeen` → una sola volta per sessione.
- Pulsante **Salta intro** sempre disponibile.

## Config

- `NEXT_PUBLIC_SITE_URL` — URL del sito a cui passare a fine intro
  (default `https://www.easyitaliahub.it/`).
