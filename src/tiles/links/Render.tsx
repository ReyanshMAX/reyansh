import type { TileRenderProps } from '../types';

// Rows with an empty Settings value are not rendered (D-024).
export function LinksRender({ tile, data }: TileRenderProps<'links'>) {
  const rows = [
    { label: 'Email', href: data.email ? `mailto:${data.email}` : '', bg: '#FF5A36' },
    { label: 'GitHub', href: data.githubUrl, bg: '#3DDC97' },
    { label: 'LinkedIn', href: data.linkedinUrl, bg: '#FFC93C' },
  ].filter((r) => r.href);
  return (
    <nav aria-label={tile.config.heading || 'Links'} className="flex h-full flex-col gap-3 p-4">
      <div className="flex flex-[1.3] items-end p-4 text-[34px] leading-none font-extrabold tracking-[-0.02em]">
        {tile.config.heading}
      </div>
      {rows.map((r) => (
        <a
          key={r.label}
          href={r.href}
          target={r.label === 'Email' ? undefined : '_blank'}
          rel={r.label === 'Email' ? undefined : 'noreferrer'}
          className="tile-link flex min-h-11 flex-1 items-center justify-between rounded-inner px-[22px] text-[19px] font-bold text-ink"
          style={{ background: r.bg }}
        >
          {r.label}
          <span aria-hidden>↗</span>
        </a>
      ))}
    </nav>
  );
}
