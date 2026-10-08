import type { TileType } from '@/lib/tiles';
import { configSchemas } from '@/lib/schemas';
import type { TileDef } from './types';
import { TextRender } from './text/Render';
import { TextInspector } from './text/Inspector';

export type { TileDef, TileRenderProps, TileInspectorProps, TileDataMap } from './types';

// Partial until every type is registered (Phase 1 ships only `text`; see STATUS.md).
export const TILE_REGISTRY: { [K in TileType]?: TileDef<K> } = {
  text: {
    type: 'text',
    label: 'Text',
    description: 'Eyebrow, heading and a short paragraph.',
    minSize: { w: 1, h: 1 },
    maxSize: { w: 6, h: 2 },
    defaultSize: { w: 2, h: 1 },
    defaultColor: 'white',
    defaultConfig: { eyebrow: '', heading: '', body: '' },
    configSchema: configSchemas.text,
    mobileMinHeight: 160,
    Render: TextRender,
    Inspector: TextInspector,
  },
};

export function getTileDef<K extends TileType>(type: K): TileDef<K> | undefined {
  return TILE_REGISTRY[type] as TileDef<K> | undefined;
}

export function registeredTileDefs(): TileDef<TileType>[] {
  return (Object.values(TILE_REGISTRY) as (TileDef<TileType> | undefined)[]).filter((d) => d !== undefined);
}
