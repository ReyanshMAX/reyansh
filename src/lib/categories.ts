// [slug, label] pairs. Project categories: D-026. Blog categories: D-029.
export const PROJECT_CATEGORIES = [
  ['software', 'Software'],
  ['hardware', 'Hardware'],
  ['research', 'Research'],
  ['hackathons', 'Hackathons'],
] as const;

export const PROJECT_CATEGORY_SLUGS = PROJECT_CATEGORIES.map(([slug]) => slug) as [
  (typeof PROJECT_CATEGORIES)[number][0],
  ...(typeof PROJECT_CATEGORIES)[number][0][],
];
export type ProjectCategory = (typeof PROJECT_CATEGORY_SLUGS)[number];

export function projectCategoryLabel(slug: string): string {
  return PROJECT_CATEGORIES.find(([s]) => s === slug)?.[1] ?? slug;
}

// D-029
export const BLOG_CATEGORIES = [
  ['build-notes', 'Build notes'],
  ['competitions', 'Competitions'],
  ['physics-math', 'Physics & math'],
  ['thoughts', 'Thoughts'],
] as const;

export const BLOG_CATEGORY_SLUGS = BLOG_CATEGORIES.map(([slug]) => slug) as [
  (typeof BLOG_CATEGORIES)[number][0],
  ...(typeof BLOG_CATEGORIES)[number][0][],
];

export function blogCategoryLabel(slug: string): string {
  return BLOG_CATEGORIES.find(([s]) => s === slug)?.[1] ?? slug;
}
