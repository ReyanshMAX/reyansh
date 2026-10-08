import type { Metadata } from 'next';
import { BlogIndex } from '@/components/site/BlogIndex';
import { Footer } from '@/components/site/Footer';
import { listLivePosts } from '@/server/queries';

export const metadata: Metadata = { title: 'Blog — Reyansh Rastogi' };
// Scheduled posts go live within an hour without a publish event.
export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await listLivePosts({ limit: 1000, offset: 0 });
  return (
    <>
      <h1 className="t-page-title mb-8">Blog</h1>
      <BlogIndex posts={posts} />
      <Footer />
    </>
  );
}
