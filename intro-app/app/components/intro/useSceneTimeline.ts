// ---------------------------------------------------------------------------
// useSceneTimeline.ts — config scene + easing + math di timeline/crossfade/flash.
//
// 3 scene continue con crossfade (~0.8s). Ogni scena legge un clock condiviso
// (elapsed in secondi) e calcola: opacity (fade in/out), progress 0..1 locale,
// e i parametri di "camera" (zoom/pan/rise) via easing.
// ---------------------------------------------------------------------------

export type Easing = (t: number) => number;

export const easeInOutCubic: Easing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeIn: Easing = (t) => t * t;
export const easeInExpo: Easing = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * (t - 1)));
export const linear: Easing = (t) => t;

export interface SceneConfig {
  index: number;
  duration: number;      // secondi
  easing: Easing;
  // Trasformazione "camera": interpolata da 'from' a 'to' lungo la scena.
  zoomFrom: number;      // scala mesh iniziale
  zoomTo: number;
  riseFrom: number;      // position.y iniziale (dolly su/giù)
  riseTo: number;
  panFrom: [number, number]; // uParallax iniziale
  panTo: [number, number];
  depthScale: number;    // ampiezza rilievo Z
}

export interface Timeline {
  scenes: SceneConfig[];
  starts: number[];      // start time assoluto per scena
  crossfade: number;
  total: number;         // durata totale (fino al flash)
  flashAt: number;       // istante del white flash
}

// Durate base (spec): 5s / 5s / 7s. Crossfade 0.8s.
const CROSSFADE = 0.8;

export function buildTimeline(speed = 1): Timeline {
  const scenes: SceneConfig[] = [
    {
      index: 0,
      duration: 5 * speed,
      easing: easeInOutCubic,
      // Sri Lanka "distacco": zoom-out + camera che sale (tilt/dolly up)
      zoomFrom: 1.35,
      zoomTo: 1.0,
      riseFrom: -0.15,
      riseTo: 0.25,
      panFrom: [0.0, 0.02],
      panTo: [0.06, -0.04],
      depthScale: 1.15,
    },
    {
      index: 1,
      duration: 5 * speed,
      easing: easeIn,
      // Sopra le nuvole "avvicinamento": zoom-in + dolly forward
      zoomFrom: 1.0,
      zoomTo: 1.5,
      riseFrom: 0.1,
      riseTo: -0.05,
      panFrom: [-0.04, 0.0],
      panTo: [0.03, 0.02],
      depthScale: 0.9,
    },
    {
      index: 2,
      duration: 7 * speed,
      easing: easeInExpo,
      // Discesa su Italia "arrivo": zoom-in accelerato → flash
      zoomFrom: 1.05,
      zoomTo: 2.4,
      riseFrom: 0.0,
      riseTo: -0.2,
      panFrom: [0.0, 0.0],
      panTo: [-0.05, 0.03],
      depthScale: 1.3,
    },
  ];

  // Start con sovrapposizione (crossfade): la scena n+1 parte crossfade prima
  // della fine della scena n.
  const starts: number[] = [];
  let t = 0;
  for (let i = 0; i < scenes.length; i++) {
    starts.push(t);
    t += scenes[i].duration - CROSSFADE;
  }
  const last = scenes[scenes.length - 1];
  const total = starts[scenes.length - 1] + last.duration;

  return { scenes, starts, crossfade: CROSSFADE, total, flashAt: total - 0.5 };
}

// Opacity di una scena dato l'elapsed globale: fade-in all'inizio, fade-out alla
// fine, coerente col crossfade. La prima scena parte già opaca; l'ultima resta
// piena fino al flash.
export function sceneOpacity(tl: Timeline, i: number, elapsed: number): number {
  const s = tl.scenes[i];
  const start = tl.starts[i];
  const end = start + s.duration;
  const cf = tl.crossfade;

  if (elapsed < start - cf || elapsed > end) return 0;

  let o = 1;
  // fade-in (tranne la prima scena)
  if (i > 0 && elapsed < start + cf) {
    o = Math.min(o, (elapsed - (start - cf)) / (cf * 2));
  }
  // fade-out (tranne l'ultima scena, che sfuma nel flash)
  if (i < tl.scenes.length - 1 && elapsed > end - cf) {
    o = Math.min(o, (end - elapsed) / cf);
  }
  return Math.max(0, Math.min(1, o));
}

// Progress locale 0..1 di una scena.
export function sceneProgress(tl: Timeline, i: number, elapsed: number): number {
  const s = tl.scenes[i];
  const start = tl.starts[i];
  return Math.max(0, Math.min(1, (elapsed - start) / s.duration));
}
