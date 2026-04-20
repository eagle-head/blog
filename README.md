# eduardokohn.com

[![CI](https://github.com/eagle-head/blog/actions/workflows/ci.yml/badge.svg)](https://github.com/eagle-head/blog/actions/workflows/ci.yml)

Bilingual scientific + developer portfolio of **Eduardo Kohn** — [eduardokohn.com](https://eduardokohn.com). Long-form **papers** (proofs,
citations, margin notes) and shorter **posts** (engineering writeups), published side by side in English and Brazilian Portuguese.

## Stack

- **Astro 6** in static mode (`output: 'static'`, `trailingSlash: 'never'`) — every page pre-rendered at build time, zero JS by default.
- **MDX** with remark/rehype pipeline: `remark-math` + `rehype-katex` (math), `rehype-citation` with a bundled IEEE CSL (citations from
  BibTeX), `rehype-mermaid` (diagrams rendered server-side via Playwright), `rehype-slug` + `rehype-autolink-headings`, Shiki for code
  highlighting with a custom transformer that emits macOS-style chrome (`title="…"` → `data-filename`).
- **Tailwind CSS v4** via `@tailwindcss/vite`, `@theme` CSS-first config, single `global.css` token source.
- **Preact** for the few islands that ship runtime JS (Command Palette).
- **Content Collections v2** with Zod schemas enforcing bilingual parity — every entry has `en.mdx` + `pt-BR.mdx`.
- **Pagefind** for client-side full-text search (WASM index generated at build, loaded on first `Ctrl+K`).
- **Satori** + `@resvg/resvg-js` for per-entry OG images generated at build.
- **Giscus** (comments, opt-in per entry) + **Cloudflare Web Analytics** (privacy-first, env-gated).
- **Vitest** for unit tests on the pure `src/lib/` modules.

## Structure

```text
src/
  content.config.ts        Zod schemas for papers + posts (bilingual enforcement)
  content/
    papers/<slug>/         en.mdx + pt-BR.mdx (+ references.bib)
    posts/<slug>/          en.mdx + pt-BR.mdx
  layouts/                 BaseLayout, PaperLayout (Tufte), PostLayout (centered)
  components/              SEO, Header, Footer, LangToggle, ThemeToggle,
                           CommandPaletteHost/Panel (Preact), Giscus, Analytics, …
  pages/                   Routes: /, /papers, /posts, /tags, /pt-br/*, og images,
                           rss feeds
  lib/                     Pure helpers (content, collections, i18n, ui, rss, og);
                           unit-tested in src/lib/__tests__/.
  styles/global.css        Design tokens, Dark Always code chrome, palette styles.
  csl/ieee.csl             Build-time citation style, bundled (not served).
public/                    Favicons, fonts, _headers (CSP + security headers).
docs/superpowers/          Specs and per-milestone implementation plans.
wrangler.jsonc             Cloudflare Workers (Static Assets) deploy config.
```

## Writing content

Every paper and post is a **folder** with two MDX files — the Zod schema refuses to build without both locales.

```bash
src/content/posts/new-post/
  en.mdx
  pt-BR.mdx
```

Minimum post frontmatter:

```yaml
---
title: Why I like Hoare partitioning
lead: A 100–160-char teaser shown on listing pages and RSS.
publishedAt: 2026-05-01
tags: [algorithms, sorting]
language: en # or pt-BR
status: published # draft drops it from listings + feeds
comments: true # default: true (papers also default to true)
---
```

Paper frontmatter adds `authors`, `abstract` (150–300 chars), optional `doi`, `keywords`, `bibliography`. See
[`src/content/papers/quicksort-partitioning/en.mdx`](./src/content/papers/quicksort-partitioning/en.mdx) as a reference.

Semantic components available inside MDX: `<Theorem>`, `<Definition>`, `<Proof>`, `<Sidenote>`, `<Figure>`. Citations as `[@BibtexKey]` are
resolved against the paper's `references.bib`.

## Local development

Node pinned via [`.nvmrc`](./.nvmrc); `nvm use` to match.

```bash
npm install
npm run dev          # http://localhost:4321
npm run check        # astro sync + astro check + markdown lint
npm test             # vitest on src/lib/
npm run build        # → dist/
npm run preview      # serve dist/ locally
```

Environment variables (copy `.env.example` to `.env` and fill):

```env
PUBLIC_GISCUS_REPO=eagle-head/blog
PUBLIC_GISCUS_REPO_ID=…
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=…
PUBLIC_CF_ANALYTICS_TOKEN=…
```

Leave any of them blank to disable the corresponding component — `Analytics.astro` and `Giscus.astro` both early-return `null` when their
env is missing, so the local build never ships an unconfigured widget.

## Deploy

Production serves from [eduardokohn.com](https://eduardokohn.com) via **Cloudflare Workers (Static Assets)**. Every push to `main` triggers
a build + deploy through Cloudflare Workers Builds; every PR gets a preview URL posted back by the Cloudflare GitHub app.
[`wrangler.jsonc`](./wrangler.jsonc) at the repo root holds the deploy config (`assets.directory`, `html_handling`, `not_found_handling`);
[`public/_headers`](./public/_headers) holds the CSP and security headers applied by Workers at serve time.

## CI

`.github/workflows/ci.yml` runs on every PR and every push to `main`: `npm ci` → `npm run lint:md` → `npm run format:check` →
`npm run check` → `npm test` → `npm run build`. Node version sourced from `.nvmrc` so CI, Cloudflare Builds, and local stay in lockstep.

## License

Source under MIT (see [`LICENSE`](./LICENSE) if present). Written content under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
unless noted otherwise on a specific entry.
