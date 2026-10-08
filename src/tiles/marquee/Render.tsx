import { Fragment } from 'react';
import type { TileRenderProps } from '../types';

const STAR_COLORS = ['#FF5A36', '#FFC93C', '#3DDC97'];

function Words({ words }: { words: string[] }) {
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span>{w}</span>
          <span aria-hidden style={{ color: STAR_COLORS[i % STAR_COLORS.length] }}>✱</span>
        </Fragment>
      ))}
    </>
  );
}

export function MarqueeRender({ tile }: TileRenderProps<'marquee'>) {
  const { words } = tile.config;
  return (
    <div className="flex h-full items-center overflow-hidden">
      <p className="sr-only">{words.join(', ')}</p>
      <div aria-hidden className="marquee-track t-marquee flex shrink-0 items-center gap-7 pl-7 whitespace-nowrap">
        <Words words={words} />
        <Words words={words} />
      </div>
    </div>
  );
}
