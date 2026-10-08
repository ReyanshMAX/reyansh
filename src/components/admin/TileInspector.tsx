'use client';

import type { Tile, TileConfigMap, TileType } from '@/lib/tiles';
import { getTileDef, type TileInspectorProps } from '@/tiles/registry';

export function TileInspector({ tile, onConfigChange }: {
  tile: Tile | null;
  onConfigChange: (id: string, config: TileConfigMap[TileType]) => void;
}) {
  if (!tile) {
    return <p className="text-[15px] text-admin-muted">Select a tile to edit it.</p>;
  }
  const def = getTileDef(tile.type);
  const Inspector = def?.Inspector as React.ComponentType<TileInspectorProps<TileType>> | undefined;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="admin-label">Tile type</span>
        <span className="text-[17px] font-bold">{def?.label ?? tile.type}</span>
      </div>
      <div className="flex flex-col gap-3">
        <span className="admin-label">Content</span>
        {Inspector && <Inspector config={tile.config} onChange={(next) => onConfigChange(tile.id, next)} />}
      </div>
    </div>
  );
}
