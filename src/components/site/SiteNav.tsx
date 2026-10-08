import Link from 'next/link';
import { getSettings } from '@/server/queries';
import { NavLinks } from './NavLinks';

export async function SiteNav() {
  const { email } = await getSettings();
  return (
    <header className="flex h-[88px] items-center justify-between px-page">
      <Link href="/" className="font-display text-[22px] font-extrabold tracking-[-0.02em]">
        RR
      </Link>
      <nav className="flex items-center gap-2">
        <NavLinks />
        <a
          href={email ? `mailto:${email}` : undefined}
          className="flex min-h-11 items-center rounded-pill border-[2.5px] border-ink px-5 text-[17px] font-bold"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}
