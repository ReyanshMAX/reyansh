import type { Tile, TileType } from '@/lib/tiles';
import { getTileDef, type TileDataMap } from '@/tiles/registry';

// Looks up the tile's registered Render component. Unregistered types render nothing.
export function TileContent({ tile, data }: { tile: Tile; data: unknown }) {
  const def = getTileDef(tile.type);
  if (!def) return null;
  const Render = def.Render;
  return <Render tile={tile as Tile<TileType>} data={data as TileDataMap[TileType]} />;
}
