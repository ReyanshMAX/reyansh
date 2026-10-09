import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/SiteNav';

export const metadata: Metadata = { title: 'Not found — Reyansh Rastogi' };

// docs/UI.md "404": cream page, black tile "Nothing here." + link Home.
export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="px-4 pb-4 lg:px-page lg:pb-page">
        <div className="flex min-h-[420px] flex-col justify-between gap-8 rounded-tile bg-ink p-8 text-cream lg:min-h-[560px] lg:p-12">
          <span className="t-meta">404</span>
          <h1 className="t-page-title">Nothing here.</h1>
          <Link href="/" className="flex min-h-11 items-center self-start rounded-pill bg-cream px-6 text-[17px] font-bold text-ink">← Home</Link>
        </div>
      </main>
    </>
  );
}
