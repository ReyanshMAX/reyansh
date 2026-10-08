import { GRID_COLS, type GridPos, type Tile } from '@/lib/tiles';

export function maxRowUsed(tiles: Tile[]): number {
  return tiles.reduce((m, t) => Math.max(m, t.pos.y + t.pos.h - 1), -1);
}

function collides(tiles: Tile[], pos: GridPos): boolean {
  return tiles.some((t) =>
    pos.x < t.pos.x + t.pos.w && t.pos.x < pos.x + pos.w && pos.y < t.pos.y + t.pos.h && t.pos.y < pos.y + pos.h,
  );
}

// First free slot of the given size, scanning rows top→bottom, cols left→right,
// within the visible rows (max(4, maxRowUsed + 1)). null if none fits.
export function firstFreeSlot(tiles: Tile[], size: { w: number; h: number }): GridPos | null {
  const rows = Math.max(4, maxRowUsed(tiles) + 2);
  for (let y = 0; y + size.h <= rows; y++) {
    for (let x = 0; x + size.w <= GRID_COLS; x++) {
      const pos = { x, y, ...size };
      if (!collides(tiles, pos)) return pos;
    }
  }
  return null;
}

// Where a new tile goes: first free slot, else a new row below everything (docs/DASHBOARD.md).
export function placeNewTile(tiles: Tile[], size: { w: number; h: number }): GridPos {
  return firstFreeSlot(tiles, size) ?? { x: 0, y: maxRowUsed(tiles) + 1, ...size };
}

export function repackMobileOrder(tiles: Tile[]): Tile[] {
  const order = [...tiles].sort((a, b) => a.mobileOrder - b.mobileOrder).map((t) => t.id);
  return tiles.map((t) => ({ ...t, mobileOrder: order.indexOf(t.id) }));
}
