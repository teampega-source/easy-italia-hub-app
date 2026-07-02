'use client';

// ---------------------------------------------------------------------------
// FlashTransition.tsx — overlay bianco che lampeggia a fine scena 3 e copre il
// passaggio al sito (ease-in-expo → white flash → reveal).
// ---------------------------------------------------------------------------

interface Props {
  active: boolean; // true quando parte il flash
}

export default function FlashTransition({ active }: Props) {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        background: '#fff',
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: active
          ? 'opacity 0.5s cubic-bezier(0.7,0,0.84,0)'
          : 'opacity 0.6s ease-out',
        zIndex: 20,
      }}
    />
  );
}
