# ARCHITECTURE.md — routes, rendering, data access, publish flow

## Overview

One Next.js App Router app serves both the static public site and the
owner-only dashboard. Public pages are server components rendered statically
from Supabase with the anonymous key and refreshed by `revalidatePath` when the
owner publishes or updates (D-017). The dashboard is a set of protected routes
that mutate data only through server actions in `src/server/*`, running as the
signed-in owner so RLS applies (D-022).

## Non-goals

- No REST/GraphQL API for third parties. Server actions are the only write path; the only route handlers are `auth/callback` and `api/cron/keepalive`.
- No client-side data fetching on public pages.
- No i18n, no multi-site, no CDN config beyond Vercel defaults.
- No edge runtime; Node runtime everywhere.

## File tree

```
app/
  layout.tsx                      fonts, <html lang="en">, globals.css
  not-found.tsx
  (site)/
    layout.tsx                    <SiteNav/>
    page.tsx                      Home     → <TilePage page="home" />
    about/page.tsx                About    → <TilePage page="about" />
    projects/page.tsx
    projects/[slug]/page.tsx      generateStaticParams from published projects
    blog/page.tsx                 export const revalidate = 3600
    blog/[slug]/page.tsx          generateStaticParams + revalidate = 3600
  admin/
    login/page.tsx
    (protected)/
      layout.tsx                  <AdminShell/> (header + sidebar per wireframes)
      page.tsx                    redirect('/admin/layout/home')
      layout/[page]/page.tsx      layout editor
      preview/[page]/page.tsx     draft render, <TilePage draft />
      projects/page.tsx           manager
      projects/[id]/page.tsx      editor ('new' creates)
      posts/page.tsx              list + editor shell (redirects to newest)
      posts/[id]/page.tsx         editor ('new' creates)
      media/page.tsx
      settings/page.tsx
  auth/callback/route.ts
  api/cron/keepalive/route.ts
proxy.ts                          auth gate (Next 16 renamed middleware → proxy)
src/
  lib/
    supabase/public.ts            createPublicClient()  — anon key, no cookies (static render)
    supabase/server.ts            createServerSupabase() — @supabase/ssr, cookies (dashboard, actions)
    supabase/browser.ts           createBrowserSupabase() — uploads only
    database.types.ts             generated
    tiles.ts  schemas.ts  tokens.ts  categories.ts  slug.ts
  server/
    auth.ts  layouts.ts  projects.ts  posts.ts  media.ts  settings.ts  queries.ts
  tiles/
    registry.ts  resolve.ts  validate.ts
    hero/ project/ text/ media/ now/ marquee/ links/ blog_feed/ timeline/   (Render.tsx + Inspector.tsx each)
  components/site/   SiteNav.tsx TilePage.tsx Markdown.tsx Footer.tsx Sticker.tsx
  components/admin/  AdminShell.tsx GridEditor.tsx TileInspector.tsx AddTileModal.tsx
                     MarkdownEditor.tsx ProjectForm.tsx PostForm.tsx MediaPicker.tsx
supabase/migrations/
vercel.json
```

## Result type (all server actions)

```ts
// src/server/result.ts
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string; details?: unknown };
```
Every action: (1) `await requireOwner()`, (2) zod-parse input, (3) write, (4) revalidate, (5) return `ActionResult`. Never throw to the client.

## Public read queries — `src/server/queries.ts` (anon client, `server-only`)

```ts
export async function getPublishedLayout(page: PageSlug): Promise<Tile[]>;
export async function listPublishedProjects(): Promise<ProjectCard[]>;          // featured desc, sort_order asc
export async function getPublishedProject(slug: string): Promise<ProjectFull | null>;
export async function listLivePosts(opts: { limit: number; offset: number; category?: string }): Promise<PostCard[]>;
export async function getLivePost(slug: string): Promise<PostFull | null>;
export async function getSettings(): Promise<SiteSettings>;

export type PageSlug = 'home' | 'about';
export interface ProjectCard { id: string; slug: string; title: string; oneLiner: string; category: string; year: number | null; coverUrl: string | null; featured: boolean }
export interface ProjectFull extends ProjectCard { role: string; stack: string[]; status: 'in_progress' | 'shipped' | 'archived'; githubUrl: string | null; demoUrl: string | null; bodyMd: string; nextSlug: string | null }
export interface PostCard { id: string; slug: string; title: string; excerpt: string; category: string; publishedAt: string; readMinutes: number; coverUrl: string | null }
export interface PostFull extends PostCard { bodyMd: string; relatedProject: { slug: string; title: string } | null; nextSlug: string | null }
```

## Owner actions (cookie client, `'use server'`)

```ts
// src/server/layouts.ts
export async function getDraftLayout(page: PageSlug): Promise<ActionResult<{ tiles: Tile[]; updatedAt: string; publishedAt: string | null }>>;
export async function saveDraftLayout(page: PageSlug, tiles: unknown): Promise<ActionResult<{ updatedAt: string }>>;
export async function publishLayout(page: PageSlug): Promise<ActionResult<{ publishedAt: string }>>;   // validate incl. missing_ref, copy draft.tiles → published.tiles, revalidatePath(page === 'home' ? '/' : '/about')
export async function discardDraft(page: PageSlug): Promise<ActionResult>;                              // copy published.tiles → draft.tiles

// src/server/projects.ts
export async function listAllProjects(): Promise<ActionResult<ProjectRow[]>>;
export async function saveProject(input: ProjectInput): Promise<ActionResult<{ id: string }>>;           // upsert by id
export async function setProjectPublished(id: string, published: boolean): Promise<ActionResult>;
export async function setProjectFeatured(id: string, featured: boolean): Promise<ActionResult>;
export async function reorderProjects(orderedIds: string[]): Promise<ActionResult>;                    // sort_order = index
export async function deleteProject(id: string): Promise<ActionResult>;                                 // refused if referenced by a layout tile

// src/server/posts.ts
export async function listAllPosts(): Promise<ActionResult<PostRow[]>>;
export async function savePost(input: PostInput): Promise<ActionResult<{ id: string }>>;
export async function publishPost(id: string, at: string | null): Promise<ActionResult>;                 // null = now; ISO future = scheduled
export async function unpublishPost(id: string): Promise<ActionResult>;                                 // published_at = null
export async function deletePost(id: string): Promise<ActionResult>;

// src/server/media.ts
export async function registerMedia(input: { path: string; kind: 'image' | 'file'; alt: string; width: number | null; height: number | null; bytes: number }): Promise<ActionResult<MediaItem>>;
export async function updateMediaAlt(id: string, alt: string): Promise<ActionResult>;
export async function deleteMedia(id: string): Promise<ActionResult>;                                    // refused if referenced (DATABASE.md notes)

// src/server/settings.ts
export async function saveSettings(input: SettingsInput): Promise<ActionResult>;                        // revalidatePath('/', 'layout')
```

Input schemas (`src/lib/schemas.ts`):

```ts
export const projectInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60),
  title: z.string().trim().min(1).max(80),
  oneLiner: z.string().trim().max(140),
  category: z.enum(PROJECT_CATEGORIES),
  year: z.number().int().min(2015).max(2100).nullable(),
  role: z.string().trim().max(60),
  stack: z.array(z.string().trim().min(1).max(30)).max(12),
  status: z.enum(['in_progress', 'shipped', 'archived']),
  githubUrl: z.string().url().nullable(),
  demoUrl: z.string().url().nullable(),
  coverMediaId: z.string().uuid().nullable(),
  bodyMd: z.string().max(100_000),
});
export const postInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80),
  title: z.string().trim().min(1).max(120),
  excerpt: z.string().trim().max(240),
  category: z.enum(BLOG_CATEGORIES),
  relatedProjectId: z.string().uuid().nullable(),
  coverMediaId: z.string().uuid().nullable(),
  bodyMd: z.string().max(200_000),
  showInFeed: z.boolean(),
});
export const settingsInput = z.object({
  nowText: z.string().trim().max(160),
  email: z.string().email().or(z.literal('')),
  githubUrl: z.string().url().or(z.literal('')),
  linkedinUrl: z.string().url().or(z.literal('')),
  resumePath: z.string().nullable(),
});
```
`PROJECT_CATEGORIES` / `BLOG_CATEGORIES` live in `src/lib/categories.ts` — values pending Q-001.

## Revalidation map

| Write | `revalidatePath` calls |
|---|---|
| publishLayout('home') | `/` |
| publishLayout('about') | `/about` |
| any project write that affects a published project | `/projects`, `/projects/<slug>`, `/projects/<oldSlug>` if slug changed, `/`, `/about` |
| any post write that affects a live or scheduled post | `/blog`, `/blog/<slug>`, `/`, `/about` |
| saveSettings | `('/', 'layout')` |
| media alt change | `('/', 'layout')` |

## Notes

- `TilePage` signature: `export async function TilePage(props: { page: PageSlug; draft?: boolean }): Promise<JSX.Element>`. Draft mode uses the cookie client and `includeUnpublished: true`; it is only mounted under `/admin/(protected)/preview`.
- Public pages must build with an empty database (every query returns `[]`/`null` gracefully; Home with zero tiles renders the nav + an empty grid).
- `generateStaticParams` + `dynamicParams = true` on `[slug]` routes so newly published items render on first request.
