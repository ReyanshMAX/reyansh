import type { TileRenderProps } from '../types';

export function HeroRender({ tile }: TileRenderProps<'hero'>) {
  const { name, tagline } = tile.config;
  return (
    <div className="flex h-full flex-col justify-end gap-5 p-8 lg:p-12">
      <h1 className="t-hero">{name}</h1>
      {tagline && <p className="t-body max-w-[30em]">{tagline}</p>}
    </div>
  );
}
