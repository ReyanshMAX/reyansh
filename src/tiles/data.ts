import type { MediaItem } from '@/lib/media';
import type { SiteSettings } from '@/lib/settings';
import type { Tile, TileType } from '@/lib/tiles';
import type { TileDataMap } from './types';

export interface TileDataContext {
  settings: SiteSettings;
  media: ReadonlyMap<string, MediaItem>;
}

// Pure: maps a tile to its render data from already-fetched rows. Shared by the
// server resolver and the editor canvas so both render identically.
export function tileData<K extends TileType>(tile: Tile<K>, ctx: TileDataContext): TileDataMap[K] {
  const t = tile as Tile;
  switch (t.type) {
    case 'now':
      return { text: ctx.settings.nowText } as TileDataMap[K];
    case 'links':
      return {
        email: ctx.settings.email,
        githubUrl: ctx.settings.githubUrl,
        linkedinUrl: ctx.settings.linkedinUrl,
      } as TileDataMap[K];
    case 'media': {
      const item = ctx.media.get((t as Tile<'media'>).config.mediaId);
      return (item && item.kind === 'image' ? item : null) as TileDataMap[K];
    }
    default:
      return null as TileDataMap[K];
  }
}

export function mediaIdsOf(tiles: Tile[]): string[] {
  return [...new Set(tiles.filter((t) => t.type === 'media').map((t) => (t as Tile<'media'>).config.mediaId))];
}
