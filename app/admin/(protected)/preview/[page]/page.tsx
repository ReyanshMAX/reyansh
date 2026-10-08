import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TilePage } from '@/components/site/TilePage';
import { PAGE_SLUGS, type PageSlug } from '@/lib/tiles';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Draft preview — Reyansh Rastogi' };

export default async function PreviewPage({ params }: PageProps<'/admin/preview/[page]'>) {
  const { page } = await params;
  if (!PAGE_SLUGS.includes(page as PageSlug)) notFound();
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="fixed inset-x-0 top-0 z-50 flex h-11 items-center justify-between bg-ink px-4 text-cream lg:px-page">
        <span className="font-bold">Draft preview — not live</span>
        <Link href={`/admin/layout/${page}`} className="font-medium underline">Back to editor</Link>
      </div>
      <main className="px-4 pt-[60px] pb-4 lg:px-page lg:pb-page">
        <TilePage page={page as PageSlug} draft />
      </main>
    </div>
  );
}
