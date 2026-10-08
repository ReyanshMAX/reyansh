'use client';

import ReactGridLayout, { getCompactor, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import type { Tile } from '@/lib/tiles';
import { TILE_STYLE } from '@/lib/tokens';
import { getTileDef } from '@/tiles/registry';
import { byMobileOrder } from './layoutMath';

const WIDTH = 390;
const ROW = 72;
const compactor = getCompactor('vertical');

function summary(tile: Tile): string {
  const c = tile.config as Record<string, unknown>;
  const text = [c.name, c.heading, c.label, c.caption, Array.isArray(c.words) ? c.words.join(' · ') : null]
    .find((v) => typeof v === 'string' && v.trim());
  return typeof text === 'string' ? text : '';
}

function Row({ tile, struck = false }: { tile: Tile; struck?: boolean }) {
  const s = TILE_STYLE[tile.color];
  const label = getTileDef(tile.type)?.label ?? tile.type;
  return (
    <div
      className={`flex h-full items-center gap-3 rounded-2xl px-4 ${struck ? 'line-through opacity-60' : 'cursor-grab active:cursor-grabbing'}`}
      style={{ background: s.bg, color: s.fg, border: s.border ?? undefined }}
    >
      {!struck && <span aria-hidden className="font-mono text-xs">⋮⋮</span>}
      <span className="font-mono text-xs uppercase">{label}</span>
      <span className="min-w-0 flex-1 truncate font-bold">{summary(tile)}</span>
    </div>
  );
}

// Phone stacking order (D-008): same react-grid-layout, one column, one row per tile.
export function StackingOrder({ tiles, onReorder }: { tiles: Tile[]; onReorder: (orderedIds: string[]) => void }) {
  const ordered = byMobileOrder(tiles);
  const visible = ordered.filter((t) => !t.hideOnMobile);
  const hidden = ordered.filter((t) => t.hideOnMobile);
  const layout: Layout = visible.map((t, i) => ({ i: t.id, x: 0, y: i, w: 1, h: 1 }));

  return (
    <div className="mx-auto flex w-[390px] flex-col gap-3">
      <p className="font-mono text-xs text-admin-muted">Phone order (below 1024px) · drag to reorder</p>
      <ReactGridLayout
        width={WIDTH}
        layout={layout}
        gridConfig={{ cols: 1, rowHeight: ROW, margin: [0, 10], containerPadding: [0, 0] }}
        resizeConfig={{ enabled: false, handles: [] }}
        compactor={compactor}
        onDragStop={(l) => onReorder([...l].sort((a, b) => a.y - b.y).map((item) => item.i))}
      >
        {visible.map((t) => (
          <div key={t.id}>
            <Row tile={t} />
          </div>
        ))}
      </ReactGridLayout>
      {hidden.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="font-mono text-xs text-admin-muted">Hidden on mobile</p>
          {hidden.map((t) => (
            <div key={t.id} style={{ height: ROW }}>
              <Row tile={t} struck />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
