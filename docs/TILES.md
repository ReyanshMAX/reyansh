# TILES.md — tile types, configs, sizes, registry contract

## Overview

A tile page (Home, About) is a `Tile[]` stored in `layouts.tiles`. Each tile
has a grid position, a color, optional stickers, mobile ordering, and a
type-specific `config`. Every tile type is one entry in `src/tiles/registry.ts`
that supplies its size limits, default config, zod schema, public renderer and
dashboard inspector. Adding a tile type = adding one registry entry + two
components; nothing else in the app switches on tile type.

## Non-goals

- No GitHub activity, Spotify, or custom-embed tiles in v1 (D-009).
- No per-tile custom CSS, fonts, or arbitrary hex colors — only the palette in docs/UI.md.
- No animations beyond the marquee scroll and hover states defined in docs/UI.md.
- No tile nesting.

## Grid model

- 6 columns. Rows are unbounded; at ≥1024px the first 4 rows fill one viewport (docs/UI.md).
- Positions are integer grid units, origin top-left: `x ∈ [0,5]`, `y ≥ 0`, `x + w ≤ 6`.
- Tiles never overlap (enforced in editor via react-grid-layout `preventCollision`, and re-checked by `validateLayout`).
- Max 24 tiles per page.

## Types — `src/lib/tiles.ts`

```ts
export const TILE_TYPES = [
  'hero', 'project', 'text', 'media', 'now', 'marquee', 'links', 'blog_feed', 'timeline',
] as const;
export type TileType = (typeof TILE_TYPES)[number];

export const TILE_COLORS = ['blue', 'orange', 'green', 'yellow', 'white', 'black'] as const;
export type TileColor = (typeof TILE_COLORS)[number];

export interface GridPos { x: number; y: number; w: number; h: number }

export interface Sticker {
  text: string;                 // 1–24 chars
  rotation: -8 | -4 | 4 | 8;    // degrees
  corner: 'top-left' | 'top-right';
}

export interface TileConfigMap {
  hero:      { name: string; tagline: string };
  project:   { projectId: string };
  text:      { eyebrow: string; heading: string; body: string };
  media:     { mediaId: string; fit: 'cover' | 'contain'; caption: string };
  now:       { label: string };                       // text itself = site_settings.now_text (D-020)
  marquee:   { words: string[] };
  links:     { heading: string };                     // links = site_settings (D-021)
  blog_feed: { count: 1 | 2 | 3 | 4 | 5 };
  timeline:  { heading: string; entries: TimelineEntry[] };
}

export interface TimelineEntry { year: string; label: string; href: string | null }

export interface Tile<K extends TileType = TileType> {
  id: string;                   // crypto.randomUUID()
  type: K;
  pos: GridPos;
  color: TileColor;
  stickers: Sticker[];          // 0–2
  mobileOrder: number;          // 0-based, unique within page
  hideOnMobile: boolean;
  config: TileConfigMap[K];
}
```

## Size rules and defaults

| Type | min w×h | max w×h | default w×h | default color | default config |
|---|---|---|---|---|---|
| hero | 2×2 | 4×3 | 3×2 | blue | `{ name: 'Your name', tagline: '' }` (D-023) |
| project | 1×1 | 2×2 | 2×1 | orange | `{ projectId: NIL_UUID }` — placeholder until a project is picked; Publish reports `missing_ref` (D-023) |
| text | 1×1 | 6×2 | 2×1 | white | `{ eyebrow: '', heading: '', body: '' }` |
| media | 1×1 | 3×3 | 1×2 | yellow | `{ mediaId: NIL_UUID, fit: 'cover', caption: '' }` — nil UUID placeholder until a photo is picked; Publish reports `missing_ref` (D-023) |
| now | 1×1 | 2×1 | 2×1 | white | `{ label: 'Right now' }` |
| marquee | 2×1 | 6×1 | 3×1 | black | `{ words: ['software', 'hardware'] }` |
| links | 1×1 | 2×2 | 1×2 | black | `{ heading: 'Say hi.' }` |
| blog_feed | 1×2 | 2×2 | 1×2 | white | `{ count: 3 }` |
| timeline | 2×2 | 2×3 | 2×2 | white | `{ heading: 'Timeline', entries: [] }` |

## Zod schemas — `src/lib/schemas.ts`

```ts
const str = (max: number) => z.string().trim().max(max);

export const stickerSchema = z.object({
  text: z.string().trim().min(1).max(24),
  rotation: z.union([z.literal(-8), z.literal(-4), z.literal(4), z.literal(8)]),
  corner: z.enum(['top-left', 'top-right']),
});

export const configSchemas = {
  hero:      z.object({ name: str(40).min(1), tagline: str(200) }),
  project:   z.object({ projectId: z.string().uuid() }),
  text:      z.object({ eyebrow: str(30), heading: str(80), body: str(400) }),
  media:     z.object({ mediaId: z.string().uuid(), fit: z.enum(['cover', 'contain']), caption: str(80) }),
  now:       z.object({ label: str(30) }),
  marquee:   z.object({ words: z.array(str(30).min(1)).min(2).max(8) }),
  links:     z.object({ heading: str(30) }),
  blog_feed: z.object({ count: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]) }),
  timeline:  z.object({
    heading: str(30),
    entries: z.array(z.object({ year: str(12).min(1), label: str(80).min(1), href: z.string().url().nullable() })).max(10),
  }),
} satisfies { [K in TileType]: z.ZodType<TileConfigMap[K]> };

export const tileSchema = z.discriminatedUnion('type', TILE_TYPES.map((t) =>
  z.object({
    id: z.string().uuid(),
    type: z.literal(t),
    pos: z.object({ x: z.number().int().min(0).max(5), y: z.number().int().min(0), w: z.number().int().min(1).max(6), h: z.number().int().min(1).max(3) }),
    color: z.enum(TILE_COLORS),
    stickers: z.array(stickerSchema).max(2),
    mobileOrder: z.number().int().min(0),
    hideOnMobile: z.boolean(),
    config: configSchemas[t],
  }),
) as [z.ZodObject<any>, ...z.ZodObject<any>[]]);

export const layoutTilesSchema = z.array(tileSchema).max(24);
```

## Layout validation — `src/tiles/validate.ts`

```ts
export type LayoutError =
  | { code: 'schema'; tileId?: string; message: string }
  | { code: 'size'; tileId: string; message: string }        // outside registry min/max
  | { code: 'bounds'; tileId: string }                        // x + w > 6
  | { code: 'overlap'; tileIds: [string, string] }
  | { code: 'mobile_order'; message: string }                 // not a permutation of 0..n-1
  | { code: 'missing_ref'; tileId: string; ref: 'project' | 'media' };

export function validateLayout(tiles: unknown): { ok: true; tiles: Tile[] } | { ok: false; errors: LayoutError[] };
```

Run on every `saveDraftLayout` and again on `publishLayout`. `missing_ref` is only checked on publish (drafts may reference nothing yet).

## Registry contract — `src/tiles/registry.ts`

```ts
export interface TileDef<K extends TileType> {
  type: K;
  label: string;                         // shown in Add tile modal
  description: string;                   // one line, shown in Add tile modal
  minSize: { w: number; h: number };
  maxSize: { w: number; h: number };
  defaultSize: { w: number; h: number };
  defaultColor: TileColor;
  defaultConfig: TileConfigMap[K];
  configSchema: z.ZodType<TileConfigMap[K]>;
  mobileMinHeight: number;               // px, used when stacked (docs/UI.md)
  Render: React.ComponentType<TileRenderProps<K>>;      // server component, src/tiles/<type>/Render.tsx
  Inspector: React.ComponentType<TileInspectorProps<K>>; // client component, src/tiles/<type>/Inspector.tsx
}

export const TILE_REGISTRY: { [K in TileType]: TileDef<K> };

export interface TileRenderProps<K extends TileType> {
  tile: Tile<K>;
  data: TileDataMap[K];                  // resolved server-side, never fetched inside Render
}

export interface TileInspectorProps<K extends TileType> {
  config: TileConfigMap[K];
  onChange: (next: TileConfigMap[K]) => void;
}
```

## Data resolution — `src/tiles/resolve.ts`

Render components are pure. All DB reads for a page happen once, before render:

```ts
export interface TileDataMap {
  hero: null;
  project: ProjectCard | null;           // null if unpublished/deleted → tile renders nothing on public site
  text: null;
  media: MediaItem | null;
  now: { text: string };
  marquee: null;
  links: { email: string; githubUrl: string; linkedinUrl: string };
  blog_feed: PostCard[];                 // latest `count` posts where show_in_feed and live
  timeline: null;
}

export async function resolveTileData(
  tiles: Tile[],
  opts: { includeUnpublished: boolean },  // true only for /admin/preview
): Promise<Record<string, unknown>>;      // keyed by tile.id
```

Batching: one `projects` query (`in (...)`), one `media` query, one `site_settings` read, one `posts` query with the largest requested count.

## Notes

- A `project` tile whose project is unpublished renders nothing publicly (its grid cell stays empty) but renders with a "Draft project" badge in preview.
- Links tile: a row whose `site_settings` value is empty is not rendered (D-024).
- `TileTypeLabel` strings for the Add tile modal: Hero, Project, Text, Photo, Now, Marquee, Links, Blog feed, Timeline.
- Project tile visual variant is derived from size: 1×1 = compact (title only), 2×1 = row (title + one-liner + arrow), 1×2 / 2×2 = feature (cover image + title + one-liner).
