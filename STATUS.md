# Status

**Last updated:** 2026-10-08
**Current phase:** 2 of 5 — Full Home in the H style, with every non-content tile type
**Next action:** Start Phase 2 (BUILD.md): migration `0003_media_and_storage.sql`, then complete `TILE_STYLE`/tokens and the remaining non-content tile types (hero, media, now, marquee, links) per docs/TILES.md.

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

_Nothing. Phase 2 not started._

## Next up

1. Phase 2 — Full Home in the H style (next)
2. Phase 3 — Projects (needs Q-001, Q-006 answered first)
3. Phase 4 — Blog (needs Q-001)
4. Phase 5 — About, SEO, launch (needs Q-004, Q-005; content Q-002)

## Blocked

_Nothing blocking Phase 2._

## Deviations from spec

- **Tailwind v4** (what create-next-app installs): tokens live in `app/globals.css` `@theme`, not `tailwind.config.ts`. docs/UI.md + CLAUDE.md updated.
- **Next 16 `proxy.ts`** replaces `middleware.ts` (renamed upstream). docs/AUTH.md, ARCHITECTURE.md, BUILD.md updated.
- **react-grid-layout v2** API (`gridConfig`/`dragConfig`/`compactor`) instead of the v1 props in the snippet; not `bounded`. docs/DASHBOARD.md updated.
- **Phase-temporary:** `TILE_REGISTRY` is typed `{ [K in TileType]?: TileDef<K> }` and `TileDataMap` uses `null` for project/media/blog_feed until those types land; the editor implements only the Phase 1 subset of `useLayoutEditor` (no undo/redo, stacking order). Restore the full types as each phase registers its tiles.
- `src/lib/database.types.ts` not generated yet (needs the Supabase project); clients are untyped until then.
- Added a "Sign out" button under "View live site" in the dashboard sidebar (AUTH.md defines `signOut()` but no placement).

## Environment facts

- Next.js version: 16.4.0 (React 19.3, Tailwind 4.3, react-grid-layout 2.3, zod 4.6, @supabase/ssr 0.12). `cacheComponents` is **off** in `next.config.ts` so the spec's route-segment caching model (`revalidatePath`, `revalidate`, `dynamic`) applies.
- Vercel project: `reyansh` (team `reyanshmaxs-projects`) already exists.
- Supabase project ref: `jcyvcvbxumhgaxriztfe` (`reyansh-site`, us-west-1, created 2026-10-08). Migrations 0001–0002 applied; 4 layout rows + settings row verified. Advisors: `touch_updated_at` mutable search_path (WARN), `is_owner()` executable by anon/authenticated (WARN, needed by RLS; returns only the caller's own owner status).
- Production URL: `https://reyansh-rho.vercel.app` (Vercel alias; deploys READY from `main`; framework pinned to `nextjs` in `vercel.json` because the Vercel API returns 403 for project updates)

---

## Update protocol

Update this file when:
- a phase criterion passes → check its box;
- a phase completes → move it to Done with the date and any deviations;
- work stops mid-phase → set **Next action** to the exact next step (file + function + criterion), not a vague area;
- something blocks → add it under Blocked with its Q-ID;
- implementation diverges from a spec → log under Deviations AND update that spec doc in the same change (standing rule 2).
