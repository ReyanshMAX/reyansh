'use client';

import { TILE_COLORS, type Sticker, type Tile, type TileConfigMap, type TileType } from '@/lib/tiles';
import { TILE_STYLE } from '@/lib/tokens';
import { getTileDef, type TileInspectorProps } from '@/tiles/registry';
import { canResize } from './layoutMath';

const ROTATIONS = [-8, -4, 4, 8] as const;
const NEW_STICKER: Sticker = { text: 'new sticker', rotation: 4, corner: 'top-right' }; // D-023

function Stepper({ label, value, canDec, canInc, onDec, onInc }: {
  label: string; value: number; canDec: boolean; canInc: boolean; onDec: () => void; onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-[10px] border-[1.5px] border-admin-line bg-white">
      <button type="button" className="size-11 text-lg disabled:opacity-30" disabled={!canDec} onClick={onDec} aria-label={`Decrease ${label}`}>−</button>
      <span className="min-w-12 text-center font-mono text-sm">{label} {value}</span>
      <button type="button" className="size-11 text-lg disabled:opacity-30" disabled={!canInc} onClick={onInc} aria-label={`Increase ${label}`}>+</button>
    </div>
  );
}

function StickerRows({ stickers, onChange }: { stickers: Sticker[]; onChange: (next: Sticker[]) => void }) {
  const set = (i: number, patch: Partial<Sticker>) => onChange(stickers.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="flex flex-col gap-2">
      {stickers.map((s, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-admin-line bg-white p-2">
          <div className="flex gap-2">
            <input
              className="admin-input"
              aria-label={`Sticker ${i + 1} text`}
              value={s.text}
              maxLength={24}
              onChange={(e) => set(i, { text: e.target.value })}
            />
            <button type="button" className="admin-btn" aria-label={`Remove sticker ${i + 1}`} onClick={() => onChange(stickers.filter((_, j) => j !== i))}>×</button>
          </div>
          <div className="flex gap-2">
            <select className="admin-input" aria-label={`Sticker ${i + 1} rotation`} value={s.rotation} onChange={(e) => set(i, { rotation: Number(e.target.value) as Sticker['rotation'] })}>
              {ROTATIONS.map((r) => <option key={r} value={r}>{r}°</option>)}
            </select>
            <select className="admin-input" aria-label={`Sticker ${i + 1} corner`} value={s.corner} onChange={(e) => set(i, { corner: e.target.value as Sticker['corner'] })}>
              <option value="top-left">Top left</option>
              <option value="top-right">Top right</option>
            </select>
          </div>
          {!s.text.trim() && <span className="text-[13px] text-orange">Sticker text can&apos;t be empty.</span>}
        </div>
      ))}
      {stickers.length < 2 && (
        <button type="button" className="admin-btn self-start" onClick={() => onChange([...stickers, { ...NEW_STICKER }])}>+ Add sticker</button>
      )}
    </div>
  );
}

export function TileInspector({ tile, tiles, onUpdate, onDelete }: {
  tile: Tile | null;
  tiles: Tile[];
  onUpdate: (id: string, patch: Partial<Omit<Tile, 'id' | 'type'>>) => void;
  onDelete: (id: string) => void;
}) {
  if (!tile) {
    return <p className="text-[15px] text-admin-muted">Select a tile to edit it.</p>;
  }
  const def = getTileDef(tile.type);
  const Inspector = def?.Inspector as React.ComponentType<TileInspectorProps<TileType>> | undefined;
  const { w, h } = tile.pos;
  const resize = (nw: number, nh: number) => onUpdate(tile.id, { pos: { ...tile.pos, w: nw, h: nh } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="admin-label">Tile type</span>
        <span className="text-[17px] font-bold">{def?.label ?? tile.type}</span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="admin-label">Content</span>
        {Inspector && (
          <Inspector config={tile.config} onChange={(config: TileConfigMap[TileType]) => onUpdate(tile.id, { config })} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="admin-label">Size</span>
        <div className="flex flex-wrap gap-2">
          <Stepper label="W" value={w} canDec={canResize(tiles, tile, w - 1, h)} canInc={canResize(tiles, tile, w + 1, h)} onDec={() => resize(w - 1, h)} onInc={() => resize(w + 1, h)} />
          <Stepper label="H" value={h} canDec={canResize(tiles, tile, w, h - 1)} canInc={canResize(tiles, tile, w, h + 1)} onDec={() => resize(w, h - 1)} onInc={() => resize(w, h + 1)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="admin-label">Color</span>
        <div className="flex gap-2">
          {TILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={tile.color === c}
              onClick={() => onUpdate(tile.id, { color: c })}
              className="size-11 rounded-full"
              style={{
                background: TILE_STYLE[c].bg,
                border: TILE_STYLE[c].border ?? '2.5px solid transparent',
                outline: tile.color === c ? '3px solid #2B44FF' : undefined,
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="admin-label">Stickers</span>
        <StickerRows stickers={tile.stickers} onChange={(stickers) => onUpdate(tile.id, { stickers })} />
      </div>

      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="size-5"
          checked={tile.hideOnMobile}
          onChange={(e) => onUpdate(tile.id, { hideOnMobile: e.target.checked })}
        />
        <span className="font-medium">Hide on mobile</span>
      </label>

      <button type="button" className="admin-btn self-start" onClick={() => onDelete(tile.id)}>Delete tile</button>
    </div>
  );
}
