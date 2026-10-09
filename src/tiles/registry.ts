import { NIL_UUID } from '@/lib/media';
import { configSchemas } from '@/lib/schemas';
import type { Tile, TileType } from '@/lib/tiles';
import type { TileDef } from './types';
import { BlogFeedInspector } from './blog_feed/Inspector';
import { BlogFeedRender } from './blog_feed/Render';
import { HeroInspector } from './hero/Inspector';
import { HeroRender } from './hero/Render';
import { LinksInspector } from './links/Inspector';
import { LinksRender } from './links/Render';
import { MarqueeInspector } from './marquee/Inspector';
import { MarqueeRender } from './marquee/Render';
import { MediaInspector } from './media/Inspector';
import { MediaRender } from './media/Render';
import { NowInspector } from './now/Inspector';
import { NowRender } from './now/Render';
import { ProjectInspector } from './project/Inspector';
import { ProjectRender } from './project/Render';
import { TextInspector } from './text/Inspector';
import { TextRender } from './text/Render';
import { ResumeInspector } from './resume/Inspector';
import { ResumeRender } from './resume/Render';
import { TimelineInspector } from './timeline/Inspector';
import { TimelineRender } from './timeline/Render';

export type { TileDef, TileRenderProps, TileInspectorProps, TileDataMap } from './types';

// Order here is the order in the Add tile modal.
export const TILE_REGISTRY: { [K in TileType]: TileDef<K> } = {
  hero: {
    type: 'hero',
    label: 'Hero',
    description: 'Your name, big, with a one-line tagline.',
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
    defaultSize: { w: 3, h: 2 },
    defaultColor: 'blue',
    defaultConfig: { name: 'Your name', tagline: '' }, // D-023
    configSchema: configSchemas.hero,
    mobileMinHeight: 420,
    Render: HeroRender,
    Inspector: HeroInspector,
  },
  project: {
    type: 'project',
    label: 'Project',
    description: 'One of your projects; size sets compact, row or feature look.',
    minSize: { w: 1, h: 1 },
    maxSize: { w: 2, h: 2 },
    defaultSize: { w: 2, h: 1 },
    defaultColor: 'orange',
    defaultConfig: { projectId: NIL_UUID }, // D-023 placeholder until a project is picked
    configSchema: configSchemas.project,
    mobileMinHeight: 200,
    Render: ProjectRender,
    Inspector: ProjectInspector,
  },
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
  media: {
    type: 'media',
    label: 'Photo',
    description: 'One image from your media library, with a caption.',
    minSize: { w: 1, h: 1 },
    maxSize: { w: 3, h: 3 },
    defaultSize: { w: 1, h: 2 },
    defaultColor: 'yellow',
    defaultConfig: { mediaId: NIL_UUID, fit: 'cover', caption: '' }, // D-023
    configSchema: configSchemas.media,
    mobileMinHeight: 280,
    Render: MediaRender,
    Inspector: MediaInspector,
  },
  now: {
    type: 'now',
    label: 'Now',
    description: 'What you are doing right now (edited in Settings).',
    minSize: { w: 1, h: 1 },
    maxSize: { w: 2, h: 1 },
    defaultSize: { w: 2, h: 1 },
    defaultColor: 'white',
    defaultConfig: { label: 'Right now' },
    configSchema: configSchemas.now,
    mobileMinHeight: 140,
    Render: NowRender,
    Inspector: NowInspector,
  },
  marquee: {
    type: 'marquee',
    label: 'Marquee',
    description: 'A scrolling strip of words.',
    minSize: { w: 2, h: 1 },
    maxSize: { w: 6, h: 1 },
    defaultSize: { w: 3, h: 1 },
    defaultColor: 'black',
    defaultConfig: { words: ['software', 'hardware'] },
    configSchema: configSchemas.marquee,
    mobileMinHeight: 96,
    Render: MarqueeRender,
    Inspector: MarqueeInspector,
  },
  links: {
    type: 'links',
    label: 'Links',
    description: 'Email, GitHub and LinkedIn buttons (from Settings).',
    minSize: { w: 1, h: 1 },
    maxSize: { w: 2, h: 2 },
    defaultSize: { w: 1, h: 2 },
    defaultColor: 'black',
    defaultConfig: { heading: 'Say hi.' },
    configSchema: configSchemas.links,
    mobileMinHeight: 240,
    Render: LinksRender,
    Inspector: LinksInspector,
  },
  blog_feed: {
    type: 'blog_feed',
    label: 'Blog feed',
    description: 'Your latest blog posts.',
    minSize: { w: 1, h: 2 },
    maxSize: { w: 2, h: 2 },
    defaultSize: { w: 1, h: 2 },
    defaultColor: 'white',
    defaultConfig: { count: 3 },
    configSchema: configSchemas.blog_feed,
    mobileMinHeight: 280,
    Render: BlogFeedRender,
    Inspector: BlogFeedInspector,
  },
  timeline: {
    type: 'timeline',
    label: 'Timeline',
    description: 'Years and milestones, in the order you set.',
    minSize: { w: 2, h: 2 },
    maxSize: { w: 2, h: 3 },
    defaultSize: { w: 2, h: 2 },
    defaultColor: 'white',
    defaultConfig: { heading: 'Timeline', entries: [] },
    configSchema: configSchemas.timeline,
    mobileMinHeight: 320,
    Render: TimelineRender,
    Inspector: TimelineInspector,
  },
  resume: {
    type: 'resume',
    label: 'Résumé',
    description: 'Download button for your résumé PDF (set in Settings).',
    minSize: { w: 1, h: 1 },
    maxSize: { w: 2, h: 1 },
    defaultSize: { w: 1, h: 1 },
    defaultColor: 'black',
    defaultConfig: { label: 'Download résumé' },
    configSchema: configSchemas.resume,
    mobileMinHeight: 120,
    Render: ResumeRender,
    Inspector: ResumeInspector,
  },
};

export function getTileDef<K extends TileType>(type: K): TileDef<K> | undefined {
  return TILE_REGISTRY[type] as TileDef<K> | undefined;
}

export function registeredTileDefs(): TileDef<TileType>[] {
  return (Object.values(TILE_REGISTRY) as (TileDef<TileType> | undefined)[]).filter((d) => d !== undefined);
}

// docs/UI.md: project feature variant (h ≥ 2) stacks at 360px.
export function mobileMinHeightOf(tile: Tile): number {
  if (tile.type === 'project' && tile.pos.h >= 2) return 360;
  return getTileDef(tile.type)?.mobileMinHeight ?? 160;
}
