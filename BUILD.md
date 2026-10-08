# Build Plan

Phases are vertical slices. Each one runs end to end when complete.

On finishing a phase: verify every acceptance criterion, then update STATUS.md
before starting the next phase. Check off individual criteria in STATUS.md as
they pass, not at the end.

---

## Phase 1 — Owner logs in, places one text tile, publishes, it's live on Vercel

**Scope**
- Next.js scaffold, Tailwind, fonts (docs/UI.md tokens can be partial).
- Supabase project, migrations 0001 + 0002.
- GitHub sign-in, callback, middleware gate, owner bootstrap (docs/AUTH.md).
- `TILE_REGISTRY` with **only** the `text` type; `tileSchema`, `validateLayout`.
- Layout editor for `home` with: grid canvas (drag + resize), Add tile (text only), inspector for text config, autosave draft, Publish.
- `TilePage` public render of Home at `/`.
- Deployed to Vercel with all env vars; keep-alive cron route + `vercel.json`.

**Non-goals for this phase**
- Other tile types, colors beyond the default, stickers, mobile stacking, undo/redo, preview route, About page, media, projects, posts.

**Interface contracts established**
```
src/lib/tiles.ts         Tile, TileType, TileColor, GridPos, Sticker, TileConfigMap (full types, even though only 'text' is registered)
src/lib/schemas.ts       tileSchema, layoutTilesSchema
src/tiles/registry.ts    TileDef<K>, TILE_REGISTRY
src/tiles/validate.ts    validateLayout(tiles: unknown)
src/tiles/resolve.ts     resolveTileData(tiles, opts)
src/server/result.ts     ActionResult<T>
src/server/auth.ts       requireOwner(), signOut()
src/server/layouts.ts    getDraftLayout, saveDraftLayout, publishLayout
src/server/queries.ts    getPublishedLayout(page)
src/components/site/TilePage.tsx   TilePage({ page, draft? })
```

**Acceptance criteria**
- [ ] `npm run build` succeeds with an empty database.
- [ ] Production URL `/` returns 200 and shows the nav and an empty grid before anything is published.
- [ ] Visiting `/admin/layout/home` signed out redirects to `/admin/login`.
- [ ] Signing in with a GitHub account not in `app_owner` lands on `/admin/login?error=not_owner` showing "This dashboard is private."
- [ ] After the owner bootstrap, signing in lands on `/admin/layout/home`.
- [ ] Adding a text tile, typing a heading, and waiting 1s shows "Draft saved"; reloading the editor shows the tile in the same position.
- [ ] Before Publish, the production `/` still shows no tile. After Publish, reloading production `/` shows the tile at the dragged position.
- [ ] `curl -H "Authorization: Bearer $CRON_SECRET" <prod>/api/cron/keepalive` returns `200 {"ok":true,...}`; without the header returns 401.
- [ ] Calling `saveDraftLayout('home', [{ type: 'text', pos: { x: 5, y: 0, w: 2, h: 1 } ... }])` returns `{ ok: false }` with a `bounds` error.

**Depends on:** none

---

## Phase 2 — Full Home in the H style, with every non-content tile type

**Scope**
- Complete docs/UI.md tokens, `TILE_STYLE`, SiteNav, stickers, hover/focus, marquee animation, mobile stacking (<1024px).
- Migration 0003 (media + storage). Media page: upload pipeline, alt text, delete with reference check. MediaPicker.
- Settings page (now text, email, GitHub, LinkedIn, résumé path).
- Tile types: hero, text, media, now, marquee, links (each Render + Inspector).
- Editor: color swatches, size steppers, stickers, hide on mobile, delete; Stacking order mode; undo/redo; Discard draft; Preview route; publish error highlighting.

**Non-goals for this phase**
- project, blog_feed, timeline tiles; About page; projects; posts.

**Interface contracts established**
```
src/lib/tokens.ts             TILE_STYLE
src/server/media.ts           registerMedia, updateMediaAlt, deleteMedia
src/server/settings.ts        saveSettings
src/server/queries.ts         getSettings()
src/components/admin/useLayoutEditor.ts   (full hook per DASHBOARD.md)
src/components/admin/MediaPicker.tsx      MediaPicker({ kind: 'image' | 'file', value: string | null, onChange })
```

**Acceptance criteria**
- [ ] At 1920×1080, a published Home recreating the H reference layout (hero 3×2, media 1×2, text tiles, marquee 3×1, links 1×2) fills exactly one viewport with no scrollbar.
- [ ] At 390px width, tiles render as one column in `mobileOrder`; a tile with "Hide on mobile" checked is absent from the DOM.
- [ ] Each of the 6 tile colors renders with the text color in docs/UI.md (spot-check with devtools contrast ≥ 4.5:1).
- [ ] Uploading a 6000×4000 JPEG stores a WebP ≤ 2400px on the long edge in bucket `media`; the image appears in a media tile after publish.
- [ ] Deleting a media item used by a tile is refused with a message naming the page.
- [ ] Changing Now text in Settings updates every Now tile on `/` after save (no re-publish needed).
- [ ] Undo after a drag restores the previous position; Redo re-applies it.
- [ ] `/admin/preview/home` shows unpublished draft changes with the "Draft preview — not live" banner; `/` does not.
- [ ] With `prefers-reduced-motion: reduce`, the marquee does not animate.

**Depends on:** Phase 1

---

## Phase 3 — Projects: manage, write, list, detail, and project tiles

**Scope**
- Migration 0004. Resolve Q-001 (project categories) and Q-006 (video) first.
- Projects manager (reorder, featured, publish state), project editor with MarkdownEditor, autosave/Update rules (D-012).
- Public `/projects` and `/projects/[slug]` per docs/UI.md, `<Markdown>` renderer.
- `project` tile (3 size variants) in the registry.

**Non-goals for this phase**
- Posts, blog_feed, About page, OG images.

**Interface contracts established**
```
src/server/projects.ts            (all signatures in ARCHITECTURE.md)
src/server/queries.ts             listPublishedProjects, getPublishedProject
src/components/site/Markdown.tsx  Markdown({ source })
src/components/admin/MarkdownEditor.tsx
src/lib/slug.ts                   slugify(s: string): string
src/lib/categories.ts             PROJECT_CATEGORIES
```

**Acceptance criteria**
- [ ] Creating a project, publishing it, and opening `/projects/<slug>` on production shows title, one-liner, meta list, and rendered Markdown including a fenced code block, a GFM table, and `$e^{i\pi}+1=0$` as KaTeX.
- [ ] An unpublished project returns 404 at its public URL and is absent from `/projects`.
- [ ] Editing a published project and clicking Update changes the live page within one reload; typing without clicking Update does not.
- [ ] Dragging project rows in the manager changes the order on `/projects`.
- [ ] A Home `project` tile at 1×1, 2×1 and 2×2 renders the compact, row and feature variants; clicking it navigates to the detail page.
- [ ] Unpublishing a project referenced by a Home tile removes that tile from the live Home (cell empty) after revalidation, and Publish of the Home layout reports `missing_ref`.
- [ ] Markdown containing `<script>alert(1)</script>` renders as text, not HTML.

**Depends on:** Phase 2

---

## Phase 4 — Blog: write, schedule, read, and the Home blog feed

**Scope**
- Migration 0005. Resolve Q-001 (blog categories) first.
- Post editor (3 panes), Schedule/Publish/Update/Unpublish.
- Public `/blog` (with pagination `?page=N`, category filter) and `/blog/[slug]` with TOC and Next post.
- `blog_feed` tile.

**Non-goals for this phase**
- Newsletter, RSS, comments, view counts (D-013, D-014).

**Interface contracts established**
```
src/server/posts.ts            (signatures in ARCHITECTURE.md)
src/server/queries.ts          listLivePosts, getLivePost
src/lib/categories.ts          BLOG_CATEGORIES
```

**Acceptance criteria**
- [ ] Publishing a post makes it appear on `/blog`, at `/blog/<slug>`, and in a Home `blog_feed` tile without re-publishing the Home layout.
- [ ] A post scheduled 5 minutes ahead returns 404 before that time and is live within 1 hour after (revalidate 3600).
- [ ] Unchecking "Show in Home blog feed" removes the post from the blog_feed tile but not from `/blog`.
- [ ] The TOC lists every `##`/`###` heading and each link scrolls to its section.
- [ ] `/blog?page=2` lists posts 13–24 when ≥ 13 live posts exist.
- [ ] Read time shown equals `max(1, round(words / 220))`.

**Depends on:** Phase 3

---

## Phase 5 — About page, timeline, SEO, launch

**Scope**
- Resolve Q-004 (résumé) and Q-005 (OG images).
- `timeline` tile; About as the second tile page (page selector in editor).
- sitemap, robots, metadata, 404 page, dashboard "use a computer" guard.
- Launch checklist with real content (Q-002) and domain (Q-003, optional).

**Non-goals for this phase**
- Any tile type not in D-009 (except a résumé tile if Q-004 picks it).

**Interface contracts established**
```
app/sitemap.ts, app/robots.ts
src/tiles/timeline/{Render,Inspector}.tsx
```

**Acceptance criteria**
- [ ] `/about` renders its own published layout; editing About's draft does not change `/`.
- [ ] A timeline tile with 4 entries renders them in order; entries with `href` are links.
- [ ] `/sitemap.xml` lists every published project and live post and no drafts; `/robots.txt` disallows `/admin`.
- [ ] Unknown routes render the custom 404 with status 404.
- [ ] Lighthouse (mobile) on `/`: Performance ≥ 90, Accessibility ≥ 95.
- [ ] No `[PLACEHOLDER]`-style text remains on any public page.

**Depends on:** Phase 4
