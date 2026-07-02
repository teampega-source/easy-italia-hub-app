// ---------------------------------------------------------------------------
// depthShader.ts — GLSL per il parallax "dentro la foto" (depth-map displacement)
//
// APPROCCIO SCELTO: displacement per-vertice continuo (NON layered planes).
// Motivo: una singola PlaneGeometry molto suddivisa (256x256) + depth map come
// heightmap dà il "3D reale" richiesto (parallax continuo, niente stacchi tra
// layer), con un solo draw-call per scena. I layered planes sono più semplici
// ma mostrano bordi netti tra i livelli; qui vogliamo il look cinematografico.
//
// Convenzione depth map: BIANCO = vicino, NERO = lontano (come da spec/MiDaS).
// ---------------------------------------------------------------------------

export const depthVertexShader = /* glsl */ `
  uniform sampler2D uDepth;     // depth map (grayscale): r = profondità
  uniform float uDepthScale;    // ampiezza del rilievo lungo Z
  uniform vec2  uParallax;      // spostamento "camera" (pan) applicato in base alla profondità
  uniform float uProgress;      // 0..1 avanzamento scena (per micro-movimento)

  varying vec2  vUv;
  varying float vDepth;

  void main() {
    vUv = uv;

    // Campiono la profondità del vertice (canale rosso).
    float d = texture2D(uDepth, uv).r;   // 0 = lontano, 1 = vicino
    vDepth = d;

    vec3 pos = position;

    // 1) DISPLACEMENT: sposto il vertice lungo Z. Centro su 0.5 così lo "0"
    //    resta al piano medio e la scena non trasla in avanti/indietro in blocco.
    pos.z += (d - 0.5) * uDepthScale;

    // 2) PARALLASSE: i punti vicini (d alto) si spostano più di quelli lontani
    //    quando la "camera" pana → sensazione di volume reale.
    pos.xy += uParallax * (d - 0.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const depthFragmentShader = /* glsl */ `
  uniform sampler2D uColor;   // diffuse map (la foto della scena)
  uniform float uOpacity;     // per il crossfade tra scene
  uniform vec2  uParallax;    // stesso pan del vertex, per lo shift UV anti-tearing
  uniform float uGrade;       // intensità color-grading golden hour (0..1)

  varying vec2  vUv;
  varying float vDepth;

  void main() {
    // Piccolo shift UV proporzionale alla profondità: attenua il "disocclusion
    // stretching" (stiramento ai bordi degli oggetti) quando la camera si muove.
    vec2 uv = vUv + uParallax * (vDepth - 0.5) * 0.04;
    vec4 tex = texture2D(uColor, uv);

    vec3 c = tex.rgb;

    // --- Color grading "golden hour" ---
    vec3 warm = c * vec3(1.10, 1.00, 0.84);          // tinta calda
    warm = mix(warm, warm * warm * (3.0 - 2.0 * warm), 0.18); // S-curve dolce (contrasto)
    c = mix(c, warm, uGrade);

    // --- Vignettatura cinematografica ---
    vec2 q = vUv - 0.5;
    float vig = smoothstep(0.95, 0.35, length(q));
    c *= mix(0.72, 1.0, vig);

    gl_FragColor = vec4(c, tex.a * uOpacity);
  }
`;
