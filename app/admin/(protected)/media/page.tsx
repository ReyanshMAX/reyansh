import type { Metadata } from 'next';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import { PageHeader } from '@/components/admin/PageHeader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Media — Reyansh Rastogi' };

export default function MediaPage() {
  return (
    <>
      <PageHeader title="Media" />
      <MediaLibrary />
    </>
  );
}
