'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center rounded-pill px-5 text-[17px] font-bold ${active ? 'bg-ink text-cream' : ''}`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
