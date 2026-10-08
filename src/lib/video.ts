// D-027: only YouTube and Vimeo watch URLs are accepted; they render as privacy-friendly embeds.
export function videoEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const id = /^[A-Za-z0-9_-]{6,20}$/;

  if (host === 'youtube.com') {
    const v = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
    return v && id.test(v) ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === 'youtu.be') {
    const v = url.pathname.slice(1);
    return id.test(v) ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const v = url.pathname.match(/(\d{5,12})/)?.[1];
    return v ? `https://player.vimeo.com/video/${v}?dnt=1` : null;
  }
  return null;
}
