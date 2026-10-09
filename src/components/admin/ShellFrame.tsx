'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Draft preview renders full width without dashboard chrome (docs/DASHBOARD.md "Preview").
export function ShellFrame({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin/preview/')) return <>{children}</>;
  return (
    <>
      {/* Desktop-only dashboard (docs/DASHBOARD.md "Notes"). */}
      <div className="flex min-h-screen flex-col items-start justify-center gap-5 bg-admin-bg p-6 text-ink lg:hidden">
        <p className="text-[24px] font-extrabold tracking-[-0.02em]">Open the dashboard on a computer.</p>
        <Link href="/" className="admin-btn">Go to the live site</Link>
      </div>
      <div className="hidden min-h-screen bg-admin-bg text-ink lg:flex">
        {sidebar}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
