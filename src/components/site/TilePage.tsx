import type { CSSProperties, JSX } from 'react';
import type { PageSlug, Tile } from '@/lib/tiles';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPublishedLayout, sanitizeTiles } from '@/server/queries';
import { mobileMinHeightOf } from '@/tiles/registry';
import { resolveTileData } from '@/tiles/resolve';
import { MobileHidden } from './MobileHidden';
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
      {tiles.map((tile) => {
        // A project tile whose project is unpublished/deleted renders nothing; its cell stays empty.
        if (tile.type === 'project' && !data[tile.id]) return null;
        const style = {
          '--tile-col': `${tile.pos.x + 1} / span ${tile.pos.w}`,
          '--tile-row': `${tile.pos.y + 1} / span ${tile.pos.h}`,
          '--tile-mobile-order': tile.mobileOrder,
          '--tile-mobile-min-h': `${mobileMinHeightOf(tile)}px`,
        } as CSSProperties;
        const shell = (
          <TileShell key={tile.id} tile={tile} className="tile" style={style} data-hide-mobile={tile.hideOnMobile}>
            <TileContent tile={tile} data={data[tile.id]} />
          </TileShell>
        );
        return tile.hideOnMobile ? <MobileHidden key={tile.id}>{shell}</MobileHidden> : shell;
      })}
    </div>
  );
}
