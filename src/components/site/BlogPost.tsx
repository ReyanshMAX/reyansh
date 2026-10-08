import 'katex/dist/katex.min.css';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { blogCategoryLabel } from '@/lib/categories';
import type { TocEntry } from '@/lib/markdown';
import { formatPostDate, type PostFull } from '@/lib/posts';
import { CopyLinkButton } from './CopyLinkButton';

// Pure view shared by /blog/[slug] and the post editor's Preview modal. bodyHtml comes
// from renderMarkdownWithToc (src/lib/markdown.ts), never from user-supplied HTML.
// docs/UI.md "/blog/[slug]": rails at 300px | 860px | 340px; below 1024px they move under the article.
export function BlogPost({ post, bodyHtml, toc, footer }: {
  post: Omit<PostFull, 'id'>;
  bodyHtml: string;
  toc: TocEntry[];
  footer?: ReactNode;
}) {
  const facts: [string, ReactNode][] = [
    ['Published', post.publishedAt ? formatPostDate(post.publishedAt) : 'Not published'],
    ['Read time', `${post.readMinutes} min`],
    ['Category', blogCategoryLabel(post.category)],
  ];
  if (post.relatedProject) {
    facts.push(['Related project', (
      <Link key="related" href={`/projects/${post.relatedProject.slug}`} className="underline">{post.relatedProject.title} →</Link>
    )]);
  }

  return (
    <>
      <div className="grid gap-gutter lg:grid-cols-[300px_minmax(0,860px)_340px] lg:items-start lg:justify-between">
        <aside className="order-2 flex flex-col gap-gutter lg:order-none">
          <Link href="/blog" className="flex min-h-11 items-center self-start text-[17px] font-bold underline">← All posts</Link>
          <dl className="flex flex-col gap-4 rounded-tile border-[2.5px] border-ink bg-paper p-7">
            {facts.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <dt className="t-meta">{k}</dt>
                <dd className="text-[18px] font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <CopyLinkButton className="flex min-h-11 items-center self-start rounded-pill border-[2.5px] border-ink px-5 text-[17px] font-bold" />
        </aside>

        <article className="order-1 flex min-w-0 flex-col gap-gutter lg:order-none">
          <header className="flex flex-col gap-5">
            <h1 className="t-post-title">{post.title}</h1>
            {post.excerpt && <p className="t-body max-w-[68ch]">{post.excerpt}</p>}
          </header>
          {post.coverUrl && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-tile">
              <Image src={post.coverUrl} alt={post.coverAlt} fill priority sizes="(max-width: 1023px) 100vw, 860px" style={{ objectFit: 'cover' }} />
            </div>
          )}
          {bodyHtml && <div className="prose-site max-w-[68ch]" dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
        </article>

        <aside className="order-3 flex flex-col gap-gutter lg:sticky lg:top-6 lg:order-none">
          {toc.length > 0 && (
            <nav aria-label="On this page" className="flex flex-col gap-3 rounded-tile border-[2.5px] border-ink bg-paper p-7">
              <span className="t-meta">On this page</span>
              <ul className="flex flex-col gap-1">
                {toc.map((h) => (
                  <li key={h.id} className={h.depth === 3 ? 'pl-4' : ''}>
                    <a href={`#${h.id}`} className={`block py-1.5 leading-snug ${h.depth === 2 ? 'text-[17px] font-bold' : 'text-[16px] font-medium'}`}>{h.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {post.nextSlug && (
            <Link href={`/blog/${post.nextSlug}`} className="tile-link flex flex-col gap-3 rounded-tile bg-ink p-7 text-cream">
              <span className="t-meta">Next post →</span>
              <span className="t-title-s">{post.nextTitle}</span>
              {post.nextPublishedAt && (
                <span className="t-meta">{formatPostDate(post.nextPublishedAt)} · {post.nextReadMinutes} min</span>
              )}
            </Link>
          )}
        </aside>
      </div>
      {footer}
    </>
  );
}
