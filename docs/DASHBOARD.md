# DASHBOARD.md — layout editor, content editors, media, settings

## Overview

Owner-only UI under `/admin`. Shell = 68px header + 232px sidebar (wireframes
DB 2–6). Sidebar items, in order: **Layout**, **Projects**, **Blog posts**,
**Media**, **Settings**, then "View live site ↗" pinned bottom. Every write goes
through a server action in `src/server/*` (docs/ARCHITECTURE.md).

## Non-goals

- No "Pages" or "Theme" sidebar items (dropped from wireframes — D-007, docs/UI.md).
- No collaborative editing, comments, or version history.
- No separate mobile layout editor (D-008) — only stacking order.
- No image cropping/filters; uploads are stored as given (after client-side resize, below).
- No bulk actions.

## Layout editor — `/admin/layout/[page]` (wireframe DB 2)

**Header:** breadcrumb `Dashboard / Page: <Home|About ▾>` (select switches route), mode toggle `Desktop | Stacking order`, Undo, Redo, save status text, **Preview** (opens `/admin/preview/<page>` in new tab), **Discard draft** (confirm dialog), **Publish** (accent).

**Canvas:** `GridEditor` wraps react-grid-layout:

```ts
<GridLayout
  cols={6} rowHeight={computedRowHeight} margin={[12, 12]}
  compactType={null} preventCollision isBounded
  draggableHandle=".tile-drag-handle"
  resizeHandles={['se']}
  layout={tiles.map(t => ({ i: t.id, ...t.pos, minW, minH, maxW, maxH }))}   // limits from TILE_REGISTRY
  onLayoutChange={applyPositions}
/>
```
- Canvas renders each tile with its real `Render` component (resolved data from the draft), scaled to fit, plus overlay chrome: drag handle `⋮⋮ <Type label>` top-left, `×` remove top-right (confirm only if tile has config content), resize corner.
- Click selects (3px `#2B44FF` outline + label chip `"<Type> · w×h"`). Esc deselects.
- Empty area shows a dashed "+ Add tile" cell at the first free 2×1 slot (scan rows top→bottom, cols left→right); clicking opens **Add tile modal**.
- Grid shows as many rows as `max(4, maxRowUsed + 1)` so there is always one free row.

**Add tile modal** (DB 3): search box + grid of the 9 types (label + description from registry). Select → "Add to grid" places it at the first free slot that fits its `defaultSize`; if none, appends at `y = maxRowUsed + 1, x = 0`. New tile gets `mobileOrder = tiles.length`.

**Inspector** (right, 380px) for the selected tile:
| Field | Control | Writes |
|---|---|---|
| Tile type | read-only text | — |
| Content | type's `Inspector` component | `config` |
| Size | W and H steppers clamped to registry min/max; disabled if the new size would collide | `pos.w`, `pos.h` |
| Color | 6 swatches (`TILE_COLORS`), `aria-label` = color name | `color` |
| Stickers | up to 2 rows: text input, rotation select (-8,-4,4,8), corner select; "+ Add sticker" | `stickers` |
| Hide on mobile | checkbox | `hideOnMobile` |
| Delete tile | outlined button | removes tile, re-packs `mobileOrder` to 0..n-1 |

Per-type Inspector content: hero (name, tagline); project (select of all projects incl. unpublished, labelled "(draft)"); text (eyebrow, heading, body textarea with char counter); media (MediaPicker + fit + caption); now (label + read-only preview of `now_text` with link "Edit in Settings"); marquee (word chips add/remove/reorder); links (heading + link "Edit in Settings"); blog_feed (count 1–5); timeline (heading + entry rows year/label/href, add/remove/reorder, max 10).

**Stacking order mode:** canvas switches to a single 390px-wide column showing tiles in `mobileOrder` as draggable rows, implemented with the same react-grid-layout (`cols=1`, `rowHeight=72`, each tile `h=1`) — do not add a second drag library. Hidden-on-mobile tiles show struck-through at the bottom. Reordering rewrites `mobileOrder`.

**State + saving:**
```ts
// src/components/admin/useLayoutEditor.ts
export function useLayoutEditor(page: PageSlug, initial: Tile[]): {
  tiles: Tile[]; selectedId: string | null;
  select(id: string | null): void;
  addTile(type: TileType): void;
  updateTile(id: string, patch: Partial<Omit<Tile, 'id' | 'type'>>): void;
  removeTile(id: string): void;
  applyPositions(rgl: { i: string; x: number; y: number; w: number; h: number }[]): void;
  reorderMobile(orderedIds: string[]): void;
  undo(): void; redo(): void; canUndo: boolean; canRedo: boolean;
  saveState: 'saved' | 'saving' | 'unsaved' | 'error';
};
```
- History: array of `Tile[]` snapshots, cap 50, cleared on page switch. Drag/resize pushes one snapshot on stop, not per frame.
- Autosave: debounce 1000ms after last change → `saveDraftLayout`. Status text: "Draft saved · h:mm a" / "Saving…" / "Unsaved changes" / "Couldn't save — retry" (click retries).
- Publish: flush pending save → `publishLayout`. On `ok:false` with `LayoutError[]`, show an error list in a toast and outline offending tiles red (`#FF5A36`, 3px). On success toast "Published" with link to live page.
- `beforeunload` warning while `saveState !== 'saved'`.

## Preview — `/admin/preview/[page]`

Renders `<TilePage page draft />` full width with a fixed top banner (ink bg, cream text, 44px): "Draft preview — not live" + "Back to editor".

## Projects manager — `/admin/projects` (DB 4)

Title + "+ New project" (→ `/admin/projects/new`). Tabs: All / Published / Drafts (client filter). Table columns: drag handle, cover thumb (56px), title + `/projects/<slug>`, category, status pill (Published | Draft), Featured switch (`setProjectFeatured`), updated date, Edit. Drag rows → `reorderProjects`. Footnote: "Drag to set order on the Projects page. Featured projects can fill the large tile."

## Project editor — `/admin/projects/[id]` (DB 5, body per D-010)

Left column form: Title, Slug (auto from title until edited manually, `src/lib/slug.ts` `slugify(s: string): string`), One-liner (140 counter), Category, Year, Status (`In progress | Shipped | Archived`), Role, Stack (chips), GitHub URL, Demo URL, Cover (MediaPicker, images only), Body (MarkdownEditor).
Right column: tile preview with S/M/L toggle (renders `project` tile `Render` at 1×1 / 2×1 / 2×2 with chosen color — color is preview-only; layout tiles own their color), Featured checkbox, Delete project.
Header buttons:
- Unpublished item: "Autosaved · time" (debounce 1500ms → `saveProject`), **Preview** (renders detail page in a modal), **Publish**.
- Published item: no autosave; "Unsaved changes" indicator, **Update** (→ `saveProject`), **Unpublish**.

## Posts — `/admin/posts/[id]` (DB 6)

Three panes: post list (340px: "+ New post", search, Drafts / Scheduled / Published groups, each item title + relative time), editor (title input 64px, excerpt input, MarkdownEditor), settings (360px: slug, category, related project select, cover MediaPicker, publish date picker, "Show in Home blog feed" checkbox, Delete post).
Header: save status, **Preview** (→ renders post page in modal), **Schedule** (enabled when publish date > now → `publishPost(id, iso)`), **Publish** (`publishPost(id, null)`). Published post: **Update** + **Unpublish**, same autosave rule as projects.

## MarkdownEditor — `src/components/admin/MarkdownEditor.tsx`

```ts
export function MarkdownEditor(props: { value: string; onChange: (v: string) => void; onUploadImage: (file: File) => Promise<{ url: string; alt: string }> }): JSX.Element
```
- CodeMirror 6 with markdown language, line wrapping, 18px mono.
- Toolbar (44px buttons): H2, Bold, Italic, Link, Code, Quote, Image, Math. Each wraps the selection (`**sel**`, `[sel](url)`, `` `sel` ``, `$sel$`, etc.); Image opens file picker → upload → inserts `![alt](url)`.
- Tabs: **Write | Preview | Split** (default Split ≥1440px wide, else Write). Preview uses the same `<Markdown>` as the public site (rendered via a server action `renderMarkdownPreview(md: string): Promise<string>` returning HTML, debounced 400ms).
- Footer: word count, `~N min read`.

## Media — `/admin/media`

Grid of thumbnails (images) and file rows (PDF). Upload button + drag-drop zone.
Upload pipeline (client): if image and not SVG/GIF → resize longest edge to 2400px, encode WebP q=0.85 (canvas) → upload with `createBrowserSupabase().storage.from('media').upload('img/<yyyy>/<mm>/<uuid>.webp', blob)` → `registerMedia(...)`. PDFs → `files/<uuid>-<slugified name>.pdf`. Alt text is required for images before the item can be picked anywhere (MediaPicker greys out items with empty alt).
Each item: copy URL, edit alt, delete (shows "Used in: …" and blocks if referenced).

## Settings — `/admin/settings`

Form: Now text (160), Email, GitHub URL, LinkedIn URL, Résumé (MediaPicker filtered to PDFs, stores `resume_path`). Save → `saveSettings`. How the résumé is surfaced on the public site (wireframe FE 4's "Download résumé" tile has no matching v1 tile type) is open — Q-004.

## Notes

- Dashboard is desktop-only: below 1024px show "Open the dashboard on a computer." with a link to the live site.
- All dashboard pages: `export const dynamic = 'force-dynamic'`.
- Toasts: bottom-right, 4s, one at a time.
