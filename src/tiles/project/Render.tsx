import Image from 'next/image';
import Link from 'next/link';
import { TILE_STYLE } from '@/lib/tokens';
import type { TileRenderProps } from '../types';

// Variant from size (docs/TILES.md): 1×1 compact, 2×1 row, 1×2 / 2×2 feature.
export function ProjectRender({ tile, data }: TileRenderProps<'project'>) {
  if (!data) {
    return <div className="t-meta flex h-full items-center justify-center p-6">Pick a project</div>;
  }
  const { w, h } = tile.pos;
  const s = TILE_STYLE[tile.color];
  const badge = data.draft && (
    <span className="t-meta absolute top-4 left-4 z-10 rounded-pill bg-ink px-3 py-1.5 text-cream">Draft project</span>
  );

  if (h >= 2) {
    return (
      <Link href={`/projects/${data.slug}`} className="tile-link flex h-full flex-col gap-4 p-6">
        {badge}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-inner">
          {data.coverUrl ? (
            <Image src={data.coverUrl} alt={data.coverAlt} fill sizes={`(max-width: 1023px) 100vw, ${Math.round((w / 6) * 100)}vw`} style={{ objectFit: 'cover' }} />
          ) : (
            <div className="t-title-l absolute inset-0 flex items-center justify-center rounded-inner border-[2.5px] border-dashed border-current">
              {data.title.slice(0, 1)}
            </div>
          )}
        </div>
        <div>
          <h3 className={w >= 2 ? 't-title-l' : 't-title-s'}>{data.title}</h3>
          {data.oneLiner && <p className="mt-1.5 text-[18px] font-medium">{data.oneLiner}</p>}
        </div>
      </Link>
    );
  }

  if (w >= 2) {
    return (
      <Link href={`/projects/${data.slug}`} className="tile-link flex h-full items-end justify-between gap-6 px-9 py-8">
        {badge}
        <div className="min-w-0">
          <h3 className="t-title-m">{data.title}</h3>
          {data.oneLiner && <p className="mt-1.5 text-[18px] font-medium">{data.oneLiner}</p>}
        </div>
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full text-[24px]"
          style={{ background: s.btnBg, color: s.btnFg }}
        >
          ↗
        </span>
      </Link>
    );
  }

  return (
    <Link href={`/projects/${data.slug}`} className="tile-link flex h-full items-end p-7">
      {badge}
      <h3 className="t-title-s">{data.title}</h3>
    </Link>
  );
}
