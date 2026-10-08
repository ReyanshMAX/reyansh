'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { BLOG_CATEGORIES, blogCategoryLabel } from '@/lib/categories';
import { formatPostDate, type PostCard } from '@/lib/posts';

// D-030: page 1 = 9 posts (latest + 2 + 6 older); ?page=N (N ≥ 2) = 12 per page after that.
const FIRST_PAGE = 9;
const PER_PAGE = 12;

// ?c=<category>&page=N live in the URL; the server renders page 1 unfiltered and the
// client applies both after hydration so the static HTML stays complete (as /projects).
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('popstate', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('popstate', cb);
  };
}
const readSearch = () => window.location.search;

function parse(search: string): { category: string | null; page: number } {
  const q = new URLSearchParams(search);
  const c = q.get('c');
  const n = Number(q.get('page'));
  return {
    category: BLOG_CATEGORIES.some(([slug]) => slug === c) ? c : null,
    page: Number.isInteger(n) && n >= 2 ? n : 1,
  };
}

function href(category: string | null, page: number): string {
  const q = new URLSearchParams();
  if (category) q.set('c', category);
  if (page >= 2) q.set('page', String(page));
  const s = q.toString();
  return s ? `/blog?${s}` : '/blog';
}

const meta = (p: PostCard) => `${formatPostDate(p.publishedAt)} · ${p.readMinutes} min`;

export function BlogIndex({ posts }: { posts: PostCard[] }) {
  const search = useSyncExternalStore(subscribe, readSearch, () => '');
  const { category, page } = parse(search);
  const shown = category ? posts.filter((p) => p.category === category) : posts;

  const go = (c: string | null, n: number) => {
    window.history.pushState(null, '', href(c, n));
    listeners.forEach((l) => l());
    window.scrollTo(0, 0);
  };
  const pill = (c: string | null, label: string) => (
    <button
      key={c ?? 'all'}
      type="button"
      onClick={() => go(c, 1)}
      aria-pressed={category === c}
      className={`flex min-h-11 items-center rounded-pill border-[2.5px] border-ink px-5 text-[17px] font-bold ${category === c ? 'bg-ink text-cream' : ''}`}
    >
      {label}
    </button>
  );
  const pageLink = (n: number, label: string) => (
    <a
      href={href(category, n)}
      onClick={(e) => {
        e.preventDefault();
        go(category, n);
      }}
      className="flex min-h-11 items-center rounded-pill border-[2.5px] border-ink px-5 text-[17px] font-bold"
    >
      {label}
    </a>
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {pill(null, 'All')}
        {BLOG_CATEGORIES.map(([slug, label]) => pill(slug, label))}
      </div>
      {shown.length === 0 ? (
        <p className="t-body">{category ? 'No posts in this category yet.' : 'No posts yet.'}</p>
      ) : page === 1 ? (
        <FirstPage posts={shown} archive={shown.length > FIRST_PAGE ? pageLink(2, 'View archive →') : null} />
      ) : (
        <Archive
          posts={shown.slice(FIRST_PAGE + (page - 2) * PER_PAGE, FIRST_PAGE + (page - 1) * PER_PAGE)}
          prev={pageLink(page - 1, '← Newer')}
          next={shown.length > FIRST_PAGE + (page - 1) * PER_PAGE ? pageLink(page + 1, 'Older →') : null}
        />
      )}
    </>
  );
}

// docs/UI.md "/blog": latest 3×2, next two 2×1, "Older posts" 1×2.
function FirstPage({ posts, archive }: { posts: PostCard[]; archive: React.ReactNode }) {
  const [latest, ...rest] = posts;
  const pair = rest.slice(0, 2);
  const older = rest.slice(2, 8);
  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-6 lg:grid-rows-[repeat(2,minmax(260px,auto))]">
      <Link href={`/blog/${latest.slug}`} className="tile-link flex flex-col gap-5 rounded-tile bg-blue p-6 text-white lg:col-span-3 lg:row-span-2 lg:p-8">
        {latest.coverUrl && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-inner lg:aspect-auto lg:min-h-0 lg:flex-1">
            <Image src={latest.coverUrl} alt={latest.coverAlt} fill priority sizes="(max-width: 1023px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
          </div>
        )}
        <div className={`flex flex-col gap-3 ${latest.coverUrl ? '' : 'mt-auto'}`}>
          <span className="t-meta">Latest · {blogCategoryLabel(latest.category)} · {meta(latest)}</span>
          <h2 className="t-title-l">{latest.title}</h2>
          {latest.excerpt && <p className="t-body">{latest.excerpt}</p>}
        </div>
      </Link>
      {pair.map((p, i) => (
        <Link
          key={p.id}
          href={`/blog/${p.slug}`}
          className={`tile-link flex flex-col justify-end gap-2 rounded-tile p-7 text-ink lg:col-span-2 ${i === 0 ? 'bg-yellow' : 'bg-green'}`}
        >
          <span className="t-meta">{blogCategoryLabel(p.category)} · {meta(p)}</span>
          <h2 className="t-title-m">{p.title}</h2>
        </Link>
      ))}
      {older.length > 0 && (
        <div className="flex flex-col gap-3 rounded-tile border-[2.5px] border-ink bg-paper p-6 text-ink lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <span className="t-meta">Older posts</span>
          <ul className="flex flex-1 flex-col divide-y-[2px] divide-ink/15">
            {older.map((p) => (
              <li key={p.id}>
                <Link href={`/blog/${p.slug}`} className="flex flex-col gap-1 py-2.5">
                  <span className="text-[18px] leading-tight font-bold">{p.title}</span>
                  <span className="t-meta">{meta(p)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {archive && <div className="self-start">{archive}</div>}
        </div>
      )}
    </div>
  );
}

// Plain list, 12 per page.
function Archive({ posts, prev, next }: { posts: PostCard[]; prev: React.ReactNode; next: React.ReactNode }) {
  return (
    <>
      {posts.length === 0 ? (
        <p className="t-body">No posts on this page.</p>
      ) : (
        <ul className="flex flex-col divide-y-[2.5px] divide-ink border-y-[2.5px] border-ink">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/blog/${p.slug}`} className="flex flex-col gap-1 py-5 lg:flex-row lg:items-baseline lg:gap-8">
                <span className="t-meta shrink-0 lg:w-[220px]">{meta(p)}</span>
                <span className="t-title-s flex-1">{p.title}</span>
                <span className="t-meta shrink-0">{blogCategoryLabel(p.category)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Pagination" className="mt-8 flex gap-3">
        {prev}
        {next}
      </nav>
    </>
  );
}
