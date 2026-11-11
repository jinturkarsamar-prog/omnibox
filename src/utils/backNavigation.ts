import { useEffect, useRef, type FC } from 'react';

interface BackEntry {
  id: number;
  depth: number;
  onBack: () => void;
}

let nextId = 1;
let initialized = false;
let currentDepth = 0;
let syncScheduled = false;
const backStack: BackEntry[] = [];

function getBrowserDepth(): number {
  if (typeof window === 'undefined') return 0;
  const d = window.history.state?.omniboxDepth;
  return typeof d === 'number' ? d : 0;
}

function getTargetDepth(): number {
  return backStack.length > 0 ? backStack[backStack.length - 1].depth : 0;
}

function scheduleHistorySync() {
  if (typeof window === 'undefined' || syncScheduled) return;
  syncScheduled = true;

  queueMicrotask(() => {
    syncScheduled = false;
    const browserDepth = getBrowserDepth();
    const targetDepth = getTargetDepth();
    currentDepth = targetDepth;

    if (browserDepth > targetDepth) {
      window.history.go(targetDepth - browserDepth);
    }
  });
}

function handlePopState(event: PopStateEvent) {
  const newDepth = typeof event.state?.omniboxDepth === 'number' ? event.state.omniboxDepth : 0;
  currentDepth = newDepth;

  // Pop any active layers whose depth exceeds the new browser history depth
  const toClose: BackEntry[] = [];
  while (backStack.length > 0 && backStack[backStack.length - 1].depth > newDepth) {
    const popped = backStack.pop();
    if (popped) {
      toClose.push(popped);
    }
  }

  for (const entry of toClose) {
    entry.onBack();
  }
}

function ensureInitialized() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Normalize entry depth on boot so reloaded tabs start cleanly at root depth 0
  const existingState =
    window.history.state && typeof window.history.state === 'object'
      ? window.history.state
      : {};
  window.history.replaceState({ ...existingState, omniboxDepth: 0 }, '');
  currentDepth = 0;

  window.addEventListener('popstate', handlePopState);
}

/**
 * Registers a layered back-navigation handler backed by browser history so Android
 * hardware/gesture back closes the topmost UI layer instead of exiting the PWA.
 */
export function useBackHandler(isActive: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return;

    ensureInitialized();

    const id = nextId++;
    const baseDepth = Math.max(currentDepth, getBrowserDepth());
    const depth = baseDepth + 1;
    currentDepth = depth;

    const entry: BackEntry = {
      id,
      depth,
      onBack: () => onBackRef.current(),
    };
    backStack.push(entry);

    const existingState =
      window.history.state && typeof window.history.state === 'object'
        ? window.history.state
        : {};
    window.history.pushState({ ...existingState, omniboxDepth: depth }, '');

    return () => {
      const idx = backStack.findIndex((item) => item.id === id);
      if (idx !== -1) {
        // Closed via UI action (button, backdrop, swipe) rather than popstate
        backStack.splice(idx, 1);
        scheduleHistorySync();
      }
    };
  }, [isActive]);
}

export const BackStackLayer: FC<{ onBack: () => void }> = ({ onBack }) => {
  useBackHandler(true, onBack);
  return null;
};
