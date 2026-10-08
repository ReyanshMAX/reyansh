# Status

**Last updated:** 2026-10-08
**Current phase:** 4 of 5 — Blog (code complete; Phase 2–4 production checks open)
**Next action:** Owner runs the Phase 4 checks on production (publish a post → `/blog`, `/blog/<slug>`, Home blog_feed tile; schedule one 5 min ahead; uncheck "Show in Home blog feed") plus the open Phase 2/3 ones; then Phase 5 needs Q-004, Q-005.

---

## Done

- **Phase 1 — Owner logs in, places one text tile, publishes, it's live on Vercel** (completed 2026-10-08)
  - [x] `npm run build` succeeds with an empty database (no Supabase reachable at all: queries degrade to `[]`, `/` prerenders static)
  - [x] Production `/` returns 200 with nav + empty grid (checked before first publish)
  - [x] Signed-out `/admin/layout/home` redirects to `/admin/login` (production)
  - [x] Non-owner GitHub sign-in → `?error=not_owner` "This dashboard is private." (owner hit it during bootstrap, as docs/AUTH.md expects)
  - [x] Owner sign-in → `/admin/layout/home` (owner report; `app_owner` has 1 row)
  - [x] Text tile autosaves and persists (draft row holds the tile at `{x:0,y:0,w:5,h:1}`, `updated_at` 07:09:37 UTC)
  - [x] Publish makes the tile appear on production `/` (published 07:09:41 UTC; live HTML shows the tile at `1 / span 5`). "Not before publish" rests on RLS (`anon` reads only `status='published'`) + static render; not separately observed.
  - [x] Keep-alive cron returns 200 with secret, 401 without (200 on production after CRON_SECRET rotation; 401 verified locally)
  - [x] `saveDraftLayout` rejects out-of-bounds tile — verified on `validateLayout` (`x:5,w:2` → `{ code: 'bounds' }`), which is the action's only gate before the write; no end-to-end action call (needs an owner session from outside the editor)
  - Deviations: see "Deviations from spec" below.

## In progress

- **Phase 2 — Full Home in the H style, with every non-content tile type** (code complete 2026-10-08; migration 0003 applied to production)
  - [ ] 1920×1080 H reference layout fills one viewport, no scrollbar — local build against a mock DB: `scrollHeight` = 1080, no horizontal scroll. Re-check on production with real content.
  - [x] 390px: one column in `mobileOrder`; hide-on-mobile tile absent from the DOM (local, Playwright: 8 of 9 tiles rendered, hidden one not in the DOM)
  - [x] Tile color contrast ≥ 4.5:1 — computed from the docs/UI.md values: blue 6.2, orange 6.1, green 10.7, yellow 12.3, white 18.9, black 17.4
  - [ ] 6000×4000 JPEG → WebP ≤ 2400px in bucket `media`, shown in a media tile after publish (needs production)
  - [ ] Deleting media used by a tile is refused, naming the page (needs production)
  - [ ] Now text change in Settings updates `/` without re-publish (needs production)
  - [ ] Undo/Redo after a drag — verified locally on a color change only (autosaved, undo restored, redo enabled). Drag uses the same one-snapshot-per-stop path; re-check a drag on production.
  - [x] `/admin/preview/home` shows the draft with the "Draft preview — not live" banner; `/` serves only the published layout (local, mock DB)
  - [x] `prefers-reduced-motion: reduce` → marquee `animation-name: none` (local, Playwright)

- **Phase 3 — Projects: manage, write, list, detail, and project tiles** (code complete 2026-10-08; migration 0004 + `video_url` applied to production)
  - [ ] Created + published project shows title, one-liner, meta list and Markdown with a fenced code block, GFM table and KaTeX `$e^{i\pi}+1=0$` — verified locally against a mock DB (all four render); re-check on production
  - [x] Unpublished project → 404 at its URL and absent from `/projects` (local: `/projects/secret-draft` 404, not listed)
  - [ ] Editing a published project + Update changes the live page; typing without Update does not — by design (no autosave once published, D-012); verify on production
  - [ ] Dragging manager rows changes `/projects` order — action + UI built; drag not exercised locally
  - [x] Home `project` tile at 1×1 / 2×1 / 2×2 renders compact / row / feature, each a link to the detail page (local)
  - [ ] Unpublishing a tile-referenced project empties that cell after revalidation and Publish reports `missing_ref` — code paths in place (resolve skips, publish checks published ids); verify on production
  - [x] `<script>alert(1)</script>` in Markdown renders as text (local; pipeline also strips non-http(s)/mailto URLs)

- **Phase 4 — Blog: write, schedule, read, and the Home blog feed** (code complete 2026-10-08; migration 0005 applied to production)
  - [ ] Publishing a post shows it on `/blog`, `/blog/<slug>` and a Home `blog_feed` tile without re-publishing Home — local (mock DB): editor Publish / Publish now flips state and calls `revalidatePath` for all three; live check needs production
  - [ ] Post scheduled 5 min ahead is 404 before, live within 1 h after — local: scheduled post 404 at its URL and absent from `/blog` and the feed; `/`, `/blog`, `/blog/[slug]` all `revalidate = 3600`; the "after" half needs production
  - [x] Unchecking "Show in Home blog feed" drops the post from the feed, not `/blog` (local: post 12 listed on `/blog`, skipped by the feed tile)
  - [x] TOC lists every `##`/`###` heading; links scroll to the section (local: 3 entries, `#whats-next` lands at 24px from top)
  - [x] `/blog?page=2` lists posts 10–21 (local, 13 live posts: page 1 = 13…5, page 2 = 4…1, by link and by direct load)
  - [x] Read time = `max(1, round(words / 220))` (local: 452 words → 2 min; one helper `readMinutesOf` used by site and editor)

## Next up

1. Phase 5 — About, SEO, launch (needs Q-004, Q-005; content Q-002)

## Blocked

_Nothing blocking. Remaining Phase 2 criteria need owner testing on production._

## Deviations from spec

- **Tailwind v4** (what create-next-app installs): tokens live in `app/globals.css` `@theme`, not `tailwind.config.ts`. docs/UI.md + CLAUDE.md updated.
- **Next 16 `proxy.ts`** replaces `middleware.ts` (renamed upstream). docs/AUTH.md, ARCHITECTURE.md, BUILD.md updated.
- **react-grid-layout v2** API (`gridConfig`/`dragConfig`/`compactor`) instead of the v1 props in the snippet; not `bounded`. docs/DASHBOARD.md updated.
- **Phase-temporary:** `TILE_REGISTRY` is typed `{ [K in TileType]?: TileDef<K> }` until timeline lands (Phase 5).
- `src/lib/database.types.ts` not generated yet (needs the Supabase project); clients are untyped until then.
- **Migration 0003** adds a 5th storage policy, "owner reads media objects" (select): Supabase storage `remove()` needs select as well as delete. docs/DATABASE.md updated.
- **D-023/D-024/D-025** (owner decisions 2026-10-08): placeholder defaults for hero/photo/sticker, empty Links rows hidden, résumé PDF delete-protected. TILES.md, DASHBOARD.md, DATABASE.md updated.
- Undo coalesces content edits to one tile within 1s; hide-on-mobile tiles are CSS-hidden then removed from the DOM after hydration. DASHBOARD.md, UI.md updated.
- Dashboard pages share one settings + media context loaded in `app/admin/(protected)/layout.tsx`; extra files listed in ARCHITECTURE.md.
- **Phase 3:** D-026 (project categories), D-027 (`projects.video_url`, YouTube/Vimeo embed), D-028 (code blocks: ink + github-dark). Markdown renders through one `unified` pipeline (`src/lib/markdown.ts`) instead of react-markdown, because rehype-pretty-code is async and the preview action needs HTML; same plugins. CLAUDE.md, UI.md, ARCHITECTURE.md, DATABASE.md, TILES.md, DASHBOARD.md updated. Unspecified colors chosen and documented in UI.md: /projects featured card orange, other cards white, detail header blue.
- **Phase 4:** D-029 (blog categories), D-030 (pagination: page 1 = 9 posts, `?page=N` 12 each after that). `/blog` loads all live posts and filters/paginates client-side (`?c=`, `?page=`), like `/projects`, so the page stays static. `listLivePosts` gained `feedOnly` (blog_feed tile + editor canvas). Editor: scheduled posts behave like published ones (no autosave; Update saves edits and moves the date; extra **Publish now**); the date field is read-only once live. `renderPostPreview` action returns HTML + TOC. Unspecified colors chosen and documented in UI.md: latest post blue, next two yellow/green, older list + meta/TOC cards white, Next post black. ARCHITECTURE.md, DASHBOARD.md, UI.md, TILES.md updated.
- Added a "Sign out" button under "View live site" in the dashboard sidebar (AUTH.md defines `signOut()` but no placement).

## Environment facts

- Next.js version: 16.4.0 (React 19.3, Tailwind 4.3, react-grid-layout 2.3, zod 4.6, @supabase/ssr 0.12). `cacheComponents` is **off** in `next.config.ts` so the spec's route-segment caching model (`revalidatePath`, `revalidate`, `dynamic`) applies.
- Vercel project: `reyansh` (team `reyanshmaxs-projects`) already exists.
- Supabase project ref: `jcyvcvbxumhgaxriztfe` (`reyansh-site`, us-west-1, created 2026-10-08). Migrations 0001–0005 applied; 4 layout rows + settings row verified. Advisors: `touch_updated_at` mutable search_path (WARN), `is_owner()` executable by anon/authenticated (WARN, needed by RLS; returns only the caller's own owner status).
- Production URL: `https://reyansh-rho.vercel.app` (Vercel alias; deploys READY from `main`; framework pinned to `nextjs` in `vercel.json` because the Vercel API returns 403 for project updates)

---

## Update protocol

Update this file when:
- a phase criterion passes → check its box;
- a phase completes → move it to Done with the date and any deviations;
- work stops mid-phase → set **Next action** to the exact next step (file + function + criterion), not a vague area;
- something blocks → add it under Blocked with its Q-ID;
- implementation diverges from a spec → log under Deviations AND update that spec doc in the same change (standing rule 2).
