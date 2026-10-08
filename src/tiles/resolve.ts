import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MEDIA_COLUMNS, toMediaItem, type MediaItem, type MediaRow } from '@/lib/media';
import { EMPTY_SETTINGS, SETTINGS_COLUMNS, toSiteSettings, type SiteSettings } from '@/lib/settings';
import { createPublicClient } from '@/lib/supabase/public';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Tile } from '@/lib/tiles';
import { mediaIdsOf, tileData } from './data';

// All DB reads for a tile page happen here, once, before render (docs/TILES.md).
// Batched: one site_settings read, one media query. Failures degrade to empty data
// so a public page never breaks on a slow or paused database.
export async function resolveTileData(
  tiles: Tile[],
  opts: { includeUnpublished: boolean },
): Promise<Record<string, unknown>> {
  const needsSettings = tiles.some((t) => t.type === 'now' || t.type === 'links');
  const mediaIds = mediaIdsOf(tiles);
  let supabase: SupabaseClient | null = null;
  if (needsSettings || mediaIds.length) {
    try {
      supabase = opts.includeUnpublished ? await createServerSupabase() : createPublicClient();
    } catch (e) {
      console.error('resolveTileData: no database client', e);
    }
  }

  const [settings, media] = await Promise.all([
    supabase && needsSettings ? readSettings(supabase) : Promise.resolve(EMPTY_SETTINGS),
    supabase && mediaIds.length ? readMedia(supabase, mediaIds) : Promise.resolve(new Map<string, MediaItem>()),
  ]);

  const data: Record<string, unknown> = {};
  for (const tile of tiles) data[tile.id] = tileData(tile, { settings, media });
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
