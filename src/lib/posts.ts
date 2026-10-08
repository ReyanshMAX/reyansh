import { mediaUrl } from './media';

export interface PostCard {
  id: string; slug: string; title: string; excerpt: string; category: string;
  publishedAt: string; readMinutes: number; coverUrl: string | null; coverAlt: string;
}

export interface PostFull extends PostCard {
  bodyMd: string;
  relatedProject: { slug: string; title: string } | null;
  nextSlug: string | null;       // next older live post
  nextTitle: string | null;
  nextPublishedAt: string | null;
  nextReadMinutes: number | null;
}

export type PostState = 'draft' | 'scheduled' | 'published';

// Dashboard row.
export interface PostRow {
  id: string; slug: string; title: string; excerpt: string; category: string;
  relatedProjectId: string | null; coverMediaId: string | null; coverUrl: string | null; coverAlt: string;
  bodyMd: string; showInFeed: boolean; publishedAt: string | null; updatedAt: string; createdAt: string;
}

export const POST_COLUMNS =
  'id, slug, title, excerpt, category, related_project_id, cover_media_id, body_md, show_in_feed, published_at, updated_at, created_at, cover:media(path, alt), related:projects(slug, title, published)';

export interface PostDbRow {
  id: string; slug: string; title: string; excerpt: string; category: string;
  related_project_id: string | null; cover_media_id: string | null; body_md: string; show_in_feed: boolean;
  published_at: string | null; updated_at: string; created_at: string;
  cover: { path: string; alt: string } | null;
  related: { slug: string; title: string; published: boolean } | null;
}

export function wordCount(md: string): number {
  return md.split(/\s+/).filter(Boolean).length;
}

// max(1, round(words / 220)) — shown on the site and in the editor footer.
export function readMinutesOf(md: string): number {
  return Math.max(1, Math.round(wordCount(md) / 220));
}

export function toPostRow(r: PostDbRow): PostRow {
  return {
    id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category,
    relatedProjectId: r.related_project_id, coverMediaId: r.cover_media_id,
    coverUrl: r.cover ? mediaUrl(r.cover.path) : null, coverAlt: r.cover?.alt ?? '',
    bodyMd: r.body_md, showInFeed: r.show_in_feed, publishedAt: r.published_at, updatedAt: r.updated_at, createdAt: r.created_at,
  };
}

export function toPostCard(r: PostDbRow): PostCard {
  return {
    id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category,
    publishedAt: r.published_at ?? '', readMinutes: readMinutesOf(r.body_md),
    coverUrl: r.cover ? mediaUrl(r.cover.path) : null, coverAlt: r.cover?.alt ?? '',
  };
}

export function postState(publishedAt: string | null, now = Date.now()): PostState {
  if (!publishedAt) return 'draft';
  return new Date(publishedAt).getTime() > now ? 'scheduled' : 'published';
}

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
