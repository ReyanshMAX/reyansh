// Canonical origin for metadata, sitemap and share images (docs/DEPLOY.md).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const SITE_NAME = 'Reyansh Rastogi';

// D-032: a cover image when there is one, else the generated title card.
export function shareImage(title: string, coverUrl?: string | null): string {
  return coverUrl ?? `/api/og?title=${encodeURIComponent(title)}`;
}

// Title, description and share card for one public page. `label` is the page's own
// name ("Projects", a post title); the full title appends the site name.
export function pageMetadata(label: string, opts: { description?: string; coverUrl?: string | null; full?: boolean } = {}) {
  const title = opts.full ? label : `${label} — ${SITE_NAME}`;
  const images = [shareImage(label, opts.coverUrl)];
  return {
    title,
    description: opts.description || undefined,
    openGraph: { title, description: opts.description || undefined, images, siteName: SITE_NAME, type: 'website' as const },
    twitter: { card: 'summary_large_image' as const, title, images },
  };
}
