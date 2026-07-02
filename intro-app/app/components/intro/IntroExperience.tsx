'use client';

// ---------------------------------------------------------------------------
// IntroExperience.tsx — orchestratore intro cinematografica.
// - <Canvas> con 3 ParallaxScene sempre montate (crossfade via uOpacity).
// - <Clock> interno al Canvas incrementa elapsedRef e innesca flash/onComplete.
// - Skip button, sessionStorage 'introSeen', prefers-reduced-motion, mobile.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import ParallaxScene from './ParallaxScene';
import FlashTransition from './FlashTransition';
import { buildTimeline } from './useSceneTimeline';

interface Props {
  onComplete: () => void;
}

// Componente interno al Canvas: fa avanzare il clock e notifica flash/fine.
function Clock({
  elapsedRef,
  total,
  flashAt,
  onFlash,
  onDone,
}: {
  elapsedRef: React.MutableRefObject<number>;
  total: number;
  flashAt: number;
  onFlash: () => void;
  onDone: () => void;
}) {
  const flashed = useRef(false);
  const done = useRef(false);
  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (!flashed.current && elapsedRef.current >= flashAt) {
      flashed.current = true;
      onFlash();
    }
    if (!done.current && elapsedRef.current >= total) {
      done.current = true;
      onDone();
    }
  });
  return null;
}

export default function IntroExperience({ onComplete }: Props) {
  const elapsedRef = useRef(0);
  const [flash, setFlash] = useState(false);
  const [ended, setEnded] = useState(false);

  // Velocità: mobile/coarse -30% durata.
  const speed = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    return coarse ? 0.7 : 1;
  }, []);

  const timeline = useMemo(() => buildTimeline(speed), [speed]);

  const finish = () => {
    if (ended) return;
    setEnded(true);
    onComplete();
  };

  // prefers-reduced-motion → salta l'intro.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      finish();
      return;
    }
    // Failsafe: se qualcosa si blocca, chiudi comunque poco dopo la durata.
    const t = setTimeout(finish, (timeline.total + 2) * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Il flash copre l'handoff: quando parte, chiudi a metà bianco.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(finish, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 10 }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.6], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor('#000000')}
      >
        <Clock
          elapsedRef={elapsedRef}
          total={timeline.total}
          flashAt={timeline.flashAt}
          onFlash={() => setFlash(true)}
          onDone={finish}
        />
        {timeline.scenes.map((s) => (
          <ParallaxScene
            key={s.index}
            index={s.index}
            timeline={timeline}
            elapsedRef={elapsedRef}
          />
        ))}
      </Canvas>

      <FlashTransition active={flash} />

      <button
        onClick={finish}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 30,
          padding: '10px 18px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.35)',
          background: 'rgba(0,0,0,0.35)',
          color: '#fff',
          font: '500 14px/1 system-ui, sans-serif',
          letterSpacing: '0.02em',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
        }}
      >
        Salta intro →
      </button>
    </div>
  );
}
