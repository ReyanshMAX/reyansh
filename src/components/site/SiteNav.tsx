import Link from 'next/link';
import { getSettings } from '@/server/queries';
import { DesktopNav, MobileNav } from './NavLinks';

export async function SiteNav() {
  const { email } = await getSettings();
  return (
    <header className="flex h-[88px] items-center justify-between px-4 lg:px-page">
      <Link href="/" className="font-display text-[22px] font-extrabold tracking-[-0.02em]">
        RR
      </Link>
      <DesktopNav email={email} />
      <MobileNav email={email} />
    </header>
  );
}
