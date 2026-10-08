import { SiteNav } from '@/components/site/SiteNav';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="px-page pb-page">{children}</main>
    </>
  );
}
