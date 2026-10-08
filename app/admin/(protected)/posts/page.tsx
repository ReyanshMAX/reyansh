import { redirect } from 'next/navigation';
import { listAllPosts } from '@/server/posts';

export const dynamic = 'force-dynamic';

// Opens the most recently edited post, or a new one when there are none.
export default async function PostsPage() {
  const result = await listAllPosts();
  const newest = result.ok ? result.data[0] : undefined;
  redirect(newest ? `/admin/posts/${newest.id}` : '/admin/posts/new');
}
