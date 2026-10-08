'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin/layout/home', match: '/admin/layout', label: 'Layout' },
  { href: '/admin/projects', match: '/admin/projects', label: 'Projects' },
  { href: '/admin/posts', match: '/admin/posts', label: 'Blog posts' },
  { href: '/admin/media', match: '/admin/media', label: 'Media' },
  { href: '/admin/settings', match: '/admin/settings', label: 'Settings' },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {ITEMS.map(({ href, match, label }) => {
        const active = pathname.startsWith(match);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center rounded-xl px-3 font-medium ${active ? 'bg-ink text-cream' : ''}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
