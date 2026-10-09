import { TILE_STYLE } from '@/lib/tokens';
import type { TileRenderProps } from '../types';

// D-031: download link to site_settings.resume_path. With no PDF set the public page
// skips the tile (TilePage); the editor and preview show this hint instead.
export function ResumeRender({ tile, data }: TileRenderProps<'resume'>) {
  if (!data) {
    return <div className="t-meta flex h-full items-center justify-center p-6 text-center">Set a résumé PDF in Settings</div>;
  }
  const s = TILE_STYLE[tile.color];
  return (
    <a href={data.url} target="_blank" rel="noreferrer" download className="tile-link flex h-full items-end justify-between gap-4 px-8 py-7">
      <span className="t-title-s">{tile.config.label}</span>
      <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full text-[24px]" style={{ background: s.btnBg, color: s.btnFg }}>↓</span>
    </a>
  );
}
