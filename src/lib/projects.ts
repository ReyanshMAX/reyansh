import { mediaUrl } from './media';

export type ProjectStatus = 'in_progress' | 'shipped' | 'archived';

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  in_progress: 'In progress',
  shipped: 'Shipped',
  archived: 'Archived',
};

export interface ProjectCard {
  id: string; slug: string; title: string; oneLiner: string; category: string;
  year: number | null; coverUrl: string | null; coverAlt: string; featured: boolean;
}

export interface ProjectFull extends ProjectCard {
  role: string; stack: string[]; status: ProjectStatus;
  githubUrl: string | null; demoUrl: string | null; videoUrl: string | null;
  bodyMd: string; nextSlug: string | null; nextTitle: string | null;
}

// Dashboard row: every column the editor needs.
export interface ProjectRow extends Omit<ProjectFull, 'nextSlug' | 'nextTitle'> {
  coverMediaId: string | null;
  published: boolean;
  publishedAt: string | null;
  sortOrder: number;
  updatedAt: string;
}

export const PROJECT_COLUMNS =
  'id, slug, title, one_liner, category, year, role, stack, status, github_url, demo_url, cover_media_id, video_url, body_md, featured, sort_order, published, published_at, updated_at, cover:media(path, alt)';

export interface ProjectDbRow {
  id: string; slug: string; title: string; one_liner: string; category: string; year: number | null;
  role: string; stack: string[]; status: ProjectStatus; github_url: string | null; demo_url: string | null;
  cover_media_id: string | null; video_url: string | null; body_md: string; featured: boolean;
  sort_order: number; published: boolean; published_at: string | null; updated_at: string;
  cover: { path: string; alt: string } | null;
}

export function toProjectRow(r: ProjectDbRow): ProjectRow {
  return {
    id: r.id, slug: r.slug, title: r.title, oneLiner: r.one_liner, category: r.category, year: r.year,
    coverUrl: r.cover ? mediaUrl(r.cover.path) : null, coverAlt: r.cover?.alt ?? '', featured: r.featured,
    role: r.role, stack: r.stack, status: r.status, githubUrl: r.github_url, demoUrl: r.demo_url,
    videoUrl: r.video_url, bodyMd: r.body_md, coverMediaId: r.cover_media_id, published: r.published,
    publishedAt: r.published_at, sortOrder: r.sort_order, updatedAt: r.updated_at,
  };
}

export function toProjectCard(r: ProjectRow): ProjectCard {
  return {
    id: r.id, slug: r.slug, title: r.title, oneLiner: r.oneLiner, category: r.category,
    year: r.year, coverUrl: r.coverUrl, coverAlt: r.coverAlt, featured: r.featured,
  };
}

// Public /projects order: featured first, then sort_order (docs/UI.md).
export function publicOrder(a: ProjectRow, b: ProjectRow): number {
  return Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder;
}
