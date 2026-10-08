import type { Metadata } from 'next';
import { TilePage } from '@/components/site/TilePage';

export const metadata: Metadata = { title: 'Home — Reyansh Rastogi' };
// Scheduled posts reach the blog_feed tile within an hour without a publish event.
export const revalidate = 3600;

export default function HomePage() {
  return <TilePage page="home" />;
}
