import { layoutTilesSchema } from '@/lib/schemas';
import { GRID_COLS, type Tile } from '@/lib/tiles';
import { TILE_REGISTRY } from './registry';

export type LayoutError =
  | { code: 'schema'; tileId?: string; message: string }
  | { code: 'size'; tileId: string; message: string }        // outside registry min/max
  | { code: 'bounds'; tileId: string }                        // x + w > 6
  | { code: 'overlap'; tileIds: [string, string] }
  | { code: 'mobile_order'; message: string }                 // not a permutation of 0..n-1
  | { code: 'missing_ref'; tileId: string; ref: 'project' | 'media' };

export type ValidateResult = { ok: true; tiles: Tile[] } | { ok: false; errors: LayoutError[] };

function overlaps(a: Tile, b: Tile): boolean {
  return a.pos.x < b.pos.x + b.pos.w && b.pos.x < a.pos.x + a.pos.w
    && a.pos.y < b.pos.y + b.pos.h && b.pos.y < a.pos.y + a.pos.h;
}

function tileIdAt(input: unknown, index: unknown): string | undefined {
  if (!Array.isArray(input) || typeof index !== 'number') return undefined;
  const t: unknown = input[index];
  if (t && typeof t === 'object' && 'id' in t && typeof t.id === 'string') return t.id;
  return undefined;
}

export function validateLayout(tiles: unknown): ValidateResult {
  const parsed = layoutTilesSchema.safeParse(tiles);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => ({
        code: 'schema',
        tileId: tileIdAt(tiles, issue.path[0]),
        message: `${issue.path.join('.') || 'tiles'}: ${issue.message}`,
      })),
    };
  }

  const list = parsed.data as Tile[];
  const errors: LayoutError[] = [];
  const ids = new Set<string>();

  for (const tile of list) {
    if (ids.has(tile.id)) errors.push({ code: 'schema', tileId: tile.id, message: 'duplicate tile id' });
    ids.add(tile.id);

    const def = TILE_REGISTRY[tile.type];
    if (!def) {
      errors.push({ code: 'schema', tileId: tile.id, message: `tile type "${tile.type}" is not available yet` });
      continue;
    }
    const { w, h } = tile.pos;
    if (w < def.minSize.w || h < def.minSize.h || w > def.maxSize.w || h > def.maxSize.h) {
      errors.push({
        code: 'size',
        tileId: tile.id,
        message: `${def.label} must be between ${def.minSize.w}×${def.minSize.h} and ${def.maxSize.w}×${def.maxSize.h}, got ${w}×${h}`,
      });
    }
    if (tile.pos.x + tile.pos.w > GRID_COLS) errors.push({ code: 'bounds', tileId: tile.id });
  }

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (overlaps(list[i], list[j])) errors.push({ code: 'overlap', tileIds: [list[i].id, list[j].id] });
    }
  }

  const orders = list.map((t) => t.mobileOrder).sort((a, b) => a - b);
  if (orders.some((o, i) => o !== i)) {
    errors.push({ code: 'mobile_order', message: `mobileOrder must be a permutation of 0..${list.length - 1}` });
  }

  return errors.length ? { ok: false, errors } : { ok: true, tiles: list };
}

// Publish-only check: drafts may reference nothing yet (docs/TILES.md).
export function findMissingRefs(
  tiles: Tile[],
  existing: { projectIds: ReadonlySet<string>; mediaIds: ReadonlySet<string> },
): LayoutError[] {
  const errors: LayoutError[] = [];
  for (const tile of tiles) {
    if (tile.type === 'project') {
      const { projectId } = (tile as Tile<'project'>).config;
      if (!existing.projectIds.has(projectId)) errors.push({ code: 'missing_ref', tileId: tile.id, ref: 'project' });
    } else if (tile.type === 'media') {
      const { mediaId } = (tile as Tile<'media'>).config;
      if (!existing.mediaIds.has(mediaId)) errors.push({ code: 'missing_ref', tileId: tile.id, ref: 'media' });
    }
  }
  return errors;
}
