# Open Questions

Unresolved. Do not resolve these silently — ask, then move the answer to
DECISIONS.md and delete the entry here.

## Q-001: Final project and blog category lists

- **Blocking:** Phase 3 (project categories), Phase 4 (blog categories).
- **Options:** Wireframe placeholders — projects: Software, Hardware, Research, Hackathons; blog: Build notes, Competitions, Physics & math, Thoughts. Owner was told to rename these to what he'll actually use.
- **Depends on it:** `src/lib/categories.ts` (`PROJECT_CATEGORIES`, `BLOG_CATEGORIES` as `[slug, label][]`), filter pills on /projects and /blog, zod enums.

## Q-002: Real site content

- **Blocking:** no — needed before Phase 5 launch checklist.
- **Options:** Owner supplies: hero tagline, About bio, timeline entries (contests, hackathons, science fair, school), project write-ups (Anchor, Atlas, sonar ring, Pi assistant, others), photo, email/GitHub/LinkedIn, résumé PDF.
- **Depends on it:** nothing in code. Every `[PLACEHOLDER]` in wireframes stays a placeholder until supplied. Never invent bios, results, dates or stats.

## Q-003: Custom domain

- **Blocking:** no — launch on `*.vercel.app`.
- **Options:** Claim via GitHub Student Developer Pack partner (free first year) vs buy directly. Name undecided.
- **Depends on it:** `NEXT_PUBLIC_SITE_URL`, Supabase Site URL, GitHub OAuth app homepage (docs/DEPLOY.md).

## Q-004: How the résumé appears on the public site

- **Blocking:** Phase 5 (About page).
- **Options:** (a) add a 10th tile type `file` (title + download button → `site_settings.resume_path`); (b) add a "Résumé" button to the `links` tile when `resume_path` is set; (c) nav link. Wireframe FE 4 shows a dedicated black "Download résumé ↓" tile.
- **Depends on it:** TILES.md registry, `links` tile render, About layout.

## Q-005: Social share (OG) images

- **Blocking:** no — Phase 5 nice-to-have.
- **Options:** (a) one static OG image for the whole site; (b) generated per page with `next/og` (title on a colored tile); (c) use the cover image when present, else (a).
- **Depends on it:** `generateMetadata` in every public route, `app/opengraph-image.tsx`.

## Q-006: Video on project pages

- **Blocking:** Phase 3 — only if the owner wants video covers.
- **Options:** (a) images only (current spec); (b) YouTube/Vimeo URL field rendered as an embed on the detail page; (c) upload MP4 to Supabase Storage (free tier 1 GB total, 10 MB bucket limit — impractical). Wireframe FE 3 shows a play button in the hero media area.
- **Depends on it:** `projects` schema (`video_url text` column), project editor form, detail page hero.
