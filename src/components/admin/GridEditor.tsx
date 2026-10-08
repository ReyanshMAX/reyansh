'use client';

import ReactGridLayout, { getCompactor, useContainerWidth, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { GRID_COLS, type Tile } from '@/lib/tiles';
import { TileContent } from '@/components/site/TileContent';
import { TileShell } from '@/components/site/TileShell';
import { tileData } from '@/tiles/data';
import { getTileDef } from '@/tiles/registry';
import { useAdminData } from './AdminData';
import { firstFreeSlot, maxRowUsed } from './layoutMath';

const MARGIN = 12;
// Public grid at 1920×1080 (docs/UI.md): 6 columns of ~290px, rows of ~223px, 18px gaps.
const PUBLIC_COL = (1920 - 2 * 44 - 5 * 18) / 6;
const PUBLIC_ROW = (1080 - 88 - 44 - 3 * 18) / 4;
const PUBLIC_GAP = 18;
const compactor = getCompactor(null, false, true); // no compaction, prevent collisions

export function hasContent(tile: Tile): boolean {
  return Object.values(tile.config as Record<string, unknown>).some((v) =>
    typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : false,
  );
}

export function GridEditor({ tiles, selectedId, errorTileIds, onSelect, onRemove, onPositions, onAddClick }: {
  tiles: Tile[];
  selectedId: string | null;
  errorTileIds: ReadonlySet<string>;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onPositions: (layout: Layout) => void;
  onAddClick: () => void;
}) {
  const { settings, mediaById, projectCards } = useAdminData();
  const { width, containerRef, mounted } = useContainerWidth();
  const colWidth = (width - MARGIN * (GRID_COLS - 1)) / GRID_COLS;
  // Each tile renders at its real 1920×1080 size, scaled down to the canvas cell.
  const scale = colWidth / PUBLIC_COL;
  const rowHeight = Math.round(PUBLIC_ROW * scale);
  const rows = Math.max(4, maxRowUsed(tiles) + 2);
  const addSlot = firstFreeSlot(tiles, { w: 2, h: 1 });

  const layout: Layout = tiles.map((t) => {
    const def = getTileDef(t.type);
    return {
      i: t.id,
      ...t.pos,
      minW: def?.minSize.w, minH: def?.minSize.h,
      maxW: def?.maxSize.w, maxH: def?.maxSize.h,
    };
  });

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ minHeight: rows * rowHeight + (rows - 1) * MARGIN }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      {mounted && addSlot && (
        <button
          type="button"
          onClick={onAddClick}
          className="absolute z-[1] flex items-center justify-center rounded-[24px] border-2 border-dashed border-admin-muted text-[18px] font-bold text-admin-muted hover:border-ink hover:text-ink"
          style={{
            left: addSlot.x * (colWidth + MARGIN),
            top: addSlot.y * (rowHeight + MARGIN),
            width: addSlot.w * colWidth + (addSlot.w - 1) * MARGIN,
            height: addSlot.h * rowHeight + (addSlot.h - 1) * MARGIN,
          }}
        >
          + Add tile
        </button>
      )}
      {mounted && (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: GRID_COLS, rowHeight, margin: [MARGIN, MARGIN], containerPadding: [0, 0] }}
          dragConfig={{ enabled: true, handle: '.tile-drag-handle' }}
          resizeConfig={{ enabled: true, handles: ['se'] }}
          compactor={compactor}
          onDragStop={(l) => onPositions(l)}
          onResizeStop={(l) => onPositions(l)}
        >
          {tiles.map((tile) => {
            const def = getTileDef(tile.type);
            const selected = tile.id === selectedId;
            const invalid = errorTileIds.has(tile.id);
            const publicW = tile.pos.w * PUBLIC_COL + (tile.pos.w - 1) * PUBLIC_GAP;
            const publicH = tile.pos.h * PUBLIC_ROW + (tile.pos.h - 1) * PUBLIC_GAP;
            return (
              <div
                key={tile.id}
                onClick={() => onSelect(tile.id)}
                style={{
                  outline: invalid ? '3px solid #FF5A36' : selected ? '3px solid #2B44FF' : undefined,
                  outlineOffset: 3,
                  borderRadius: 36 * scale,
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none origin-top-left"
                  style={{ width: publicW, height: publicH, transform: `scale(${scale})` }}
                >
                  <TileShell tile={tile} className="h-full w-full">
                    <TileContent tile={tile} data={tileData(tile, { settings, media: mediaById, projects: projectCards })} />
                  </TileShell>
                </div>
                <div className="tile-drag-handle absolute top-3 left-3 flex h-9 cursor-grab items-center gap-1.5 rounded-pill bg-ink px-3 font-mono text-xs text-cream active:cursor-grabbing">
                  <span aria-hidden>⋮⋮</span> {def?.label ?? tile.type}
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${def?.label ?? tile.type} tile`}
                  className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-ink text-lg text-cream"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasContent(tile) && !window.confirm('Remove this tile? Its content will be lost.')) return;
                    onRemove(tile.id);
                  }}
                >
                  ×
                </button>
                {selected && (
                  <div className="absolute bottom-3 left-3 rounded-pill bg-admin-accent px-3 py-1 font-mono text-xs text-white">
                    {def?.label ?? tile.type} · {tile.pos.w}×{tile.pos.h}
                  </div>
                )}
              </div>
            );
          })}
        </ReactGridLayout>
      )}
    </div>
  );
}
