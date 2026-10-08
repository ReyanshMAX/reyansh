'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

const QUERY = '(max-width: 1023px)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

// "Hide on mobile" tiles: CSS hides them instantly below 1024px; once hydrated
// they are also removed from the DOM there (docs/UI.md, D-008).
export function MobileHidden({ children }: { children: ReactNode }) {
  const isMobile = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  return isMobile ? null : children;
}
