# Open Questions

Unresolved. Do not resolve these silently — ask, then move the answer to
DECISIONS.md and delete the entry here.

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
