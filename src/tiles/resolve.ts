import 'server-only';
import type { Tile } from '@/lib/tiles';

// All DB reads for a tile page happen here, once, before render. Phase 1 only
// registers `text`, which needs no data; later phases batch projects, media,
// settings and posts here (docs/TILES.md "Data resolution").
export async function resolveTileData(
  tiles: Tile[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  opts: { includeUnpublished: boolean },
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};
  for (const tile of tiles) data[tile.id] = null;
  return data;
}
