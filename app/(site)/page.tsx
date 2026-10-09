import type { Metadata } from 'next';
import { TilePage } from '@/components/site/TilePage';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata('Home');
// Scheduled posts reach the blog_feed tile within an hour without a publish event.
export const revalidate = 3600;

export default function HomePage() {
  return <TilePage page="home" />;
}
