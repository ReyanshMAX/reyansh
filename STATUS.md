# Status

**Last updated:** 2026-10-08
**Current phase:** 1 of 5 — Owner logs in, places one text tile, publishes, it's live on Vercel
**Next action:** Phase 1 code is written and builds. Remaining work is infrastructure (docs/DEPLOY.md "First-time setup" steps 2–7): create the Supabase project, apply `supabase/migrations/0001`–`0002`, configure GitHub OAuth + URL allowlist, set the 4 env vars on the existing Vercel project `reyansh`, deploy, bootstrap the owner, then verify criteria 2–9 against production.

---

## Done

_No phase complete yet. Specs and wireframes generated 2026-10-07._

## In progress

- **Phase 1 — Owner logs in, places one text tile, publishes, it's live on Vercel**
  - [x] `npm run build` succeeds with an empty database (verified 2026-10-08 with no Supabase reachable at all: queries degrade to `[]`, `/` prerenders static)
  - [ ] Production `/` returns 200 with nav + empty grid
  - [ ] Signed-out `/admin/layout/home` redirects to `/admin/login`
  - [ ] Non-owner GitHub sign-in → `?error=not_owner`
  - [ ] Owner sign-in → `/admin/layout/home`
  - [ ] Text tile autosaves and persists across reload
  - [ ] Publish makes the tile appear on production `/`, not before
  - [ ] Keep-alive cron returns 200 with secret, 401 without
  - [ ] `saveDraftLayout` rejects out-of-bounds tile — `validateLayout` returns `{ code: 'bounds' }` for `x:5,w:2` (checked locally); end-to-end call through the action still needs a signed-in owner
  - Code written (unverified until deployed): migrations 0001–0002, `proxy.ts` gate, `/auth/callback`, `/admin/login`, `requireOwner`/`signOut`, layout editor for `home` (drag/resize canvas, Add tile modal with Text, text inspector, 1s autosave, Publish with error outlines), `TilePage`, `SiteNav`, keep-alive route, `vercel.json`

## Next up

1. Phase 2 — Full Home in the H style
2. Phase 3 — Projects (needs Q-001, Q-006 answered first)
3. Phase 4 — Blog (needs Q-001)
4. Phase 5 — About, SEO, launch (needs Q-004, Q-005; content Q-002)

## Blocked

- Phase 1 criteria 2–9 need the Supabase project + Vercel env vars + GitHub OAuth app (owner action / approval).

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
- Supabase project ref: _(record after creation)_
- Production URL: _(record after first Vercel deploy)_

---

## Update protocol

Update this file when:
- a phase criterion passes → check its box;
- a phase completes → move it to Done with the date and any deviations;
- work stops mid-phase → set **Next action** to the exact next step (file + function + criterion), not a vague area;
- something blocks → add it under Blocked with its Q-ID;
- implementation diverges from a spec → log under Deviations AND update that spec doc in the same change (standing rule 2).
