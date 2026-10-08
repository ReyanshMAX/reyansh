# Status

**Last updated:** 2026-10-07
**Current phase:** 1 of 5 — Owner logs in, places one text tile, publishes, it's live on Vercel
**Next action:** Scaffold Next.js in the repo root per docs/DEPLOY.md "First-time setup" step 1, then work toward Phase 1 criterion 1 (`npm run build` succeeds with an empty database).

---

## Done

_Nothing yet. Specs and wireframes generated 2026-10-07._

## In progress

- **Phase 1 — Owner logs in, places one text tile, publishes, it's live on Vercel**
  - [ ] `npm run build` succeeds with an empty database
  - [ ] Production `/` returns 200 with nav + empty grid
  - [ ] Signed-out `/admin/layout/home` redirects to `/admin/login`
  - [ ] Non-owner GitHub sign-in → `?error=not_owner`
  - [ ] Owner sign-in → `/admin/layout/home`
  - [ ] Text tile autosaves and persists across reload
  - [ ] Publish makes the tile appear on production `/`, not before
  - [ ] Keep-alive cron returns 200 with secret, 401 without
  - [ ] `saveDraftLayout` rejects out-of-bounds tile

## Next up

1. Phase 2 — Full Home in the H style
2. Phase 3 — Projects (needs Q-001, Q-006 answered first)
3. Phase 4 — Blog (needs Q-001)
4. Phase 5 — About, SEO, launch (needs Q-004, Q-005; content Q-002)

## Blocked

_Nothing blocking Phase 1._

## Deviations from spec

_None._

## Environment facts

- Next.js version: _(record after scaffold)_
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
