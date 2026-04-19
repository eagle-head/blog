# Eduardo Kohn — Blog Visual Design Brief

- **Date:** 2026-04-19
- **Status:** Approved (visual brainstorm phase)
- **Companion spec:** `2026-04-19-eduardokohn-blog-design.md` (architecture)
- **Feeds:** this brief provides the exact tokens, typography, spacing, and
  component specifications that implementation plans reference when building
  layouts and styles. It replaces the placeholder tokens in Plan 01
  (`src/styles/global.css`) with concrete values.

---

## 1. Summary of Decisions

Nine decisions were locked through visual comparison sessions:

1. **Personality** — Modern Editorial (magazine-like sans-serif, bold titles,
   high contrast, clear hierarchy).
2. **Light-mode accent** — Academic Wine `#9d174d`.
3. **Dark-mode palette** — Nordic Muted (Polar Night background `#2e3440` with
   Frost accent `#88c0d0`). Light and dark modes use independent palettes by
   design.
4. **Post layout** — Classic Centered (single ~640px column with header, body,
   and footer stacked; mobile-identical to desktop).
5. **Paper layout** — Tufte Margin (main column ~600px + right margin ~220px for
   sidenotes / footnotes / citations; collapses to single column below 900px
   viewport).
6. **Home layout** — Magazine Grid (featured piece in 2fr column with soft
   gradient background + sidebar in 1fr column with Recent Posts and Tags).
7. **Semantic blocks** (theorem / definition / proof / lemma) — Accent Box
   (tinted background + left border, label in uppercase with monospace number,
   italic body for theorems/definitions/lemmas, upright body for proofs, QED `∎`
   inline).
8. **Code blocks** — Dark Always (GitHub Dark palette in both page modes,
   traffic-light header with filename + language tag).
9. **Inline code** — Tinted chip (small rose-tinted pill in light mode,
   Frost-tinted pill in dark mode — never dark in light mode).

## 2. Typography

### 2.1 Fonts

- **Sans-serif (body, headings, UI):** Inter variable, self-hosted via
  `@fontsource-variable/inter`. Weight axis 400–800 used.
- **Monospace (code, numbers, kbd, tags):** JetBrains Mono variable, self-hosted
  via `@fontsource-variable/jetbrains-mono`. Weight 400–700.
- **Serif:** not used anywhere (the design intentionally avoids mixing serif
  into the magazine aesthetic; semantic blocks use italic sans instead of serif
  for the theorem/definition body).

### 2.2 Type scale

The scale is compact — informative CS content reads best at smaller sizes on
long-form pages. The 14px body is comfortable in Inter with 1.65 line-height and
680px max measure.

- `--text-3xl`: 36px / 1.08 / -0.025em (home hero tagline)
- `--text-2xl`: 28px / 1.08 / -0.025em (paper/post title)
- `--text-xl`: 20px / 1.15 / -0.02em (home magazine-grid sub-header)
- `--text-lg`: 17px / 1.2 / -0.01em (paper H2, post H2 — wine underline)
- `--text-base`: 14px / 1.65 / 0 (body prose)
- `--text-sm`: 13px / 1.55 / 0 (author line, entry descriptions)
- `--text-xs`: 12.5px / 1.6 / 0 (code block body, abstract inside box)
- `--text-2xs`: 11px / 1.5 / 0.08em (meta labels, tag chips, sidenotes)
- `--text-3xs`: 10px / 1.5 / 0.18em (uppercase label chips "PAPER", "POST")

### 2.3 Weights

- `--weight-regular`: 400 (body, captions)
- `--weight-medium`: 500 (author name, emphasized meta)
- `--weight-semibold`: 600 (inline code, tag pills, subtle emphasis)
- `--weight-bold`: 700 (labels, h3, `<b>` inside prose)
- `--weight-extrabold`: 800 (h1, h2, logo, nav-emphasis, chip labels)

### 2.4 Line heights

- `--leading-tight`: 1.08 (large display titles)
- `--leading-snug`: 1.2 (H2/H3, entry titles)
- `--leading-normal`: 1.5 (compact meta, sidenotes)
- `--leading-relaxed`: 1.65 (body prose)
- `--leading-loose`: 1.75 (code blocks — easier to scan multi-line code)

### 2.5 Letter-spacing

- `--tracking-tight`: -0.025em (H1, tagline)
- `--tracking-snug`: -0.02em (H1 wordmark, H2)
- `--tracking-normal`: 0 (body, default)
- `--tracking-wide`: 0.08em (small meta labels)
- `--tracking-wider`: 0.18em (uppercase chip labels "PAPER", "POST")

## 3. Color System

Tokens below apply to both modes. Values in the table are authoritative — Plan
01 `global.css` uses them verbatim.

**Light mode** (default, no `data-theme` attribute OR `data-theme="light"`):

- `--color-bg`: `#ffffff` — page background
- `--color-fg`: `#0a0a0a` — primary text and titles
- `--color-text`: `#262626` — body prose (slightly softer than fg)
- `--color-muted`: `#737373` — secondary text, captions, meta
- `--color-border`: `#e5e5e5` — horizontal rules, card borders, footers
- `--color-border-soft`: `#f0f0f0` — subtle separators between entries
- `--color-accent`: `#9d174d` — Wine. Headings underline, tag outlines, link
  color, tag `#` prefix, quote line, chip PAPER/POST label, theorem box border,
  sidenote border
- `--color-accent-soft`: `rgba(157, 23, 77, 0.06)` — theorem box fill,
  inline-code ring backup (falls back to bg-inline)
- `--color-accent-2`: `#2563eb` — Definition box border and label
- `--color-accent-2-soft`: `rgba(37, 99, 235, 0.06)` — Definition box fill
- `--color-kbd-bg`: `#f5f5f5` — keyboard hint `⌘K` background
- `--color-kbd-border`: `#d4d4d4` — keyboard hint border
- `--color-abstract-bg`: `#f0f0f0` — abstract box fill (alias of border-soft)
- `--color-bg-inline`: `#fef2f2` — inline code chip background (rose-50)
- `--color-border-inline`: `#fce7f3` — inline code chip border (rose-100)
- `--color-text-inline`: `#9d174d` — inline code text (accent)
- Code-block tokens (identical in both modes — Dark Always):
  - `--color-code-bg`: `#0d1117`
  - `--color-code-fg`: `#c9d1d9`
  - `--color-code-head-bg`: `#161b22`
  - `--color-code-border`: `#161b22`
  - Syntax tokens (GitHub Dark mapping):
    - keyword `#ff7b72`
    - function `#d2a8ff`
    - string `#a5d6ff`
    - number `#79c0ff`
    - comment `#8b949e` (italic)
    - variable / identifier `#ffa657`

**Featured-entry gradient (home magazine grid only):**

- `--gradient-featured`: `linear-gradient(135deg, #fdf2f8 0%, #fef3c7 100%)` —
  soft rose to amber diagonal wash
- `--color-border-featured`: `#fbcfe8` — featured card border
- `--color-featured-chip`: `#9d174d`

**Dark mode** (`[data-theme="dark"]` on `<html>`):

- `--color-bg`: `#2e3440` — Polar Night 0 (main background)
- `--color-fg`: `#eceff4` — Snow (titles, primary text)
- `--color-text`: `#d8dee9` — Snow darker (body prose)
- `--color-muted`: `#8892a5` — Frost-neutral muted
- `--color-border`: `#3b4252` — Polar Night 1 (horizontal rules, borders)
- `--color-border-soft`: `#353a48` — slightly lighter than PN1 for subtle
  separators
- `--color-accent`: `#88c0d0` — Frost 3 (Nordic accent)
- `--color-accent-soft`: `rgba(136, 192, 208, 0.08)` — theorem box fill
- `--color-accent-2`: `#81a1c1` — Frost 2 (Definition box — slightly darker to
  differentiate from main accent)
- `--color-accent-2-soft`: `rgba(129, 161, 193, 0.08)`
- `--color-kbd-bg`: `#3b4252`
- `--color-kbd-border`: `#4c566a` — Polar Night 3
- `--color-abstract-bg`: `#353a48`
- `--color-bg-inline`: `rgba(136, 192, 208, 0.12)` — Frost-tinted
- `--color-border-inline`: `rgba(136, 192, 208, 0.2)`
- `--color-text-inline`: `#88c0d0`
- Code-block tokens: identical to light-mode (Dark Always) — GitHub Dark palette
  in both modes.

**Featured-entry gradient in dark:**

- `--gradient-featured`:
  `linear-gradient(135deg, rgba(136,192,208,0.08) 0%, rgba(235,203,139,0.06) 100%)`
  — softer Frost/Aurora wash on Polar Night
- `--color-border-featured`: `rgba(136, 192, 208, 0.3)`

### 3.1 Semantics of accent use

- **Wine in light / Frost in dark** is the universal accent. It appears in: h2
  underline, entry meta `PAPER`/`POST`/`FEATURED` labels, tag pill outlines and
  `#` prefix, `§N` heading numbers, theorem box border, proof QED marker,
  sidenote border, link color, inline code text, RSS/newsletter chips, featured
  card hover/emphasis.
- **Accent-2 (blue in light / Frost-2 in dark)** is reserved for **Definition**
  semantic blocks only. This is the single differentiator across semantic block
  types.
- **Muted gray** is for Proof semantic blocks (to downplay relative to
  theorems/definitions — proofs are frequent and should not compete with the
  statements they prove).

## 4. Spacing System

Base unit: 4px. All spacing is a multiple.

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px
- `--space-16`: 64px

### 4.1 Content widths

- `--measure-prose`: 640px — Classic Centered posts, home sub-header, sections
  inside Tufte main column
- `--measure-tufte-total`: 980px — Tufte two-column grid total (main + gap +
  side)
- `--measure-tufte-main`: `minmax(0, 1fr)` inside the 980px grid (main column
  auto-sizes)
- `--measure-tufte-side`: 220px (fixed sidebar for sidenotes)
- `--measure-magazine`: 1040px — Magazine grid (2fr / 1fr columns, 32px gap)
- `--measure-hero`: 720px — Home hero section (if used; currently magazine grid
  replaces this)

### 4.2 Component paddings

- Header / footer horizontal padding: `--space-8` (32px)
- Paper / Post body section padding top: `--space-6` (24px)
- Semantic block padding: `--space-3 --space-4` (12px 16px)
- Code block body padding: `--space-3 --space-4`
- Code block head padding: `--space-1 --space-4` (6px 14px — slightly tighter
  vertically)
- Abstract box padding: `--space-3 --space-4`
- Tag pill padding: `2px 8px` (inline — 2px top/bottom, 8px left/right)
- Inline code padding: `1px 6px`

### 4.3 Border radii

- `--radius-sm`: 3px — inline code chip, tag pill interior, kbd hint
- `--radius-md`: 4px — semantic blocks, abstract box
- `--radius-lg`: 6px — code block, featured card
- `--radius-pill`: 999px — tag pill exterior

## 5. Component Specifications

Each component below should be implemented as an Astro component
(`src/components/...`) that consumes the tokens above.

### 5.1 Tag pill — `<Tag>`

```astro
<!-- outlined pill with # prefix -->
<a class="tag" href="/tags/sorting">sorting</a>
```

- Text: `--text-2xs` (11px), mono, `--weight-semibold`, lowercase
- Color: `--color-accent`
- Border: 1px solid `--color-accent`
- Background: transparent
- Padding: 2px 8px
- Border-radius: `--radius-pill`
- Prefix: `::before { content: '#'; opacity: 0.5; margin-right: 2px; }`
- Gap between tags: `--space-2` (8px)

### 5.2 Meta chip — `<MetaChip kind="paper|post|featured">`

Uppercase label above the title. Example: `PAPER · MARCH 14, 2026 · 12 MIN`.

- Text: `--text-3xs` (10px), `--weight-extrabold`
- Letter-spacing: `--tracking-wider` (0.18em)
- Text-transform: uppercase
- Color: `--color-accent`
- Margin-bottom: `--space-2`

### 5.3 Keyboard hint — `<Kbd>⌘K</Kbd>`

- Text: `--text-2xs`, mono, `--color-muted`
- Background: `--color-kbd-bg`
- Border: 1px solid `--color-kbd-border`
- Border-radius: `--radius-sm`
- Padding: 1px 5px

### 5.4 Abstract box (papers only)

- Surround the abstract paragraph with a div.
- Text: `--text-sm` (13.5px), `--leading-normal` (1.55)
- Color: `--color-text`
- Background: `--color-abstract-bg`
- Border-radius: `--radius-md`
- Padding: `--space-3 --space-4` (12px 16px)
- The word "Abstract." appears inline at the start in `--weight-bold`
  `--color-fg`.

### 5.5 Semantic block — `<Theorem> <Definition> <Proof> <Lemma>`

Shared pattern:

- Display block, margin `--space-4 0` (14px 0)
- Padding: `--space-3 --space-4`
- Border-left: 3px solid (type-dependent)
- Border-radius: `--radius-md`
- Background: type-dependent soft accent

Label (first line inside the block):

- Display block, margin-bottom: `--space-1`
- Text: `--text-2xs` (10.5px), `--weight-extrabold`
- Letter-spacing: `--tracking-wide` (0.08em)
- Text-transform: uppercase
- Color: matches border-left
- Includes a `<span class="num">` with mono number (e.g. `2.1`) before the label
  text.

Body:

- Text: `--text-xs` (13.5px), `--leading-normal` (1.6)
- Color: `--color-text`
- Font-style: italic for Theorem / Definition / Lemma
- Font-style: normal for Proof
- QED `∎` appears inline at the end of Proof body, font-style normal, color
  `--color-muted`, margin-left `--space-2`, mono.

Type mapping:

| Component      | Border & label color                | Background              |
| -------------- | ----------------------------------- | ----------------------- |
| `<Theorem>`    | `--color-accent` (Wine / Frost)     | `--color-accent-soft`   |
| `<Definition>` | `--color-accent-2` (Blue / Frost-2) | `--color-accent-2-soft` |
| `<Proof>`      | `--color-muted`                     | `--color-border-soft`   |
| `<Lemma>`      | `--color-accent`                    | `--color-accent-soft`   |

Numbering: per-article, auto-incremented via `remark-directive` handler.
Definitions, theorems, and lemmas share one counter (mathematical convention);
proofs do not bump the counter.

### 5.6 Code block — `<CodeBlock>`

Rendered via Shiki (`github-dark` theme) wrapped in a container that adds the
header chrome.

- Outer: `display: block`, `background: --color-code-bg`,
  `border-radius: --radius-lg`, `overflow: hidden`, `margin: --space-4 0`,
  `border: 1px solid --color-code-border`.
- Head: flex row, padding 6px 14px, background `--color-code-head-bg`,
  border-bottom 1px solid `#21262d` (stays constant across modes).
  - Left: traffic-light dots (3 × 8px: `#ff5f57`, `#febc2e`, `#28c840`) with 6px
    gap, then filename in `--color-code-fg` mono `--text-2xs`.
  - Right: language tag in `--color-muted` mono `--text-2xs`, uppercase,
    `--tracking-wide`.
- Body: padding 12px 16px, mono `--text-xs` (12.5px), `--leading-loose` (1.7),
  `overflow-x: auto`.
- Filename and language are extracted from the MDX meta string (e.g.
  ` ```ts partition.ts ` → lang `ts`, file `partition.ts`).

### 5.7 Inline code

CSS selector: `:not(pre) > code`.

- Font: mono `--text-xs` (12.5px), `--weight-semibold`
- Color: `--color-text-inline`
- Background: `--color-bg-inline`
- Border: 1px solid `--color-border-inline`
- Border-radius: `--radius-sm`
- Padding: 1px 6px

### 5.8 Sidenote (Tufte layout, papers only)

- Inside `<aside class="sidenotes">` in the right rail.
- Each sidenote: block, border-left 2px solid `--color-accent`, padding-left
  10px, margin-bottom 14px.
- Text: `--text-2xs` (10.5px), `--color-muted`, `--leading-normal`.
- Number marker: `.sn-num` class — mono, `--color-accent`, `--weight-bold`,
  `--text-2xs`, margin-right 4px.
- In-text reference: `<sup>`, mono, `--color-accent`, `--weight-bold`, size
  ~8.5px, margin-left 1px.

### 5.9 References section (papers only)

- Placed at the end of the article body, before the footer.
- Border-top: 1px solid `--color-border`, padding-top `--space-3`, margin-top
  `--space-5`.
- Heading: "References" in `--text-sm`, `--weight-extrabold`, uppercase,
  `--tracking-wide`, `--color-accent`, margin-bottom `--space-2`.
- Ordered list, padding-left `--space-6`, each `<li>` `--text-2xs` (11.5px),
  `--color-text`, `--leading-normal`, margin-bottom `--space-1`.

### 5.10 Section heading `<h2>` with `§N` numbering

Papers and posts both use numbered sections (posts optionally).

- Display: inline-block (so the underline only spans the title text, not the
  full width).
- Text: `--text-lg` (17px), `--weight-extrabold`, `--tracking-snug`.
- Margin: `--space-5 0 --space-3 0` (18px / 10px).
- Border-bottom: 2px solid `--color-accent`, padding-bottom 4px.
- Numbering: a `<span class="num">§N</span>` child with mono, `--color-accent`,
  `--weight-extrabold`, `margin-right: 6px`.

## 6. Page Specifications

### 6.1 Header (all pages)

- Height: auto (padding 14px 32px).
- Background: `--color-bg`, border-bottom 1px solid `--color-border`.
- Flex row, space-between.
- Left: logo "Eduardo Kohn" in Inter `--text-sm`, `--weight-extrabold`,
  `--tracking-snug`.
- Right: nav links (Papers · Posts · About) in `--color-muted` `--text-sm` with
  22px gap, followed by `<Kbd>⌘K</Kbd>`.
- On pages < 640px viewport: collapse to a burger menu (hamburger icon on the
  right; logo stays left).

### 6.2 Footer (all pages)

- Padding 16px 32px, border-top 1px solid `--color-border`.
- Font: `--text-2xs`, `--color-muted`.
- Flex row, space-between.
- Left: `© 2026 Eduardo Kohn`.
- Right: links `RSS · Newsletter · GitHub`.

### 6.3 Home page (magazine grid)

- Header at top.
- Sub-header section: centered, padding 36px 32px 20px 32px, text-align center,
  border-bottom 1px solid `--color-border`.
  - `<h1>` "Eduardo Kohn" at `--text-2xl`, `--weight-extrabold`,
    `--tracking-snug`.
  - Sub-line: `--text-2xs` (11px), `--tracking-wider`, uppercase,
    `--color-muted`, 6px gap below h1. Content:
    `COMPUTER SCIENCE · PAPERS AND POSTS`.
- Grid: max-width `--measure-magazine` (1040px), margin 0 auto, padding 28px
  32px 40px 32px, grid-template-columns: 2fr 1fr, gap 32px.
- Featured card (first child in 2fr column):
  - Background: `--gradient-featured`
  - Border: 1px solid `--color-border-featured`
  - Padding: 28px 24px
  - Border-radius: `--radius-lg`
  - Meta chip inside is "FEATURED · PAPER" (or POST).
  - Title: `--text-xl`+ scale (24px), `--weight-bold`, `--tracking-snug`.
  - Description: `--text-sm` (13.5px), `--color-text`.
- Below featured card: a vertical list of recent entries (3 items), each: meta
  chip + title + 1-line description, separated by 1px `--color-border-soft`
  divider.
- Sidebar (1fr column): flex-column, gap 14px. Two blocks:
  1. "RECENT POSTS" mini-list (2 compact entries: title at 14px, tiny
     description at 11.5px).
  2. "TAGS" block with inline comma-separated tag list.
- Each sidebar block: h3 label `--text-2xs`, uppercase, `--tracking-wide`,
  `--color-accent`, `--weight-bold`, border-bottom 2px solid `--color-accent`,
  padding-bottom 3px, margin-bottom 8px.

### 6.4 Paper page (Tufte margin)

- Header at top.
- Body wrapper: grid-template-columns: `minmax(0, 1fr) 220px`, gap 32px, padding
  `--space-6 --space-8` (24px 32px), max-width `--measure-tufte-total` (980px),
  margin 0 auto.
- Main column (1fr):
  - Meta chip, title, author line, tag pills, abstract box (in that order).
  - Then MDX content: h2 sections with `§N`, paragraphs, theorem/def blocks,
    code blocks, figures, inline citations.
  - References section at the end.
- Side column (220px):
  - `<aside class="sidenotes">` padding-top 40px (to align with content below
    the header).
  - Sidenote rendering (see 5.8).
- Footer at bottom.
- Mobile (< 900px): grid collapses to single column. Sidenotes become footnotes
  at the bottom of the article (styled as an ordered list with the same number
  markers).

### 6.5 Post page (classic centered)

- Header at top.
- Body: max-width `--measure-prose` (640px), margin 0 auto, padding
  `--space-6 --space-8`.
- Sequence: meta chip, title, lead paragraph (muted, `--text-sm`, italic), tag
  pills, body.
- No sidenotes, no references section, no abstract box.
- Optional hero image above the meta chip, full-width inside the 640px column,
  aspect-ratio preserved, caption below in `--text-2xs` `--color-muted`.
- Footer at bottom.

## 7. Dark-mode Toggle Behavior

- User preference stored in `localStorage.theme` (`"light"` | `"dark"`).
- Initial attribute set via an inline script in `<head>` **before first paint**
  (prevents FOUC).
- Toggle button in header (visual placement: between nav links and the `⌘K` kbd
  hint). Icon: sun (light mode current) / moon (dark mode current).
- Toggle flips `[data-theme]` on `<html>` and persists to localStorage.
- If user has no stored preference, follow `prefers-color-scheme`.

## 8. Icons

All icons are rendered as inline SVG, not a sprite, not a font.

- Theme toggle: sun (12 rays, filled circle) / moon (crescent).
- Search (⌘K button): `search` icon from Lucide or Heroicons, outline style,
  14px.
- RSS: canonical RSS mark, outline style.
- GitHub: Simple Icons SVG.
- Newsletter: `mail` icon, outline style.

Icons inherit `currentColor`. In header they use `--color-muted`; on hover,
`--color-fg`. Size defaults to 14px (~`--text-2xs`).

## 9. Asset Requirements

- `public/fonts/inter/` — Inter variable .woff2 (self-hosted).
- `public/fonts/jetbrains-mono/` — JetBrains Mono variable .woff2.
- `public/favicon.svg` — stylized "EK" monogram in Wine (design TBD, not
  blocking).
- `public/og-fallback.png` — fallback OG image for pages without
  collection-specific OG (generated statically at build; design follows this
  brief — see plan 04 for Satori template).

## 10. Mobile Behavior Summary

- Post layout: identical to desktop, with horizontal padding clamped to
  `--space-4` (16px) below 600px viewport.
- Paper layout: Tufte grid collapses to single column at 900px. Sidenotes move
  to a footnotes section at the article's end.
- Home magazine grid: collapses to single column at 760px. Featured card appears
  first, sidebar (posts + tags) below.
- Header: burger menu at < 640px. Logo stays.
- Touch targets: all interactive elements ≥ 40×40px tap area, including header
  links, tag pills, and ⌘K button.

## 11. Open Items (Deferred)

- **Favicon / wordmark lockup**: exact monogram and wordmark style — design
  sketch happens in the implementation plan for home/about.
- **Newsletter form visual** — beyond "tag pill + button" basics. Will be
  specified as part of the component task when Plan 05 reaches it.
- **Command palette visual** — beyond "island overlay with list of results".
  Plan 05 covers visual tuning.

---

**End of visual design brief.**
