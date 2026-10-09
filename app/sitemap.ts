import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { listLivePosts, listPublishedProjects } from '@/server/queries';

// Public pages, every published project and every live post (never drafts or scheduled).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([listPublishedProjects(), listLivePosts({ limit: 1000, offset: 0 })]);
  return [
    ...['', '/about', '/projects', '/blog'].map((p) => ({ url: `${SITE_URL}${p || '/'}` })),
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${p.slug}` })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.publishedAt })),
  ];
}
