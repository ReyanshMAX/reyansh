import { ImageResponse } from 'next/og';

// D-032: generated share image, the page title on a blue tile (docs/UI.md colors).
// Used when a page has no cover image. 1200×630.

async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    // Without a browser user agent Google Fonts serves TTF, which next/og can read.
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  const title = (new URL(req.url).searchParams.get('title') ?? '').trim().slice(0, 120) || 'Reyansh Rastogi';
  const font = await loadFont(`${title}RR·Reyansh Rastogi`);
  const size = title.length > 60 ? 64 : title.length > 28 ? 84 : 112;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#FFF4E4', padding: 44 }}>
        <div
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            background: '#2B44FF', color: '#FFFFFF', borderRadius: 36, padding: '56px 64px',
            fontFamily: font ? 'Bricolage' : 'sans-serif',
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em' }}>RR</div>
          <div style={{ fontSize: size, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.035em' }}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>Reyansh Rastogi</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: font ? [{ name: 'Bricolage', data: font, weight: 800, style: 'normal' }] : undefined,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' },
    },
  );
}
