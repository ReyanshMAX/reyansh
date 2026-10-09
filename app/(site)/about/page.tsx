import type { Metadata } from 'next';
import { TilePage } from '@/components/site/TilePage';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata('About');
// Scheduled posts reach a blog_feed tile within an hour without a publish event.
export const revalidate = 3600;

export default function AboutPage() {
  return <TilePage page="about" />;
}
