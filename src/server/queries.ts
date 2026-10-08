import 'server-only';
import { MEDIA_COLUMNS, toMediaItem, type MediaItem, type MediaRow } from '@/lib/media';
import {
  PROJECT_COLUMNS, publicOrder, toProjectCard, toProjectRow,
  type ProjectCard, type ProjectDbRow, type ProjectFull, type ProjectRow,
} from '@/lib/projects';
import { POST_COLUMNS, toPostCard, type PostCard, type PostDbRow, type PostFull } from '@/lib/posts';
import { tileSchema } from '@/lib/schemas';
import { EMPTY_SETTINGS, SETTINGS_COLUMNS, toSiteSettings, type SiteSettings } from '@/lib/settings';
import { createPublicClient } from '@/lib/supabase/public';
import type { PageSlug, Tile } from '@/lib/tiles';
import { TILE_REGISTRY } from '@/tiles/registry';

export type { PageSlug } from '@/lib/tiles';
export type { SiteSettings } from '@/lib/settings';
export type { ProjectCard, ProjectFull } from '@/lib/projects';
export type { PostCard, PostFull } from '@/lib/posts';

// Keeps only tiles that parse and whose type is registered, so a bad row can
// never take the public page down.
export function sanitizeTiles(raw: unknown): Tile[] {
  if (!Array.isArray(raw)) return [];
  const tiles: Tile[] = [];
  for (const item of raw) {
    const parsed = tileSchema.safeParse(item);
    if (parsed.success && TILE_REGISTRY[parsed.data.type]) tiles.push(parsed.data as Tile);
  }
  return tiles;
}

// Public pages must build and render with an empty or unreachable database:
// every query degrades to an empty result instead of throwing.
export async function getPublishedLayout(page: PageSlug): Promise<Tile[]> {
  try {
    const { data, error } = await createPublicClient()
      .from('layouts')
      .select('tiles')
      .eq('page_slug', page)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    return sanitizeTiles(data?.tiles);
  } catch (e) {
    console.error(`getPublishedLayout(${page}) failed`, e);
    return [];
  }
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await createPublicClient()
      .from('site_settings')
      .select(SETTINGS_COLUMNS)
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    return data ? toSiteSettings(data) : EMPTY_SETTINGS;
  } catch (e) {
    console.error('getSettings failed', e);
    return EMPTY_SETTINGS;
  }
}

// Media is public-readable; used by the dashboard (picker, media page).
export async function listMedia(): Promise<MediaItem[]> {
  try {
    const { data, error } = await createPublicClient()
      .from('media')
      .select(MEDIA_COLUMNS)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as MediaRow[]).map(toMediaItem);
  } catch (e) {
    console.error('listMedia failed', e);
    return [];
  }
}

async function readPublishedProjects(): Promise<ProjectRow[]> {
  const { data, error } = await createPublicClient()
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as unknown as ProjectDbRow[]).map(toProjectRow);
}

// featured desc, sort_order asc (docs/ARCHITECTURE.md)
export async function listPublishedProjects(): Promise<ProjectCard[]> {
  try {
    return (await readPublishedProjects()).sort(publicOrder).map(toProjectCard);
  } catch (e) {
    console.error('listPublishedProjects failed', e);
    return [];
  }
}

export async function getPublishedProject(slug: string): Promise<ProjectFull | null> {
  try {
    const rows = await readPublishedProjects(); // sort_order asc
    const i = rows.findIndex((r) => r.slug === slug);
    if (i < 0) return null;
    const next = rows.length > 1 ? rows[(i + 1) % rows.length] : null; // wraps around
    const r = rows[i];
    return {
      ...toProjectCard(r),
      role: r.role, stack: r.stack, status: r.status, githubUrl: r.githubUrl, demoUrl: r.demoUrl,
      videoUrl: r.videoUrl, bodyMd: r.bodyMd, nextSlug: next?.slug ?? null, nextTitle: next?.title ?? null,
    };
  } catch (e) {
    console.error(`getPublishedProject(${slug}) failed`, e);
    return null;
  }
}

// Live = published_at <= now. RLS enforces this for the anon client too, but the
// filter is explicit so a misconfigured policy can never leak a draft or scheduled post.
function livePosts() {
  return createPublicClient()
    .from('posts')
    .select(POST_COLUMNS)
    .lte('published_at', new Date().toISOString());
}

// published_at desc. feedOnly limits to show_in_feed posts (blog_feed tile).
export async function listLivePosts(opts: { limit: number; offset: number; category?: string; feedOnly?: boolean }): Promise<PostCard[]> {
  try {
    let q = livePosts();
    if (opts.category) q = q.eq('category', opts.category);
    if (opts.feedOnly) q = q.eq('show_in_feed', true);
    const { data, error } = await q
      .order('published_at', { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1);
    if (error) throw error;
    return (data as unknown as PostDbRow[]).map(toPostCard);
  } catch (e) {
    console.error('listLivePosts failed', e);
    return [];
  }
}

export async function getLivePost(slug: string): Promise<PostFull | null> {
  try {
    const { data, error } = await livePosts().eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as unknown as PostDbRow;
    // Next = next older live post.
    const { data: next, error: nextError } = await livePosts()
      .lt('published_at', row.published_at as string)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (nextError) throw nextError;
    const nextCard = next ? toPostCard(next as unknown as PostDbRow) : null;
    return {
      ...toPostCard(row),
      bodyMd: row.body_md,
      relatedProject: row.related?.published ? { slug: row.related.slug, title: row.related.title } : null,
      nextSlug: nextCard?.slug ?? null,
      nextTitle: nextCard?.title ?? null,
      nextPublishedAt: nextCard?.publishedAt ?? null,
      nextReadMinutes: nextCard?.readMinutes ?? null,
    };
  } catch (e) {
    console.error(`getLivePost(${slug}) failed`, e);
    return null;
  }
}
