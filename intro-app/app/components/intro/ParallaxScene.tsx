'use client';

// ---------------------------------------------------------------------------
// ParallaxScene.tsx — una scena = una PlaneGeometry 256x256 + ShaderMaterial.
// Carica la foto reale e la depth map da /public/parallax/; se mancano usa i
// placeholder procedurali. useFrame legge il clock condiviso (elapsedRef) e
// applica trasformazione "camera" (zoom/rise/pan) + opacity dal timeline.
// ---------------------------------------------------------------------------

import { useMemo, useRef, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { depthVertexShader, depthFragmentShader } from './depthShader';
import { makeColorPlaceholder, makeDepthPlaceholder } from './placeholderTextures';
import {
  Timeline,
  sceneOpacity,
  sceneProgress,
} from './useSceneTimeline';

const ASSET_NAMES = [
  { color: 'scene1_srilanka.jpg', depth: 'scene1_srilanka_depth.png' },
  { color: 'scene2_clouds_italy.jpg', depth: 'scene2_clouds_italy_depth.png' },
  { color: 'scene3_italy_descent.jpg', depth: 'scene3_italy_descent_depth.png' },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Carica una texture da URL; se fallisce (404) applica il fallback canvas.
function loadTexture(url: string, fallback: () => HTMLCanvasElement): THREE.Texture {
  const tex = new THREE.TextureLoader().load(
    url,
    undefined,
    undefined,
    () => {
      const cv = fallback();
      tex.image = cv;
      tex.needsUpdate = true;
    }
  );
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

interface Props {
  index: number;
  timeline: Timeline;
  elapsedRef: MutableRefObject<number>;
}

export default function ParallaxScene({ index, timeline, elapsedRef }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cfg = timeline.scenes[index];

  const { colorTex, depthTex } = useMemo(() => {
    const base = '/parallax/';
    const names = ASSET_NAMES[index];
    return {
      colorTex: loadTexture(base + names.color, () => makeColorPlaceholder(index)),
      depthTex: loadTexture(base + names.depth, () => makeDepthPlaceholder(index)),
    };
  }, [index]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: colorTex },
      uDepth: { value: depthTex },
      uDepthScale: { value: cfg.depthScale },
      uParallax: { value: new THREE.Vector2(cfg.panFrom[0], cfg.panFrom[1]) },
      uProgress: { value: 0 },
      uOpacity: { value: index === 0 ? 1 : 0 },
      uGrade: { value: 0.85 },
    }),
    [colorTex, depthTex, cfg, index]
  );

  // Piano 16:9 in NDC-ish; la camera è ortho-like via fov stretto → look "flat cinematic".
  const geometry = useMemo(() => new THREE.PlaneGeometry(3.556, 2, 256, 256), []);

  useFrame(() => {
    const el = elapsedRef.current;
    const op = sceneOpacity(timeline, index, el);
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    mesh.visible = op > 0.001;
    if (!mesh.visible) return;

    const p = sceneProgress(timeline, index, el);
    const e = cfg.easing(p);

    const zoom = lerp(cfg.zoomFrom, cfg.zoomTo, e);
    mesh.scale.setScalar(zoom);
    mesh.position.y = lerp(cfg.riseFrom, cfg.riseTo, e);

    const px = lerp(cfg.panFrom[0], cfg.panTo[0], e);
    const py = lerp(cfg.panFrom[1], cfg.panTo[1], e);
    (mat.uniforms.uParallax.value as THREE.Vector2).set(px, py);
    mat.uniforms.uProgress.value = p;
    mat.uniforms.uOpacity.value = op;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={index}>
      <shaderMaterial
        ref={matRef}
        vertexShader={depthVertexShader}
        fragmentShader={depthFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
