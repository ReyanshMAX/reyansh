import type { TileRenderProps } from '../types';

export function TextRender({ tile }: TileRenderProps<'text'>) {
  const { eyebrow, heading, body } = tile.config;
  return (
    <div className="flex h-full flex-col justify-between gap-4 p-8">
      <div className="t-meta">{eyebrow}</div>
      <div className="flex flex-col gap-2">
        {heading && <h2 className={tile.pos.w >= 2 ? 't-title-m' : 't-title-s'}>{heading}</h2>}
        {body && <p className="t-body">{body}</p>}
      </div>
    </div>
  );
}
