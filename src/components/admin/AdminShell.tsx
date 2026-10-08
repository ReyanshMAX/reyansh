import type { ReactNode } from 'react';
import { signOut } from '@/server/auth';
import { SidebarNav } from './SidebarNav';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-admin-bg text-ink">
      <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col border-r-[1.5px] border-admin-line bg-admin-panel">
        <div className="flex h-[68px] items-center border-b-[1.5px] border-admin-line px-6 text-[20px] font-extrabold tracking-[-0.02em]">
          RR · Dashboard
        </div>
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-1 p-3">
          <a href="/" target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-xl px-3 font-medium">
            View live site ↗
          </a>
          <form action={signOut}>
            <button type="submit" className="flex min-h-11 w-full items-center rounded-xl px-3 font-medium text-admin-muted">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
