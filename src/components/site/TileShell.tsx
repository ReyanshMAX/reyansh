import type { CSSProperties, ReactNode } from 'react';
import type { Tile } from '@/lib/tiles';
import { TILE_STYLE } from '@/lib/tokens';
import { Stickers } from './Sticker';

// Colored, rounded tile surface (with stickers) shared by the public grid and the editor canvas.
export function TileShell({ tile, className = '', style, children, ...rest }: {
  tile: Tile;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  'data-hide-mobile'?: boolean;
}) {
  const s = TILE_STYLE[tile.color];
  return (
    <section
      className={`relative overflow-hidden rounded-tile ${className}`}
      style={{ background: s.bg, color: s.fg, border: s.border ?? undefined, ...style }}
      data-hide-mobile={rest['data-hide-mobile'] || undefined}
    >
      {children}
      <Stickers stickers={tile.stickers} tileColor={tile.color} />
    </section>
  );
}
