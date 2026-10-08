import type { TileRenderProps } from '../types';

export function NowRender({ tile, data }: TileRenderProps<'now'>) {
  return (
    <div className="flex h-full flex-col justify-between gap-4 px-8 py-7">
      <div className="t-meta">{tile.config.label}</div>
      {data.text && <p className="t-title-s">{data.text}</p>}
    </div>
  );
}
