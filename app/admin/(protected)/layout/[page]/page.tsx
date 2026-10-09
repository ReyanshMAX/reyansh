import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LayoutEditor } from '@/components/admin/LayoutEditor';
import type { PageSlug } from '@/lib/tiles';
import { getDraftLayout } from '@/server/layouts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Layout — Reyansh Rastogi' };

const EDITABLE: readonly PageSlug[] = ['home', 'about'];

export default async function LayoutEditorPage({ params }: PageProps<'/admin/layout/[page]'>) {
  const { page } = await params;
  if (!EDITABLE.includes(page as PageSlug)) notFound();
  const result = await getDraftLayout(page as PageSlug);
  if (!result.ok) throw new Error(`Couldn't load the ${page} draft (${result.error})`);
  return (
    <LayoutEditor
      key={page}
      page={page as PageSlug}
      initialTiles={result.data.tiles}
      initialSavedAt={result.data.updatedAt}
    />
  );
}
