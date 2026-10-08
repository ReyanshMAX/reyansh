import type { ReactNode } from 'react';

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b-[1.5px] border-admin-line bg-admin-panel px-6">
      <div className="text-[15px]">
        <span className="text-admin-muted">Dashboard</span>
        <span className="mx-2 text-admin-muted">/</span>
        <span className="font-bold">{title}</span>
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </header>
  );
}
