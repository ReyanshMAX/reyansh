import Image from 'next/image';
import type { TileRenderProps } from '../types';

export function MediaRender({ tile, data }: TileRenderProps<'media'>) {
  const { fit, caption } = tile.config;
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-inner">
        {data ? (
          <Image
            src={data.url}
            alt={data.alt}
            fill
            sizes={`(max-width: 1023px) 100vw, ${Math.round((tile.pos.w / 6) * 100)}vw`}
            style={{ objectFit: fit }}
          />
        ) : (
          <div className="t-meta absolute inset-0 flex items-center justify-center rounded-inner border-[2.5px] border-dashed border-current">
            Pick a photo
          </div>
        )}
      </div>
      {caption && <div className="text-[20px] font-bold">{caption}</div>}
    </div>
  );
}
