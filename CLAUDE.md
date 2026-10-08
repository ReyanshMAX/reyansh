# personal-site — Claude Code Entry Point

## What this is

Reyansh Rastogi's personal website: a public portfolio (Home, Projects, Project
detail, About, Blog, Blog post) styled as a loud-color bento grid, plus a
private admin dashboard where the owner rearranges tile layouts, adds/removes
tiles, and writes projects and blog posts without touching code.

Single owner, single tenant. Exactly one person can sign in to the dashboard
(GitHub OAuth, allowlisted in the `app_owner` table). Public visitors are
anonymous and read-only. Public pages are statically rendered and revalidated
on publish, so the site stays up and fast even if Supabase is slow or paused.
The single most important constraint: **published content and draft content
never mix** — visitors only ever see `layouts.status = 'published'` rows,
published projects, and posts whose `published_at <= now()`.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict) | no `any` in `src/` |
| Framework | Next.js (latest stable), App Router | server components + server actions |
| Styling | Tailwind CSS v4 | tokens in `app/globals.css` `@theme` from docs/UI.md |
| Grid editor | react-grid-layout | dashboard only |
| Markdown | unified: remark-gfm + remark-math + rehype-katex + rehype-pretty-code (`src/lib/markdown.ts`) | no raw HTML |
| Editor | @uiw/react-codemirror + @codemirror/lang-markdown | posts + project bodies |
| Validation | zod | every tile config + every server action input |
| Data / auth / files | Supabase (Postgres, Auth w/ GitHub, Storage) | `@supabase/ssr` |
| Deploy | Vercel (Hobby) | daily cron keep-alive |

## Repo structure

```
app/
  (site)/                 public pages: /, /about, /projects, /projects/[slug], /blog, /blog/[slug]
  admin/login/            sign-in page (public)
  admin/(protected)/      dashboard: layout/[page], projects, posts, media, settings, preview/[page]
  auth/callback/          OAuth code exchange route
  api/cron/keepalive/     daily Supabase ping
src/
  server/                 server-only data access + server actions (layouts, projects, posts, media, settings)
  tiles/                  tile registry, per-type Render + Inspector components
  components/site/        public UI (nav, TilePage, markdown renderer)
  components/admin/       dashboard UI (shell, grid editor, inspectors, editors)
  lib/                    supabase clients, zod schemas, types, tokens
supabase/migrations/      SQL migrations, applied in filename order
wireframes/               reference screens (static HTML) — layout intent, not pixel spec
design-reference/         H-bento-pop.html — the visual direction
docs/                     spec docs (see routing table)
```

## Where to look

| Working on | Read |
|---|---|
| current state, what to do next | STATUS.md |
| build order, acceptance criteria | BUILD.md |
| why something is the way it is | DECISIONS.md |
| unresolved questions — ask, don't guess | OPEN_QUESTIONS.md |
| routes, rendering, revalidation, publish flow, file layout | docs/ARCHITECTURE.md |
| tables, RLS, storage buckets, migrations | docs/DATABASE.md |
| tile types, configs, sizes, registry contract | docs/TILES.md |
| layout editor, project/post editors, media, settings | docs/DASHBOARD.md |
| colors, type, spacing, page templates, mobile stacking | docs/UI.md |
| sign-in, owner allowlist, protected routes | docs/AUTH.md |
| env vars, Vercel/Supabase setup, cron, domain | docs/DEPLOY.md |
| what a screen should contain | wireframes/*.html (+ docs/UI.md for styling) |

## Standing rules

1. **Read STATUS.md first.** It is the current state of the build. Do not infer
   progress from the codebase.
2. **Specs are source of truth.** If the implementation must deviate from a spec
   doc, update that doc in the same change. A stale spec is worse than no spec.
3. **Never invent unspecified behavior.** If a requirement is missing, ambiguous,
   or contradicts another doc, stop and ask. Add it to OPEN_QUESTIONS.md. Do not
   pick a reasonable-sounding default and proceed.
4. **Do not relitigate DECISIONS.md.** Those choices are settled with reasons
   recorded. Reopen one only if new information directly invalidates the stated
   reason, and say which reason and why.

## Project-specific rules

- Wireframes are grayscale on purpose. Colors, fonts and radii come from docs/UI.md, never from the wireframes.
- Placeholder copy like `[YEAR]` or `[CONTEST]` in wireframes is real-content-pending (Q-002). Do not fill it with invented facts.
- Work directly on `main`: commit and push there (owner's standing instruction, 2026-10-08). No feature branches or PRs unless asked.
- Never use the Supabase service-role key anywhere. All writes go through the signed-in owner's session + RLS.

**Start every session by reading STATUS.md.**
