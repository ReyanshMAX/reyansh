import type { Metadata } from 'next';
import { TilePage } from '@/components/site/TilePage';

export const metadata: Metadata = { title: 'Home — Reyansh Rastogi' };

export default function HomePage() {
  return <TilePage page="home" />;
}
