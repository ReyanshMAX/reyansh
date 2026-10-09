import type { TileRenderProps } from '../types';

// Entries render in array order (the owner orders them in the inspector).
export function TimelineRender({ tile }: TileRenderProps<'timeline'>) {
  const { heading, entries } = tile.config;
  return (
    <div className="flex h-full flex-col gap-4 px-8 py-7">
      {heading && <h2 className="t-title-s">{heading}</h2>}
      {entries.length === 0 ? (
        <p className="t-meta mt-auto">No entries yet</p>
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col justify-end divide-y-[2px] divide-current/20">
          {entries.map((e, i) => {
            const body = (
              <>
                <span className="t-meta w-[72px] shrink-0">{e.year}</span>
                <span className="text-[19px] leading-snug font-bold">{e.label}{e.href && <span aria-hidden> ↗</span>}</span>
              </>
            );
            return (
              <li key={`${i}-${e.year}-${e.label}`}>
                {e.href ? (
                  <a href={e.href} target="_blank" rel="noreferrer" className="flex min-h-11 items-baseline gap-4 py-2.5 underline-offset-4 hover:underline">{body}</a>
                ) : (
                  <div className="flex min-h-11 items-baseline gap-4 py-2.5">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
