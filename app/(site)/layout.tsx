import { SiteNav } from '@/components/site/SiteNav';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="px-4 pb-4 lg:px-page lg:pb-page">{children}</main>
    </>
  );
}
