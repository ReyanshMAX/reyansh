'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Draft preview renders full width without dashboard chrome (docs/DASHBOARD.md "Preview").
export function ShellFrame({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin/preview/')) return <>{children}</>;
  return (
    <div className="flex min-h-screen bg-admin-bg text-ink">
      {sidebar}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
