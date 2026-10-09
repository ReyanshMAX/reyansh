import { z } from 'zod';
import { BLOG_CATEGORY_SLUGS, PROJECT_CATEGORY_SLUGS } from './categories';
import { videoEmbedUrl } from './video';
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
  resume:    z.object({ label: str(30).min(1) }),
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

export const settingsInput = z.object({
  nowText: z.string().trim().max(160),
  email: z.string().email().or(z.literal('')),
  githubUrl: z.string().url().or(z.literal('')),
  linkedinUrl: z.string().url().or(z.literal('')),
  resumePath: z.string().nullable(),
});
export type SettingsInput = z.infer<typeof settingsInput>;

// Upload paths come from the client pipeline (docs/DASHBOARD.md "Media").
export const mediaInput = z.object({
  path: z.string().regex(/^(img\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(webp|svg|gif)|files\/[0-9a-f-]{36}-[a-z0-9-]*\.pdf)$/),
  kind: z.enum(['image', 'file']),
  alt: z.string().trim().max(300),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  bytes: z.number().int().positive().max(10_485_760),
});
export type MediaInput = z.infer<typeof mediaInput>;

const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const nullableUrl = z.string().trim().url().nullable();

export const projectInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().regex(slugRe).max(60),
  title: z.string().trim().min(1).max(80),
  oneLiner: z.string().trim().max(140),
  category: z.enum(PROJECT_CATEGORY_SLUGS),
  year: z.number().int().min(2015).max(2100).nullable(),
  role: z.string().trim().max(60),
  stack: z.array(z.string().trim().min(1).max(30)).max(12),
  status: z.enum(['in_progress', 'shipped', 'archived']),
  githubUrl: nullableUrl,
  demoUrl: nullableUrl,
  coverMediaId: z.string().uuid().nullable(),
  videoUrl: nullableUrl.refine((v) => v === null || videoEmbedUrl(v) !== null, 'Must be a YouTube or Vimeo link'), // D-027
  bodyMd: z.string().max(100_000),
});
export type ProjectInput = z.infer<typeof projectInput>;

export const postInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().regex(slugRe).max(80),
  title: z.string().trim().min(1).max(120),
  excerpt: z.string().trim().max(240),
  category: z.enum(BLOG_CATEGORY_SLUGS),
  relatedProjectId: z.string().uuid().nullable(),
  coverMediaId: z.string().uuid().nullable(),
  bodyMd: z.string().max(200_000),
  showInFeed: z.boolean(),
});
export type PostInput = z.infer<typeof postInput>;
