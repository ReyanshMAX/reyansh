'use client';

import { useEffect, type ReactNode } from 'react';

export interface ToastMessage {
  id: number;
  tone: 'info' | 'error';
  body: ReactNode;
}

let lastToastId = 0;
export function nextToastId(): number {
  lastToastId += 1;
  return lastToastId;
}

// Bottom-right, 4s, one at a time (docs/DASHBOARD.md).
export function Toast({ toast, onDone }: { toast: ToastMessage | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [toast, onDone]);
  if (!toast) return null;
  return (
    <div
      role="status"
      className={`fixed right-6 bottom-6 z-50 max-w-md rounded-2xl px-5 py-4 text-[15px] font-medium shadow-lg ${
        toast.tone === 'error' ? 'bg-orange text-ink' : 'bg-ink text-cream'
      }`}
    >
      {toast.body}
    </div>
  );
}
