/// <reference types="vite-plugin-pwa/client" />
import { StrictMode, Suspense, lazy, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const LazyApp = lazy(() => import('./App.tsx'));
const LazyQuickShareEntry = lazy(() =>
  import('./components/QuickShareEntry.tsx').then((m) => ({ default: m.QuickShareEntry }))
);

function hasShareQueryParams(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return !!(
    params.get('share_url') ||
    params.get('url') ||
    params.get('share_text') ||
    params.get('text')
  );
}

function RootRouter() {
  const [quickShareActive, setQuickShareActive] = useState<boolean>(hasShareQueryParams);

  if (quickShareActive) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
        <LazyQuickShareEntry onOpenFullApp={() => setQuickShareActive(false)} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <LazyApp />
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
