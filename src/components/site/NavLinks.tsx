'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function Links({ onNavigate, large = false }: { onNavigate?: () => void; large?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_LINKS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center rounded-pill px-5 font-bold ${large ? 'text-[28px]' : 'text-[17px]'} ${active ? 'bg-ink text-cream' : ''}`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}

function ContactLink({ email, large = false }: { email: string; large?: boolean }) {
  return (
    <a
      href={email ? `mailto:${email}` : undefined}
      className={`flex min-h-11 items-center rounded-pill border-[2.5px] border-ink px-5 font-bold ${large ? 'text-[28px]' : 'text-[17px]'}`}
    >
      Contact
    </a>
  );
}

export function DesktopNav({ email }: { email: string }) {
  return (
    <nav aria-label="Main" className="hidden items-center gap-2 lg:flex">
      <Links />
      <ContactLink email={email} />
    </nav>
  );
}

// < 1024px: wordmark + "Menu" button opening a full-width sheet (docs/UI.md).
export function MobileNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center rounded-pill border-[2.5px] border-ink px-5 text-[17px] font-bold"
      >
        Menu
      </button>
      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-cream px-4">
          <div className="flex h-[88px] items-center justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-pill bg-ink px-5 text-[17px] font-bold text-cream"
            >
              Close
            </button>
          </div>
          <nav aria-label="Main" className="flex flex-col items-start gap-3">
            <Links large onNavigate={() => setOpen(false)} />
            <ContactLink email={email} large />
          </nav>
        </div>
      )}
    </div>
  );
}
