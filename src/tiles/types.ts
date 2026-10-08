import type { ComponentType } from 'react';
import type { z } from 'zod';
import type { MediaItem } from '@/lib/media';
import type { Tile, TileColor, TileConfigMap, TileType } from '@/lib/tiles';

// Resolved server-side before render (docs/TILES.md "Data resolution").
// project / blog_feed become ProjectCard / PostCard[] when those types land (Phases 3–4).
export interface TileDataMap {
  hero: null;
  project: null;
  text: null;
  media: MediaItem | null;
  now: { text: string };
  marquee: null;
  links: { email: string; githubUrl: string; linkedinUrl: string };
  blog_feed: null;
  timeline: null;
}

export interface TileRenderProps<K extends TileType> {
  tile: Tile<K>;
  data: TileDataMap[K];
}

export interface TileInspectorProps<K extends TileType> {
  config: TileConfigMap[K];
  onChange: (next: TileConfigMap[K]) => void;
}

export interface TileDef<K extends TileType> {
  type: K;
  label: string;
  description: string;
  minSize: { w: number; h: number };
  maxSize: { w: number; h: number };
  defaultSize: { w: number; h: number };
  defaultColor: TileColor;
  defaultConfig: TileConfigMap[K];
  configSchema: z.ZodType<TileConfigMap[K]>;
  mobileMinHeight: number;
  Render: ComponentType<TileRenderProps<K>>;
  Inspector: ComponentType<TileInspectorProps<K>>;
}
