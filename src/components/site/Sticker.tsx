import type { Sticker as StickerData, TileColor } from '@/lib/tiles';

// docs/UI.md "Stickers". A second sticker on the same corner offsets by +68px / +170px.
export function Sticker({ sticker, tileColor, stackIndex }: { sticker: StickerData; tileColor: TileColor; stackIndex: number }) {
  const onLight = tileColor === 'yellow' || tileColor === 'white';
  const side = sticker.corner === 'top-right' ? 'right' : 'left';
  return (
    <span
      className="pointer-events-none absolute z-10 rounded-pill border-[2.5px] border-ink px-5 py-3 text-[18px] leading-none font-bold whitespace-nowrap text-ink"
      style={{
        top: 32 + stackIndex * 68,
        [side]: 32 + stackIndex * 170,
        background: onLight ? '#FFFFFF' : '#FFC93C',
        transform: `rotate(${sticker.rotation}deg)`,
      }}
    >
      {sticker.text}
    </span>
  );
}

export function Stickers({ stickers, tileColor }: { stickers: StickerData[]; tileColor: TileColor }) {
  const seen: Record<string, number> = {};
  return (
    <>
      {stickers.map((s, i) => {
        const stackIndex = seen[s.corner] ?? 0;
        seen[s.corner] = stackIndex + 1;
        return <Sticker key={i} sticker={s} tileColor={tileColor} stackIndex={stackIndex} />;
      })}
    </>
  );
}
