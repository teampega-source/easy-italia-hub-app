'use client';

// ---------------------------------------------------------------------------
// page.tsx — monta l'intro (client-only, no SSR per Three.js) e, alla fine,
// consegna al sito reale (NEXT_PUBLIC_SITE_URL). Se l'intro è già stata vista
// in questa sessione (sessionStorage), si salta direttamente.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const IntroExperience = dynamic(
  () => import('./components/intro/IntroExperience'),
  { ssr: false }
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.easyitaliahub.it/';

export default function Page() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('introSeen') === '1') {
        window.location.replace(SITE_URL);
        return;
      }
    } catch {}
    setShow(true);
  }, []);

  const handleComplete = () => {
    try {
      sessionStorage.setItem('introSeen', '1');
    } catch {}
    window.location.replace(SITE_URL);
  };

  if (!show) return null;
  return <IntroExperience onComplete={handleComplete} />;
}
