import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostForm } from '@/components/admin/PostForm';
import { listAllPosts } from '@/server/posts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Blog post — Reyansh Rastogi' };

export default async function PostEditorPage({ params }: PageProps<'/admin/posts/[id]'>) {
  const { id } = await params;
  const result = await listAllPosts();
  const posts = result.ok ? result.data : [];
  if (id === 'new') return <PostForm key="new" post={null} posts={posts} />;
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();
  return <PostForm key={id} post={post} posts={posts} />;
}
