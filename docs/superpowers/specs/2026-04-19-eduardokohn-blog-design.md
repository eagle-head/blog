# Eduardo Kohn — Personal Blog (Astro SSG) — Design Spec

- **Date:** 2026-04-19
- **Owner:** Eduardo Kohn (sole author)
- **Status:** Approved (brainstorming phase); pending user review of written
  spec

---

## 1. Purpose & Goals

Build a personal blog that publishes **two editorial tracks** side-by-side:

1. **Papers** — computer-science articles written with scientific rigor
   (abstract, authors with affiliation/ORCID, citations/bibliography,
   theorem/definition/proof blocks, DOI-ready metadata).
2. **Posts** — shorter, Medium/LinkedIn-style technical pieces (lead paragraph,
   lighter metadata, faster publishing cadence).

Both tracks must render the full range of CS content: mathematics (inline and
display), syntax-highlighted code, diagrams, and footnotes.

**Non-negotiable quality attributes:**

- **Maximum SEO** — all HTML pre-rendered at build time; complete JSON-LD,
  `hreflang`, Open Graph, sitemap, and RSS; Core Web Vitals kept excellent.
- **Minimum client JS** — islands architecture with only four opt-in interactive
  components; total JS budget under ~25 KB per page.
- **Bilingual from day 0** — every entity (paper or post) exists in **English
  (default)** and **Brazilian Portuguese**, validated at build time.
- **Zero tool redundancy** — one tool per capability (one math engine, one
  diagram engine, one code highlighter, one citation processor).

## 2. Constraints & Non-Goals

- **Not** a multi-author platform. No CMS. No admin UI. Source of truth is the
  Git repository.
- **Not** a dynamic site. SSG only (`output: 'static'`). No server runtime, no
  SSR, no Workers.
- **Not** a marketing funnel. No A/B testing, no personalization, no conversion
  tracking.
- No support for unilingual posts — if a paper/post exists, it exists in both EN
  and pt-BR.
- No exotic diagram engines (TikZ/PGF). Scientific diagrams beyond Mermaid are
  handled by author-exported SVG/PNG assets placed alongside the MDX file.

## 3. Content Model

### 3.1 Directory layout

```text
src/content/
  papers/
    <slug>/
      en.mdx
      pt-BR.mdx
      references.bib         # BibTeX, local to this paper
      assets/                # figures, exported diagrams
  posts/
    <slug>/
      en.mdx
      pt-BR.mdx
      assets/
```

Each _entity_ (paper or post) is a **folder** named after its canonical slug.
The folder co-locates the two localized MDX files, bibliography (for papers),
and any binary assets.

### 3.2 Zod schemas (`src/content.config.ts`)

**`papers` collection** — fields marked required must be present in frontmatter
of every `en.mdx` and `pt-BR.mdx`:

| Field          | Type                                              | Required | Notes                                        |
| -------------- | ------------------------------------------------- | -------- | -------------------------------------------- |
| `title`        | string                                            | yes      | per-language                                 |
| `abstract`     | string (150–300 chars)                            | yes      | per-language                                 |
| `publishedAt`  | date (ISO)                                        | yes      | must match across languages                  |
| `updatedAt`    | date (ISO)                                        | no       |                                              |
| `authors`      | array of `{ name, affiliation?, orcid?, email? }` | yes      | at minimum `{ name: "Eduardo Kohn" }`        |
| `tags`         | string[] from canonical list                      | yes      | must match across languages                  |
| `language`     | `'en' \| 'pt-BR'`                                 | yes      | validated against file name                  |
| `keywords`     | string[]                                          | no       | per-language; seeds `<meta name="keywords">` |
| `doi`          | string                                            | no       |                                              |
| `status`       | `'draft' \| 'published'`                          | yes      | must match across languages                  |
| `bibliography` | string (relative path)                            | no       | default `./references.bib`                   |

**`posts` collection** — lighter schema:

| Field         | Type                     | Required | Notes                            |
| ------------- | ------------------------ | -------- | -------------------------------- |
| `title`       | string                   | yes      | per-language                     |
| `lead`        | string (80–160 chars)    | yes      | per-language                     |
| `publishedAt` | date                     | yes      | must match                       |
| `updatedAt`   | date                     | no       |                                  |
| `tags`        | string[]                 | yes      | must match                       |
| `language`    | `'en' \| 'pt-BR'`        | yes      |                                  |
| `status`      | `'draft' \| 'published'` | yes      | must match                       |
| `heroImage`   | image                    | no       |                                  |
| `series`      | `{ id, order }`          | no       | groups posts in ordered sequence |

### 3.3 Cross-language validation

Implemented in `src/lib/content.ts` as a wrapper around `getCollection`:

1. For every `<slug>` folder, both `en.mdx` and `pt-BR.mdx` must exist — build
   fails with a clear error otherwise.
2. The following frontmatter fields must be identical across languages: `slug`
   (implicit), `publishedAt`, `tags`, `status` (and `series` for posts).
3. `language` in frontmatter must match the filename (`en.mdx` ⇒
   `language: 'en'`; `pt-BR.mdx` ⇒ `language: 'pt-BR'`).
4. `status: 'draft'` items are excluded from production builds (controlled by an
   env-var check).

## 4. URL Structure & i18n

```text
EN (default, no prefix):
  /                          home
  /papers                    papers index (paginated)
  /papers/<slug>             paper detail
  /posts                     posts index
  /posts/<slug>              post detail
  /tags                      all tags
  /tags/<tag>                entities (papers + posts) with that tag
  /about
  /cv
  /newsletter                Buttondown signup page
  /rss.xml                   combined feed (papers + posts)
  /papers.rss.xml
  /posts.rss.xml
  /sitemap-index.xml

pt-BR (prefix /pt-br):
  /pt-br/                    (mirror of EN)
  /pt-br/papers
  /pt-br/papers/<slug>
  /pt-br/posts
  /pt-br/posts/<slug>
  /pt-br/tags, /pt-br/tags/<tag>
  /pt-br/about, /pt-br/cv, /pt-br/newsletter
  /pt-br/rss.xml, /pt-br/papers.rss.xml, /pt-br/posts.rss.xml
```

- `astro.config.mjs` →
  `i18n: { defaultLocale: 'en', locales: ['en', 'pt-BR'], routing: { prefixDefaultLocale: false } }`
- `<link rel="alternate" hreflang="en" href="...">` and
  `<link rel="alternate" hreflang="pt-BR" href="...">` on every page, emitted by
  `BaseLayout.astro`.
- `<link rel="alternate" hreflang="x-default" href="<EN URL>">`.
- Language toggle preserves the current route (`/papers/quicksort` ↔
  `/pt-br/papers/quicksort`).
- `@astrojs/sitemap` integrates with the i18n config to emit proper alternates
  in the sitemap.

## 5. Rendering Pipeline

### 5.1 MDX flow

````text
<slug>/{en|pt-BR}.mdx
   │
   ▼ remark plugins (Markdown AST)
[remark-directive]    ::: theorem / ::: definition / ::: proof / ::: lemma
                      → custom nodes
[remark-math]         $...$ and $$...$$ → math nodes
[remark-gfm]          tables, footnotes (bundled with Astro MDX)
   │
   ▼ rehype plugins (HTML AST)
[rehype-katex]        math nodes → KaTeX HTML spans
[rehype-mermaid]      ```mermaid blocks → inline SVG
                      (Playwright at build time)
[rehype-citation]     [@Knuth1997] → formatted cite + generates References
                      section from references.bib
[rehype-slug]         h2/h3/h4 get stable IDs
[rehype-autolink-headings]  anchor link appears on hover
   │
   ▼ Astro Shiki (built-in)
fenced code blocks → colorized HTML (dual theme: light + dark via CSS vars)
   │
   ▼ MDX components
<Theorem>, <Definition>, <Proof>, <Lemma>, <Figure caption>, <Note>, <Warning>
   │
   ▼ static HTML → Cloudflare Pages CDN
````

### 5.2 Bibliography (papers only)

- Each paper owns a local `references.bib`. Authors cite with Pandoc-style
  `[@key]` or `[@key; @key2]`.
- `rehype-citation` resolves citations, inserts in-text markers (e.g. `[1]`),
  and appends a **References** section at the end of the rendered article.
- CSL style: default **IEEE**. Configurable via frontmatter
  `csl: 'acm' | 'ieee' | 'apa'`.

### 5.3 Theorem / Definition / Proof blocks

Syntax:

```mdx
:::theorem{title="Fermat's Little Theorem"} If $p$ is prime and
$\gcd(a, p) = 1$, then $a^{p-1} \equiv 1 \pmod{p}$. :::

:::proof The residues $a, 2a, 3a, \ldots, (p-1)a \pmod{p}$ are a permutation of
$1, 2, \ldots, p-1$… :::
```

- Numbering: per-article, auto-incremented by a `remark-directive` handler
  (Theorem 1, Theorem 2, Definition 1, Proof of Theorem 1, etc.) and also
  exposed via CSS counters for consistent styling.
- Rendered through shared Astro components in `src/components/mdx/` — authors
  never interact with raw HTML.

### 5.4 Mermaid diagrams

- `rehype-mermaid` with `strategy: 'inline-svg'` renders diagrams at build time
  using a headless Chromium (via `@playwright/browser-chromium` installed as a
  build-time dependency).
- Output is inline SVG — zero client-side JS, fully accessible, responsive, and
  scales cleanly on retina displays.
- Dark-mode friendly: diagrams are themed via CSS variables so they invert
  correctly when the site theme changes.

## 6. Stack & Versions

All versions pinned to latest stable as of 2026-04-19. The Astro CLI bootstraps
the project with its defaults; we only add the packages below on top.

### 6.1 Core framework

| Package              | Version    | Purpose                                                            |
| -------------------- | ---------- | ------------------------------------------------------------------ |
| `astro`              | `^6.1.8`   | SSG framework, content collections v2, native i18n, built-in Shiki |
| `typescript`         | `^6.0.3`   | Type-checking across the project                                   |
| `@astrojs/check`     | `^0.9.8`   | `astro check` CLI typecheck                                        |
| `@astrojs/ts-plugin` | `^1.10.7`  | TS language server plugin for `.astro` files                       |
| `@astrojs/mdx`       | `^5.0.3`   | MDX support with custom components inside content                  |
| `@astrojs/preact`    | `^5.1.1`   | Preact runtime (~3 KB) for the Command Palette island              |
| `preact`             | `^10.29.1` | Used exclusively by the Command Palette                            |

### 6.2 Content pipeline (remark / rehype)

| Package                    | Version    | Purpose                                                       |
| -------------------------- | ---------- | ------------------------------------------------------------- |
| `remark-math`              | `^6.0.0`   | Recognizes `$...$` and `$$...$$`                              |
| `rehype-katex`             | `^7.0.1`   | Renders math nodes as HTML at build time                      |
| `katex`                    | `^0.16.45` | KaTeX engine (peer of rehype-katex) + its CSS                 |
| `rehype-mermaid`           | `^3.0.0`   | Static SVG rendering of Mermaid blocks                        |
| `mermaid`                  | `^11.14.0` | Mermaid engine (peer of rehype-mermaid)                       |
| `rehype-citation`          | `^2.3.2`   | BibTeX → formatted citations + References section             |
| `remark-directive`         | `^4.0.0`   | Enables `:::theorem`, `:::definition`, `:::proof`, `:::lemma` |
| `rehype-slug`              | `^6.0.0`   | Stable IDs on headings                                        |
| `rehype-autolink-headings` | `^7.1.0`   | Anchor links on hover                                         |
| `remark-gfm`               | `^4.0.1`   | GFM tables, footnotes (Astro bundles it; pinned for clarity)  |

### 6.3 SEO, feeds, Open Graph

| Package            | Version   | Purpose                                |
| ------------------ | --------- | -------------------------------------- |
| `@astrojs/sitemap` | `^3.7.2`  | sitemap.xml with hreflang alternates   |
| `@astrojs/rss`     | `^4.0.18` | RSS/Atom feed helpers                  |
| `astro-seo`        | `^1.1.0`  | `<SEO>` component for meta/OG/Twitter  |
| `satori`           | `^0.26.0` | HTML/CSS → SVG for OG image generation |
| `@resvg/resvg-js`  | `^2.6.2`  | SVG → PNG renderer (pairs with satori) |

### 6.4 Search, comments, analytics, newsletter

| Package / Service            | Version / Source                            | Purpose                                                                  |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `pagefind`                   | `^1.5.2`                                    | Static full-text search index, bilingual                                 |
| `astro-pagefind`             | `^1.8.6`                                    | Runs Pagefind after Astro build                                          |
| **Giscus** (script)          | `client.js` from `giscus.app`               | Comments via GitHub Discussions (GitHub login only — strong spam filter) |
| **Cloudflare Web Analytics** | script from `static.cloudflareinsights.com` | Privacy-friendly, cookieless, no consent banner                          |
| **Buttondown** (embed)       | HTML form + optional API                    | Newsletter signup; RSS-to-email automation                               |

### 6.5 Styling & typography

| Package                      | Version   | Purpose                                                                            |
| ---------------------------- | --------- | ---------------------------------------------------------------------------------- |
| `tailwindcss`                | `^4.2.2`  | Utility CSS, content-aware output                                                  |
| `@tailwindcss/vite`          | `^4.2.2`  | Tailwind v4 integrates via Vite plugin (NOT `@astrojs/tailwind`, which targets v3) |
| `@tailwindcss/typography`    | `^0.5.19` | `prose` styles for long-form content                                               |
| `@fontsource-variable/inter` | `^5.2.8`  | Self-hosted variable font (others added as needed, e.g. JetBrains Mono for code)   |

### 6.6 Dev tooling

| Package                 | Version   | Purpose                   |
| ----------------------- | --------- | ------------------------- |
| `prettier`              | `^3.8.3`  | Formatter                 |
| `prettier-plugin-astro` | `^0.14.1` | `.astro` file support     |
| `eslint`                | `^10.2.1` | Linter                    |
| `eslint-plugin-astro`   | `^1.7.0`  | `.astro` rules            |
| `typescript-eslint`     | `^8.58.2` | TS rules for ESLint       |
| `markdownlint-cli2`     | `^0.22.0` | Markdown linter for specs |

### 6.7 Runtime environment

- **Node.js**: 22 LTS for local dev and Cloudflare Pages builds.
- **Package manager**: `npm` (user preference; all bootstrap commands, scripts,
  and CI assume `npm`).
- **Headless browser**: `@playwright/browser-chromium` installed for
  `rehype-mermaid` at build time only.

## 7. Islands & Client-Side

Four islands total. **Initial-load** JS budget on any page: **< 15 KB**
(ThemeToggle + CommandPalette listener + Analytics). Giscus (`client:visible`)
and the Pagefind index load on demand and do not count against the initial
budget.

| Island                        | Framework        | Hydration        | Loads when                                                                       | Approx. KB                                 |
| ----------------------------- | ---------------- | ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| `CommandPalette` (Ctrl/Cmd+K) | Preact           | `client:load`    | Listener registered on load; full UI + Pagefind loader deferred until first open | ~8 KB Preact + 3 KB Pagefind loader (lazy) |
| `ThemeToggle`                 | Vanilla (inline) | inline `<head>`  | Before paint (prevents FOUC)                                                     | ~400 B                                     |
| `Giscus`                      | Vanilla wrapper  | `client:visible` | When user scrolls to end of article                                              | ~12 KB (official script)                   |
| `Analytics`                   | Vanilla          | async `<head>`   | On page load                                                                     | ~5 KB (Cloudflare beacon)                  |

### 7.1 `CommandPalette` — design detail

This is the feature the user specifically called out.

- **Semantically isolated from the page.** Rendered as a React/Preact portal
  into `document.body`, **outside the `<main>` outline**. Does not affect
  heading hierarchy, landmark roles, or SEO.
- **Shortcut:** Cmd+K on macOS, Ctrl+K on Windows/Linux, `/` as alternative
  (common blog convention).
- **Lazy loading:** the Preact island registers only a keyboard listener on
  `client:load`. The UI tree and Pagefind index are `import()`-ed dynamically on
  first open. Users who never press the shortcut pay ~8 KB total.
- **Search:** `pagefind/pagefind.js` is imported lazily. Results returned from
  Pagefind's API, rendered with term highlight.
- **Faceting:** filter by collection (`papers` | `posts`), language
  (auto-detected from URL locale but user-overridable), and tag.
- **Multilingual index:** Pagefind's multilingual support is enabled; searches
  in either EN or pt-BR return relevant results from both.
- **Trigger UI:** a `⌘K` button in the header (pure HTML/CSS) opens the palette
  when clicked — no extra JS on the non-island side.
- **A11y:** focus trap, `aria-modal`, restored focus on close,
  screen-reader-announced result count.

### 7.2 Dark mode

- CSS-only theming using `[data-theme="dark"]` on `<html>` + CSS custom
  properties.
- A tiny inline script in `<head>` reads `localStorage.theme` (or
  `prefers-color-scheme`) and sets the attribute **before first paint** to
  prevent flash.
- Toggle button flips the attribute and persists.

## 8. SEO

### 8.1 Meta & structured data

- Every page emits: `<title>`, `<meta name="description">`,
  `<link rel="canonical">`, `<meta name="robots">`, complete Open Graph, and
  Twitter Card — via `astro-seo`.
- `hreflang` alternates on every page (auto-generated from the i18n routing
  helper).
- **JSON-LD** emitted per page type:
  - `/papers/<slug>` → `ScholarlyArticle` (author with ORCID when present,
    datePublished, dateModified, keywords, citation list, abstract, inLanguage,
    DOI when present)
  - `/posts/<slug>` → `BlogPosting`
  - `/` → `Blog` + `Person` (Eduardo Kohn)
  - `/about` → rich `Person` (sameAs GitHub/LinkedIn/ORCID)
  - Collection indexes → `CollectionPage` + `BreadcrumbList`

### 8.2 Open Graph images

- One unique PNG per entity per language: `/og/papers/<slug>-<lang>.png` and
  `/og/posts/<slug>-<lang>.png`.
- Generated at build time via `satori` → SVG → `@resvg/resvg-js` → PNG.
- Template: title, author name, publication date, collection label, theme
  gradient. Fonts loaded locally from `public/fonts/`.
- `<meta property="og:image">` and `<meta name="twitter:image">` point to the
  generated PNG.

### 8.3 Feeds

- `/rss.xml` — combined feed of all published papers + posts (EN).
- `/papers.rss.xml` — papers only (EN).
- `/posts.rss.xml` — posts only (EN).
- `/pt-br/rss.xml`, `/pt-br/papers.rss.xml`, `/pt-br/posts.rss.xml` — pt-BR
  mirrors.
- Full content included (not just excerpts) to play nicely with Buttondown's
  RSS-to-email.

### 8.4 Sitemap & robots

- `/sitemap-index.xml` and per-collection sitemaps, emitted by
  `@astrojs/sitemap` with hreflang alternates.
- `robots.txt` in `public/` allows all, points to sitemap.
- Post-deploy: register site in Google Search Console and Bing Webmaster Tools
  (manual, one-time).

### 8.5 Core Web Vitals hygiene

- Self-hosted variable fonts with `font-display: swap` and preload of the
  primary font.
- No third-party scripts in `<head>` except analytics (async).
- Images via Astro's `<Image>`: AVIF/WebP, responsive `srcset`, lazy by default,
  priority hint on hero images.
- No layout shift: reserved aspect-ratio boxes for images and Mermaid diagrams.

## 9. Build, Deploy, Infrastructure

### 9.1 Repository & hosting

- **Source:** public GitHub repo (required for Giscus backend).
- **Hosting:** Cloudflare Pages connected to the repo. PRs produce unique
  preview URLs. Merges to `main` publish production.
- **Build command:** `npm run build` — produces `dist/`, `dist/pagefind/`,
  `dist/og/`.
- **Domain:** existing domain, DNS managed by Cloudflare, CNAME to the Pages
  project.
- **Environment variables:** none required for v0 (Buttondown form POSTs
  directly to Buttondown's domain). Reserved: `BUTTONDOWN_API_KEY` if a
  server-side subscription flow is added later.

### 9.2 CI (GitHub Actions)

A minimal workflow (`.github/workflows/ci.yml`) runs on every push and PR:

1. `npm ci` (installs from lockfile, fails on drift)
2. `npm run lint` (ESLint + Prettier + markdownlint)
3. `npm run typecheck` (`astro check`)
4. `npm run build`

This is redundant with Cloudflare's own build (which also runs `npm run build`),
but provides faster feedback in the PR UI and blocks merges on failures.

### 9.3 Repository tree (target)

```text
.
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── .markdownlint-cli2.jsonc
├── src/
│   ├── content.config.ts
│   ├── content/
│   │   ├── papers/<slug>/{en.mdx, pt-BR.mdx, references.bib, assets/}
│   │   └── posts/<slug>/{en.mdx, pt-BR.mdx, assets/}
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── PaperLayout.astro
│   │   └── PostLayout.astro
│   ├── components/
│   │   ├── mdx/{Theorem,Definition,Proof,Lemma,Figure,Note,Warning}.astro
│   │   ├── CommandPalette.tsx        # Preact island
│   │   ├── ThemeToggle.astro
│   │   ├── Giscus.astro
│   │   ├── LangToggle.astro
│   │   ├── NewsletterForm.astro
│   │   └── SEO.astro                 # wraps astro-seo + JSON-LD
│   ├── lib/
│   │   ├── i18n.ts                   # URL helpers, locale detection
│   │   ├── content.ts                # cross-language validation
│   │   └── og.ts                     # Satori render helpers
│   ├── pages/
│   │   ├── index.astro
│   │   ├── papers/{index.astro, [slug].astro}
│   │   ├── posts/{index.astro, [slug].astro}
│   │   ├── tags/{index.astro, [tag].astro}
│   │   ├── about.astro, cv.astro, newsletter.astro
│   │   ├── pt-br/                    # mirror
│   │   ├── rss.xml.ts, papers.rss.xml.ts, posts.rss.xml.ts
│   │   └── og/[collection]/[slug]-[lang].png.ts
│   └── styles/
│       └── global.css                # Tailwind directives + design tokens
├── public/
│   ├── fonts/                        # self-hosted variable fonts
│   ├── favicon.svg
│   └── robots.txt
└── .github/workflows/ci.yml
```

## 10. Bootstrap Sequence

The project starts by running the Astro CLI scaffolder **interactively** — the
human operator answers its prompts. Only after the Astro project is in place do
we layer the rest of the stack on top with `npm install`. This guarantees the
starting point uses Astro 6's current conventions (config file format,
`tsconfig`, built-in Shiki setup) exactly as the CLI intends.

### 10.1 Step 1 — Scaffold with Astro CLI (interactive)

Run in the project root (`.` = current directory):

```bash
npm create astro@latest .
```

Answer the prompts as follows:

- **Where should we create your new project?** → `.` (current directory; the CLI
  will warn that files exist — the `docs/` folder and `.markdownlint-cli2.jsonc`
  are safe; accept to continue)
- **How would you like to start your new project?** → **Empty** (or "Minimal" /
  "Include sample files: No" — we scaffold our own content)
- **Install dependencies?** → **Yes**
- **Do you plan to write TypeScript?** → **Yes**
- **How strict should TypeScript be?** → **Strict**
- **Initialize a new git repository?** → **No** (we will connect to an existing
  GitHub repo later)

### 10.2 Step 2 — Add Astro integrations (interactive)

```bash
npx astro add mdx preact sitemap
```

The CLI will show proposed dependency additions and `astro.config.mjs` edits.
Accept each prompt (**Y**).

### 10.3 Step 3 — Install content pipeline packages

```bash
npm install \
  remark-math rehype-katex katex \
  rehype-mermaid mermaid \
  rehype-citation \
  remark-directive \
  rehype-slug rehype-autolink-headings \
  remark-gfm
```

### 10.4 Step 4 — Install styling packages

```bash
npm install tailwindcss @tailwindcss/vite @tailwindcss/typography
npm install @fontsource-variable/inter
```

### 10.5 Step 5 — Install SEO / feeds / OG packages

```bash
npm install @astrojs/rss astro-seo satori @resvg/resvg-js
```

### 10.6 Step 6 — Install search packages

```bash
npm install pagefind astro-pagefind
```

### 10.7 Step 7 — Install dev tooling

```bash
npm install -D \
  @astrojs/check @astrojs/ts-plugin \
  prettier prettier-plugin-astro \
  eslint eslint-plugin-astro typescript-eslint \
  markdownlint-cli2
```

### 10.8 Step 8 — Install Playwright Chromium (for Mermaid at build time)

```bash
npx playwright install chromium
```

After scaffolding, implementation proceeds in the order defined by the
writing-plans output.

## 11. Testing & Quality Gates

- **Build is the primary test.** A broken entity, a missing translation, a
  malformed BibTeX key, or an invalid frontmatter field MUST fail the build with
  a clear error message.
- **Manual smoke tests per PR** (documented in `docs/testing.md` — created in
  implementation):
  1. Home renders both feeds.
  2. A paper with math + Mermaid + citations renders all three.
  3. Language toggle preserves the route.
  4. Ctrl+K opens the palette and returns results.
  5. Theme toggle persists and has no FOUC.
  6. `/sitemap-index.xml` lists all pages with hreflang.
- **Lighthouse CI** (optional, v1+): run against preview URLs, assert
  performance ≥ 95 and SEO = 100.
- **Markdown lint**: `markdownlint-cli2` runs over `docs/**/*.md` in CI,
  configured in `.markdownlint-cli2.jsonc`.

## 12. Out of Scope for v0 (Explicit)

These were considered and consciously excluded. Listed here so the plan does not
drift.

- Admin UI / CMS.
- Server-side rendering of any kind.
- A/B testing, feature flags, personalization.
- User accounts, authentication, paywalls.
- Multi-author workflows.
- Automated translation (translations are human-written).
- TikZ/PGF rendering inside MDX (fallback: author-exported SVG asset).
- Algolia or other hosted search (Pagefind is sufficient).
- Disqus or Hyvor Talk (Giscus is sufficient; switch only if feedback demands
  it).
- Newsletter segmentation, automations, paid subscriptions.

## 13. Open Items

None blocking. The following are intentionally deferred to implementation
planning:

- Exact visual design tokens (palette, type scale, spacing rhythm) — the design
  brief for that work happens inside the implementation plan, not here.
- Specific CSL citation style beyond defaulting to IEEE.
- Whether Buttondown subscription confirmation uses their hosted flow or an
  API-mediated double opt-in page. Default assumption: hosted flow (zero
  backend).

---

**End of spec.**
