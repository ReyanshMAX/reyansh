import Link from 'next/link';
import { formatPostDate } from '@/lib/posts';
import type { TileRenderProps } from '../types';

// Latest `count` live posts with show_in_feed (docs/TILES.md). Wider tile = larger titles.
export function BlogFeedRender({ tile, data }: TileRenderProps<'blog_feed'>) {
  const posts = data.slice(0, tile.config.count);
  return (
    <div className="flex h-full flex-col gap-4 px-8 py-7">
      <div className="flex items-baseline justify-between gap-4">
        <span className="t-meta">From the blog</span>
        <Link href="/blog" className="flex min-h-11 items-center text-[16px] font-bold underline">All posts →</Link>
      </div>
      {posts.length === 0 ? (
        <p className="t-body mt-auto">No posts yet.</p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-end divide-y-[2px] divide-current/20">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/blog/${p.slug}`} className="flex flex-col gap-1 py-3">
                <span className={`${tile.pos.w >= 2 ? 'text-[24px]' : 'text-[20px]'} leading-tight font-bold tracking-[-0.01em]`}>{p.title}</span>
                <span className="t-meta">{formatPostDate(p.publishedAt)} · {p.readMinutes} min</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
