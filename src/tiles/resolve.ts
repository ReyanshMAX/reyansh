import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MEDIA_COLUMNS, toMediaItem, type MediaItem, type MediaRow } from '@/lib/media';
import { EMPTY_SETTINGS, SETTINGS_COLUMNS, toSiteSettings, type SiteSettings } from '@/lib/settings';
import { createPublicClient } from '@/lib/supabase/public';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Tile } from '@/lib/tiles';
import { PROJECT_COLUMNS, toProjectCard, toProjectRow, type ProjectCard, type ProjectDbRow } from '@/lib/projects';
import { listLivePosts } from '@/server/queries';
import { feedCountOf, mediaIdsOf, projectIdsOf, tileData } from './data';

// All DB reads for a tile page happen here, once, before render (docs/TILES.md).
// Batched: one site_settings read, one media query, one projects query, one posts query. Failures degrade to empty data
// so a public page never breaks on a slow or paused database.
export async function resolveTileData(
  tiles: Tile[],
  opts: { includeUnpublished: boolean },
): Promise<Record<string, unknown>> {
  const needsSettings = tiles.some((t) => t.type === 'now' || t.type === 'links' || t.type === 'resume');
  const mediaIds = mediaIdsOf(tiles);
  const projectIds = projectIdsOf(tiles);
  let supabase: SupabaseClient | null = null;
  if (needsSettings || mediaIds.length || projectIds.length) {
    try {
      supabase = opts.includeUnpublished ? await createServerSupabase() : createPublicClient();
    } catch (e) {
      console.error('resolveTileData: no database client', e);
    }
  }

  type Projects = Map<string, ProjectCard & { draft: boolean }>;
  const feedCount = feedCountOf(tiles);
  const [settings, media, projects, feedPosts] = await Promise.all([
    supabase && needsSettings ? readSettings(supabase) : Promise.resolve(EMPTY_SETTINGS),
    supabase && mediaIds.length ? readMedia(supabase, mediaIds) : Promise.resolve(new Map<string, MediaItem>()),
    supabase && projectIds.length ? readProjects(supabase, projectIds) : Promise.resolve<Projects>(new Map()),
    // Live posts only, in preview too: the feed never shows drafts or scheduled posts.
    feedCount ? listLivePosts({ limit: feedCount, offset: 0, feedOnly: true }) : Promise.resolve([]),
  ]);

  const data: Record<string, unknown> = {};
  for (const tile of tiles) data[tile.id] = tileData(tile, { settings, media, projects, feedPosts });
  return data;
}

async function readSettings(supabase: SupabaseClient): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase.from('site_settings').select(SETTINGS_COLUMNS).eq('id', 1).maybeSingle();
    if (error) throw error;
    return data ? toSiteSettings(data) : EMPTY_SETTINGS;
  } catch (e) {
    console.error('resolveTileData: settings read failed', e);
    return EMPTY_SETTINGS;
  }
}

async function readMedia(supabase: SupabaseClient, ids: string[]): Promise<Map<string, MediaItem>> {
  try {
    const { data, error } = await supabase.from('media').select(MEDIA_COLUMNS).in('id', ids);
    if (error) throw error;
    return new Map((data as MediaRow[]).map((r) => [r.id, toMediaItem(r)]));
  } catch (e) {
    console.error('resolveTileData: media read failed', e);
    return new Map();
  }
}

// Public (anon) reads only see published rows through RLS; the preview's cookie
// client also sees drafts, which are flagged so the tile can show a badge.
async function readProjects(supabase: SupabaseClient, ids: string[]): Promise<Map<string, ProjectCard & { draft: boolean }>> {
  try {
    const { data, error } = await supabase.from('projects').select(PROJECT_COLUMNS).in('id', ids);
    if (error) throw error;
    return new Map((data as unknown as ProjectDbRow[]).map((r) => {
      const row = toProjectRow(r);
      return [row.id, { ...toProjectCard(row), draft: !row.published }];
    }));
  } catch (e) {
    console.error('resolveTileData: projects read failed', e);
    return new Map();
  }
}
