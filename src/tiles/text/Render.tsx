import type { TileRenderProps } from '../types';

export function TextRender({ tile }: TileRenderProps<'text'>) {
  const { eyebrow, heading, body } = tile.config;
  const large = tile.pos.w >= 2;
  return (
    <div className="flex h-full flex-col justify-between gap-4 p-8">
      <div className="font-mono text-[13px] leading-[1.4] font-medium tracking-[0.02em] uppercase">{eyebrow}</div>
      <div className="flex flex-col gap-2">
        {heading && (
          <h2
            className={
              large
                ? 'text-[40px] leading-none font-extrabold tracking-[-0.03em]'
                : 'text-[28px] leading-[1.05] font-bold tracking-[-0.02em]'
            }
          >
            {heading}
          </h2>
        )}
        {body && <p className="text-[20px] leading-[1.5] font-medium">{body}</p>}
      </div>
    </div>
  );
}
