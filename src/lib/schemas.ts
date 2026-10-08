import { z } from 'zod';
import { TILE_COLORS, TILE_TYPES, MAX_TILES, type TileConfigMap, type TileType } from './tiles';

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

const posSchema = z.object({
  x: z.number().int().min(0).max(5),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(6),
  h: z.number().int().min(1).max(3),
});

function tileVariant<K extends TileType>(type: K) {
  return z.object({
    id: z.string().uuid(),
    type: z.literal(type),
    pos: posSchema,
    color: z.enum(TILE_COLORS),
    stickers: z.array(stickerSchema).max(2),
    mobileOrder: z.number().int().min(0),
    hideOnMobile: z.boolean(),
    config: configSchemas[type],
  });
}

const [firstType, ...restTypes] = TILE_TYPES;
export const tileSchema = z.discriminatedUnion('type', [
  tileVariant(firstType),
  ...restTypes.map((t) => tileVariant(t)),
]);

export const layoutTilesSchema = z.array(tileSchema).max(MAX_TILES);

export const pageSlugSchema = z.enum(['home', 'about']);
