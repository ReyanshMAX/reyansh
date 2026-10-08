import type { JSX } from 'react';
import type { PageSlug, Tile } from '@/lib/tiles';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPublishedLayout, sanitizeTiles } from '@/server/queries';
import { resolveTileData } from '@/tiles/resolve';
import { TileContent } from './TileContent';
import { TileShell } from './TileShell';

async function getDraftTiles(page: PageSlug): Promise<Tile[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from('layouts').select('tiles').eq('page_slug', page).eq('status', 'draft').maybeSingle();
  return sanitizeTiles(data?.tiles);
}

// `draft` is only used under /admin/(protected)/preview (cookie client + RLS).
export async function TilePage({ page, draft = false }: { page: PageSlug; draft?: boolean }): Promise<JSX.Element> {
  const tiles = draft ? await getDraftTiles(page) : await getPublishedLayout(page);
  const data = await resolveTileData(tiles, { includeUnpublished: draft });
  return (
    <div className="tile-grid">
      {tiles.map((tile) => (
        <TileShell
          key={tile.id}
          tile={tile}
          style={{
            gridColumn: `${tile.pos.x + 1} / span ${tile.pos.w}`,
            gridRow: `${tile.pos.y + 1} / span ${tile.pos.h}`,
          }}
        >
          <TileContent tile={tile} data={data[tile.id]} />
        </TileShell>
      ))}
    </div>
  );
}
