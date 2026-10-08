// [slug, label] pairs. Project categories: D-026. Blog categories: pending Q-001 (Phase 4).
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
