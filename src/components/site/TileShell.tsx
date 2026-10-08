import type { CSSProperties, ReactNode } from 'react';
import type { Tile } from '@/lib/tiles';
import { TILE_STYLE } from '@/lib/tokens';

// Colored, rounded tile surface shared by the public grid and the editor canvas.
export function TileShell({ tile, className = '', style, children }: {
  tile: Tile;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const s = TILE_STYLE[tile.color];
  return (
    <section
      className={`relative overflow-hidden rounded-tile ${className}`}
      style={{ background: s.bg, color: s.fg, border: s.border ?? undefined, ...style }}
    >
      {children}
    </section>
  );
}
