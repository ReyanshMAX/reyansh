export const TILE_TYPES = [
  'hero', 'project', 'text', 'media', 'now', 'marquee', 'links', 'blog_feed', 'timeline',
] as const;
export type TileType = (typeof TILE_TYPES)[number];

export const TILE_COLORS = ['blue', 'orange', 'green', 'yellow', 'white', 'black'] as const;
export type TileColor = (typeof TILE_COLORS)[number];

export const GRID_COLS = 6;
export const MAX_TILES = 24;

export interface GridPos { x: number; y: number; w: number; h: number }

export interface Sticker {
  text: string;                 // 1–24 chars
  rotation: -8 | -4 | 4 | 8;    // degrees
  corner: 'top-left' | 'top-right';
}

export interface TimelineEntry { year: string; label: string; href: string | null }

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

export const PAGE_SLUGS = ['home', 'about'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export function pagePath(page: PageSlug): string {
  return page === 'home' ? '/' : '/about';
}
