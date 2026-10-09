# UI.md — design tokens, page templates, responsive rules

## Overview

The public site uses the "H — loud color bento" direction (D-004):
cream page, saturated rounded tiles, ink outlines, tilted stickers, chunky
grotesque type. `design-reference/H-bento-pop.html` is the visual reference;
`wireframes/*.html` define what each screen contains. This doc is the
authority for every color, size and font — wireframes are grayscale on purpose.
The dashboard reuses the same fonts with a quieter palette.

## Non-goals

- No dark mode in v1.
- No user-selectable themes (wireframe sidebar "Theme" item is dropped).
- No animation library. CSS transitions only.
- No pixel-matching the wireframes; match their structure.

## Tokens — `app/globals.css` `@theme`

Tailwind v4 has no `tailwind.config.ts`; tokens are CSS variables in an
`@theme` block (`--color-cream`, `--color-admin-bg`, `--font-display`,
`--radius-tile`, `--spacing-page`, …), which generate the same utility names
(`bg-cream`, `bg-admin-bg`, `font-display`, `rounded-tile`, `px-page`). Values:

```ts
theme: {
  extend: {
    colors: {
      cream:  '#FFF4E4',   // page background
      ink:    '#111111',   // text, outlines, black tiles
      blue:   '#2B44FF',
      orange: '#FF5A36',
      green:  '#3DDC97',
      yellow: '#FFC93C',
      paper:  '#FFFFFF',
      // dashboard only
      admin: { bg: '#ECECE8', panel: '#F7F7F5', line: '#CFCFCA', muted: '#6B6B66', accent: '#2B44FF' },
    },
    fontFamily: {
      display: ['var(--font-bricolage)', 'sans-serif'],   // Bricolage Grotesque 500/700/800, next/font/google
      mono:    ['var(--font-dm-mono)', 'monospace'],       // DM Mono 400/500
    },
    borderRadius: { tile: '36px', inner: '22px', pill: '999px' },
    spacing: { gutter: '18px', page: '44px' },
  },
}
```

### Tile color → text color (contrast checked ≥ 4.5:1)

| `TileColor` | background | text | border | arrow-button bg / fg |
|---|---|---|---|---|
| blue | `#2B44FF` | `#FFFFFF` | none | `#FFFFFF` / `#111111` |
| orange | `#FF5A36` | `#111111` | none | `#111111` / `#FFFFFF` |
| green | `#3DDC97` | `#111111` | none | `#111111` / `#FFFFFF` |
| yellow | `#FFC93C` | `#111111` | none | `#111111` / `#FFFFFF` |
| white | `#FFFFFF` | `#111111` | `2.5px solid #111111` | `#111111` / `#FFFFFF` |
| black | `#111111` | `#FFF4E4` | none | `#FFF4E4` / `#111111` |

Expose as `src/lib/tokens.ts`:

```ts
export const TILE_STYLE: Record<TileColor, { bg: string; fg: string; border: string | null; btnBg: string; btnFg: string }>;
```

### Type scale (desktop ≥1024px)

| Use | Font | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Hero name | display | 128px / 0.86 | 800 | -0.05em |
| Page title (Projects, Blog, About) | display | 104px / 0.9 | 800 | -0.04em |
| Post title | display | 72px / 0.98 | 800 | -0.035em |
| Tile title L | display | 52px / 0.95 | 800 | -0.03em |
| Tile title M | display | 40px / 1 | 800 | -0.03em |
| Tile title S | display | 28px / 1.05 | 700 | -0.02em |
| Body | display | 20px / 1.5 | 500 | 0 |
| Post body | display | 20px / 1.65 | 500 | 0, max-width 68ch |
| Eyebrow / meta | mono | 13px / 1.4 | 500 | 0.02em, uppercase |
| Marquee | display | 44px | 800 | -0.02em |

Below 1024px: multiply display sizes ≥ 40px by 0.6, keep the rest.

### Stickers

`position: absolute`, 12px/20px padding, pill radius, `2.5px solid #111111`
border, 18px bold display text, background `#FFC93C` (on blue/green/orange/black
tiles) or `#FFFFFF` (on yellow/white tiles), `transform: rotate(<rotation>deg)`.
`corner: top-right` → `top: 32px; right: 32px`; `top-left` → `top: 32px; left: 32px`.
A second sticker on the same corner offsets by `top: +68px; right/left: +170px`.

### Interaction

- Clickable tiles: `transition: transform 150ms`; hover `translateY(-4px)`; focus-visible `outline: 3px solid #111111; outline-offset: 4px`.
- Marquee: CSS `@keyframes` translateX loop, 30s, paused under `prefers-reduced-motion: reduce`.
- All interactive targets ≥ 44×44px.

## Page shell

```
<SiteNav>  height 88px, page padding 44px:
  left: "RR" wordmark (display 800, 22px) → /
  right: pill links Home · Projects · About · Blog (active = ink bg, cream text), "Contact" = outlined pill → mailto:{site_settings.email}
<main>     padding 0 44px 44px
```
No footer on tile pages (Links tile covers contact). Blog, project and list pages get a 1-line footer: `© {year} Reyansh Rastogi` + GitHub/LinkedIn links from `site_settings`.

## Tile grid (Home, About)

```css
.tile-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-auto-rows: max(180px, calc((100vh - 88px - 44px - 3 * 18px) / 4));
  gap: 18px;
}
.tile { grid-column: calc(x + 1) / span w; grid-row: calc(y + 1) / span h; border-radius: 36px; }
```
At 1920×1080 this gives 4 rows of ~223px, matching the H reference.

### Mobile stacking (< 1024px) — D-008

- `display: flex; flex-direction: column; gap: 14px`, page padding 16px, nav collapses to wordmark + "Menu" button opening a full-width sheet with the same links.
- Tiles sorted by `mobileOrder` (CSS `order` on the same DOM as the desktop grid); tiles with `hideOnMobile` are hidden by CSS immediately and removed from the DOM after hydration (static pages can't know the viewport server-side).
- Each tile: `width: 100%`, `min-height: TILE_REGISTRY[type].mobileMinHeight`, height = content.

| Type | mobileMinHeight |
|---|---|
| hero | 420 |
| project | 200 (feature variant: 360) |
| text | 160 |
| media | 280 |
| now | 140 |
| marquee | 96 |
| links | 240 |
| blog_feed | 280 |
| timeline | 320 |
| resume | 120 |

## Page templates (fixed, not tile-editable — D-007)

Structure follows the wireframe of the same name; all tiles use `TILE_STYLE`.

- **/projects** (`wireframes/WfProjects.html`): title "Projects" + category filter pills (client-side filter, `?c=<category>` in URL). Grid `repeat(4, 1fr)`. Sort: `featured desc, sort_order asc`. First featured project spans 2 columns with cover left + text right. Last cell: black CTA tile "Want to build something together?" → mailto. Colors (spec was silent; owner may change): featured card orange, other cards white with ink border, missing cover = yellow block with the title's initial.
- **/projects/[slug]** (`WfProjectDetail.html`): left 2/6 = header tile (category pills, title, one-liner, dl of Role/Year/Stack/Status, GitHub + Demo pill buttons — hidden if URL null). Right 4/6 = cover image (yellow placeholder tile with project initial if none). Below, full width: rendered `body_md` in a white tile, max-width 68ch centered. Bottom: "Next project →" black tile (next by `sort_order`, wraps around). Header tile is blue (spec was silent). With a `video_url` (D-027) the right 4/6 shows the YouTube/Vimeo embed instead of the cover.
- **/blog** (`WfBlog.html`): title "Blog" + category pills. Grid 6 cols × 2 rows: latest post 3×2 (cover + meta + title + excerpt); next two posts 2×1 each; "Older posts" 1×2 list of up to 6 titles + "View archive" (→ `/blog?page=2`, 12 per page, plain list layout).
- **/blog/[slug]** (`WfBlogPost.html`): 3 columns `300px | minmax(0,860px) | 340px`. Left rail: back link, meta card (date, read time, category, related project link), Copy link button. Center: title, excerpt, optional cover, body. Right rail (sticky top 24px): "On this page" TOC from `##`/`###` headings, then "Next post →" black tile (next older post; hidden if none). Below 1024px rails move under the article. Colors (spec was silent; owner may change): `/blog` latest post blue, next two yellow then green, Older posts list white with ink border; post meta card and TOC white with ink border, Next post black. Category filter and pagination are client-side (`?c=`, `?page=`), like `/projects`. Post title class `.t-post-title`.
- **404**: cream page, black tile "Nothing here." + link Home. Implemented as `app/not-found.tsx` (nav + tile), also used by `notFound()` from `[slug]` pages.
- **Share images (D-032)**: `og:image` = cover when the project/post has one, else `/api/og?title=…`: 1200×630, cream margin, blue tile, "RR" top, title in Bricolage 800, "Reyansh Rastogi" bottom. Static pages (Home, About, Projects, Blog) use the generated card. Helpers in `src/lib/site.ts` (`pageMetadata`, `shareImage`).

## Markdown rendering — `src/components/site/Markdown.tsx`

```ts
export function Markdown(props: { source: string }): JSX.Element  // server component
```
- remark-gfm, remark-math → rehype-katex, rehype-slug, rehype-pretty-code (theme `github-dark`, D-028), no `rehype-raw`; raw HTML in the source is shown as literal text.
- Implemented as one `unified` pipeline (remark-parse → … → rehype-stringify) in `src/lib/markdown.ts`, shared by `<Markdown>` and the editor's `renderMarkdownPreview` action, instead of react-markdown: rehype-pretty-code is async and the preview action needs an HTML string. Same plugin set.
- `h2` 36px/800, `h3` 26px/700, links underlined ink, inline code mono on `#FFF4E4`, code blocks 20px radius ink bg, images full width radius 22px with alt required.

## Notes

- Images use `next/image` with `remotePatterns` for `<project>.supabase.co/storage/v1/object/public/media/**`.
- Fonts via `next/font/google` in `app/layout.tsx`, `display: 'swap'`.
- `lang="en"`, every page sets `<title>` = `"<Page> — Reyansh Rastogi"`.
