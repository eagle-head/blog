# Blog — Plan 02: Layouts, Components, EN Pages, Sample Content

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working bilingual blog scaffold (English routes only) with real sample content — one scientific paper and one casual post,
both with matching pt-BR translations — rendered through layout + component primitives that match the visual design brief.

**Architecture:** Astro components implement the visual brief's tokens as focused, single-responsibility units. Layouts (`BaseLayout`,
`PaperLayout`, `PostLayout`) compose primitives (`Tag`, `MetaChip`, `Kbd`, `Header`, `Footer`, `ThemeToggle`, `SEO`) and MDX semantic
components (`<Theorem>`, `<Definition>`, `<Proof>`, `<Lemma>`, `<Figure>`, `<Note>`, `<Warning>`, `<Sidenote>`) registered globally for MDX
files. Sample content exists in both locales so the cross-language validator runs green; pt-BR _routes_ come in Plan 03. End state:
`npm run build` produces working EN pages; `npm run dev` renders a paper with math, code, theorem blocks, citations, and a post with code
blocks.

**Tech Stack:** Astro 6, MDX, Tailwind v4 (tokens from Plan 01), Shiki (built-in, github-dark), `rehype-katex`, `rehype-citation` (BibTeX),
`remark-math`.

**Reference specs:**

- Architecture: `docs/superpowers/specs/2026-04-19-eduardokohn-blog-design.md`
- Visual design brief: `docs/superpowers/specs/2026-04-19-visual-design.md` (authoritative source for §5 component specs, §6 page specs,
  §7.2 dark mode, §8.1 JSON-LD)

**Prerequisites:** Plan 01 complete, tag `v0.1.0-foundations` present. Working tree clean.

---

## Phase 1 — UI Primitives

Seven Astro components the layouts consume. Each is a single-purpose component that renders tokenised HTML. Components live in
`src/components/` (root; MDX-only components go in `src/components/mdx/` in Phase 4).

### Task 1.1 — `Tag` component

Implements brief §5.1: outlined pill with `#` prefix, accent color.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/Tag.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Tag.astro
// Brief §5.1 — Outlined tag pill with # prefix.
interface Props {
  /** The raw tag slug, e.g. "sorting". */
  name: string;
  /** Optional href; if omitted, the tag renders as a non-link span. */
  href?: string;
}
const { name, href } = Astro.props;
const Tag = href ? 'a' : 'span';
---

<Tag class="tag" href={href}>{name}</Tag>

<style>
  .tag {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    font-weight: var(--font-weight-semibold);
    text-transform: lowercase;
    color: var(--color-accent);
    background: transparent;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-pill);
    padding: 2px 8px;
    letter-spacing: 0.02em;
    text-decoration: none;
    line-height: 1;
  }
  .tag::before {
    content: '#';
    opacity: 0.5;
    margin-right: 2px;
  }
  a.tag:hover {
    background: var(--color-accent-soft);
  }
</style>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors, 0 warnings.

### Task 1.2 — `MetaChip` component

Implements brief §5.2: uppercase entry-kind label (`PAPER`, `POST`, `FEATURED`).

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/MetaChip.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/MetaChip.astro
// Brief §5.2 — Uppercase meta chip placed above the title.
interface Props {
  /** The chip label, e.g. "paper · march 14, 2026 · 12 min". Rendered uppercase. */
  text: string;
}
const { text } = Astro.props;
---

<span class="chip">{text}</span>

<style>
  .chip {
    display: inline-block;
    text-transform: uppercase;
    font-size: var(--text-3xs);
    letter-spacing: var(--tracking-wider);
    font-weight: var(--font-weight-extrabold);
    color: var(--color-accent);
    margin-bottom: var(--space-2);
  }
</style>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors, 0 warnings.

### Task 1.3 — `Kbd` component

Implements brief §5.3: keyboard-hint pill (e.g. `⌘K`).

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/Kbd.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Kbd.astro
// Brief §5.3 — Inline keyboard hint like ⌘K.
---

<kbd class="kbd"><slot /></kbd>

<style>
  .kbd {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    color: var(--color-muted);
    background: var(--color-kbd-bg);
    border: 1px solid var(--color-kbd-border);
    border-radius: var(--radius-sm);
    padding: 1px 5px;
    line-height: 1.2;
  }
</style>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors, 0 warnings.

### Task 1.4 — `ThemeToggle` component (light/dark button)

Implements brief §7.2: button in header that toggles `data-theme` and persists to `localStorage`. The inline `themeInitScript` from Plan 01
(`src/lib/theme-init.ts`) sets the initial value; this component switches at runtime. Uses inline SVG (sun / moon), no icon font.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/ThemeToggle.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/ThemeToggle.astro
// Brief §7.2 — Light/dark toggle that flips [data-theme] on <html>
// and persists the choice to localStorage.
---

<button id="theme-toggle" type="button" class="theme-toggle" aria-label="Toggle color theme" title="Toggle color theme">
  <svg class="icon icon-sun" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="currentColor"></circle>
    <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="12" y1="2" x2="12" y2="5"></line>
      <line x1="12" y1="19" x2="12" y2="22"></line>
      <line x1="2" y1="12" x2="5" y2="12"></line>
      <line x1="19" y1="12" x2="22" y2="12"></line>
      <line x1="4.6" y1="4.6" x2="6.7" y2="6.7"></line>
      <line x1="17.3" y1="17.3" x2="19.4" y2="19.4"></line>
      <line x1="4.6" y1="19.4" x2="6.7" y2="17.3"></line>
      <line x1="17.3" y1="6.7" x2="19.4" y2="4.6"></line>
    </g>
  </svg>
  <svg class="icon icon-moon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor"></path>
  </svg>
</button>

<script>
  const btn = document.getElementById('theme-toggle');
  btn?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage blocked — toggle still works for the current page */
    }
  });
</script>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-muted);
    cursor: pointer;
  }
  .theme-toggle:hover {
    color: var(--color-fg);
    background: var(--color-kbd-bg);
  }
  .icon {
    display: none;
  }
  /* show sun in dark mode (clicking returns to light); moon in light mode */
  :root[data-theme='light'] .theme-toggle .icon-moon,
  :root:not([data-theme='dark']) .theme-toggle .icon-moon {
    display: block;
  }
  :root[data-theme='dark'] .theme-toggle .icon-sun {
    display: block;
  }
</style>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors, 0 warnings.

### Task 1.5 — `Header` component

Implements brief §6.1: logo left + nav + ⌘K button + theme toggle right.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/Header.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Header.astro
// Brief §6.1 — Site header: logo + nav + ⌘K + theme toggle.
import Kbd from './Kbd.astro';
import ThemeToggle from './ThemeToggle.astro';
---

<header class="site-header">
  <a class="logo" href="/">Eduardo Kohn</a>
  <nav class="site-nav" aria-label="Primary">
    <a href="/papers">Papers</a>
    <a href="/posts">Posts</a>
    <a href="/about">About</a>
    <button id="cmdk-trigger" type="button" class="cmdk-trigger" aria-label="Open search" title="Open search">
      <Kbd>⌘K</Kbd>
    </button>
    <ThemeToggle />
  </nav>
</header>

<style>
  .site-header {
    padding: 14px var(--space-8);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-sm);
    border-bottom: 1px solid var(--color-border);
  }
  .logo {
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-snug);
    font-size: 15px;
    color: var(--color-fg);
    text-decoration: none;
  }
  .site-nav {
    display: flex;
    align-items: center;
    gap: 22px;
    color: var(--color-muted);
  }
  .site-nav a {
    color: inherit;
    text-decoration: none;
  }
  .site-nav a:hover {
    color: var(--color-fg);
  }
  .cmdk-trigger {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
  }
</style>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors, 0 warnings. (The `cmdk-trigger` button is a stub — the full CommandPalette island ships in Plan 05. For now it is a
visual placeholder.)

### Task 1.6 — `Footer` component

Implements brief §6.2.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/Footer.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Footer.astro
// Brief §6.2 — Site footer with copyright and external links.
const year = new Date().getFullYear();
---

<footer class="site-footer">
  <span>© {year} Eduardo Kohn</span>
  <span class="links">
    <a href="/rss.xml">RSS</a>
    <span class="sep">·</span>
    <a href="/newsletter">Newsletter</a>
    <span class="sep">·</span>
    <a href="https://github.com/eduardokohn" rel="me noopener">GitHub</a>
  </span>
</footer>

<style>
  .site-footer {
    padding: 16px var(--space-8);
    border-top: 1px solid var(--color-border);
    font-size: var(--text-2xs);
    color: var(--color-muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .site-footer a {
    color: inherit;
    text-decoration: none;
  }
  .site-footer a:hover {
    color: var(--color-fg);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .links {
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }
  .sep {
    opacity: 0.5;
  }
</style>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors, 0 warnings.

### Task 1.7 — Commit Phase 1

- [ ] **Step 1: Commit the six UI primitives**

```bash
git add src/components/
git commit -m "feat(ui): add tag, meta-chip, kbd, theme toggle, header, footer primitives"
```

---

## Phase 2 — SEO Component

Single component that emits meta tags + JSON-LD for all page types. Implements brief §8.1.

### Task 2.1 — `SEO` component

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/SEO.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/SEO.astro
// Brief §8.1 — Emits title, meta description, canonical, OpenGraph,
// Twitter Card, hreflang alternates, and a page-type-specific JSON-LD.
// JSON-LD schemas: Blog/Person on home, ScholarlyArticle on /papers/[slug],
// BlogPosting on /posts/[slug], Person on /about, CollectionPage on
// listing pages.
import { alternateUrls, DEFAULT_LOCALE, type Locale } from '../lib/i18n';

type JsonLdKind =
  | { kind: 'home' }
  | { kind: 'about' }
  | { kind: 'collection'; name: 'papers' | 'posts' | 'tag'; tagName?: string }
  | {
      kind: 'paper';
      title: string;
      abstract: string;
      publishedAt: Date;
      updatedAt?: Date;
      keywords?: string[];
      doi?: string;
      authors: { name: string; orcid?: string; affiliation?: string }[];
      inLanguage: Locale;
    }
  | {
      kind: 'post';
      title: string;
      lead: string;
      publishedAt: Date;
      updatedAt?: Date;
      tags: string[];
      inLanguage: Locale;
    };

interface Props {
  title: string;
  description: string;
  /** Canonical path (EN form, e.g. "/papers/quicksort"). */
  canonicalPath: string;
  /** Absolute URL of the OG image; optional. */
  ogImage?: string;
  jsonLd: JsonLdKind;
}

const { title, description, canonicalPath, ogImage, jsonLd } = Astro.props;

const site = Astro.site?.toString().replace(/\/$/, '') ?? 'https://eduardokohn.com';
const alts = alternateUrls(canonicalPath);
const canonical = `${site}${alts[DEFAULT_LOCALE]}`;

function buildJsonLd(): Record<string, unknown> {
  const base = { '@context': 'https://schema.org' };
  switch (jsonLd.kind) {
    case 'home':
      return {
        ...base,
        '@type': 'Blog',
        name: 'Eduardo Kohn',
        url: `${site}/`,
        author: {
          '@type': 'Person',
          name: 'Eduardo Kohn',
          url: `${site}/about`,
        },
      };
    case 'about':
      return {
        ...base,
        '@type': 'Person',
        name: 'Eduardo Kohn',
        url: `${site}/about`,
      };
    case 'collection':
      return {
        ...base,
        '@type': 'CollectionPage',
        name: jsonLd.tagName ? `Tag: ${jsonLd.tagName}` : jsonLd.name,
        url: canonical,
      };
    case 'paper':
      return {
        ...base,
        '@type': 'ScholarlyArticle',
        headline: jsonLd.title,
        abstract: jsonLd.abstract,
        datePublished: jsonLd.publishedAt.toISOString(),
        ...(jsonLd.updatedAt ? { dateModified: jsonLd.updatedAt.toISOString() } : {}),
        inLanguage: jsonLd.inLanguage,
        ...(jsonLd.keywords ? { keywords: jsonLd.keywords.join(', ') } : {}),
        ...(jsonLd.doi ? { sameAs: `https://doi.org/${jsonLd.doi}` } : {}),
        author: jsonLd.authors.map((a) => ({
          '@type': 'Person',
          name: a.name,
          ...(a.orcid ? { identifier: `https://orcid.org/${a.orcid}` } : {}),
          ...(a.affiliation ? { affiliation: { '@type': 'Organization', name: a.affiliation } } : {}),
        })),
        url: canonical,
      };
    case 'post':
      return {
        ...base,
        '@type': 'BlogPosting',
        headline: jsonLd.title,
        description: jsonLd.lead,
        datePublished: jsonLd.publishedAt.toISOString(),
        ...(jsonLd.updatedAt ? { dateModified: jsonLd.updatedAt.toISOString() } : {}),
        inLanguage: jsonLd.inLanguage,
        keywords: jsonLd.tags.join(', '),
        author: { '@type': 'Person', name: 'Eduardo Kohn' },
        url: canonical,
      };
  }
}
---

<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<link rel="alternate" hreflang="en" href={`${site}${alts.en}`} />
<link rel="alternate" hreflang="pt-BR" href={`${site}${alts['pt-BR']}`} />
<link rel="alternate" hreflang="x-default" href={`${site}${alts.en}`} />

<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:site_name" content="Eduardo Kohn" />
<meta property="og:type" content={jsonLd.kind === 'paper' || jsonLd.kind === 'post' ? 'article' : 'website'} />
{ogImage && <meta property="og:image" content={ogImage} />}

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
{ogImage && <meta name="twitter:image" content={ogImage} />}

<script type="application/ld+json" set:html={JSON.stringify(buildJsonLd())} />
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors, 0 warnings.

### Task 2.2 — Commit Phase 2

- [ ] **Step 1: Commit**

```bash
git add src/components/SEO.astro
git commit -m "feat(seo): add SEO component with meta tags, hreflang, and JSON-LD"
```

---

## Phase 3 — Layouts

### Task 3.1 — `BaseLayout`

Shell used by every page. Loads `global.css`, inlines `themeInitScript` before first paint, renders Header + slot + Footer.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write the file**

```astro
---
// src/layouts/BaseLayout.astro
// Brief §6.1, §6.2, §7.2 — Page shell: <html lang>, theme-init script
// before first paint, <SEO /> slot, Header + content slot + Footer.
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { themeInitScript } from '../lib/theme-init';

interface Props {
  lang?: 'en' | 'pt-BR';
}
const { lang = 'en' } = Astro.props;
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script is:inline set:html={themeInitScript} />
    <slot name="head" />
  </head>
  <body>
    <Header />
    <slot />
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors.

### Task 3.2 — `PaperLayout`

Implements brief §6.4 — Tufte two-column grid with main content + side rail for `<Sidenote>` positioning, followed by a References section
when the paper uses citations. Takes the paper entry as prop, renders the `<MetaChip>`, title, author line, tags, abstract, then slots body.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/layouts/PaperLayout.astro`

- [ ] **Step 1: Write the file**

```astro
---
// src/layouts/PaperLayout.astro
// Brief §6.4 — Tufte margin layout for papers.
import type { CollectionEntry } from 'astro:content';
import BaseLayout from './BaseLayout.astro';
import MetaChip from '../components/MetaChip.astro';
import Tag from '../components/Tag.astro';
import SEO from '../components/SEO.astro';

interface Props {
  entry: CollectionEntry<'papers'>;
  /** Canonical EN path, e.g. "/papers/quicksort". */
  canonicalPath: string;
  /** Rendered reading time string, e.g. "12 min". */
  readingTime: string;
}
const { entry, canonicalPath, readingTime } = Astro.props;
const { title, abstract, publishedAt, updatedAt, authors, tags, keywords, doi, language } = entry.data;

const dateFormat = new Intl.DateTimeFormat(language, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const chipText = `Paper · ${dateFormat.format(publishedAt)} · ${readingTime}`;
const authorLine = authors.map((a) => (a.affiliation ? `${a.name} · ${a.affiliation}` : a.name)).join(', ');
---

<BaseLayout lang={language}>
  <SEO
    slot="head"
    title={`${title} — Eduardo Kohn`}
    description={abstract}
    canonicalPath={canonicalPath}
    jsonLd={{
      kind: 'paper',
      title,
      abstract,
      publishedAt,
      updatedAt,
      keywords,
      doi,
      authors,
      inLanguage: language,
    }}
  />

  <article class="paper">
    <div class="paper-main">
      <MetaChip text={chipText} />
      <h1 class="paper-title">{title}</h1>
      <p class="paper-author">{authorLine}</p>
      <div class="paper-tags">
        {tags.map((t) => <Tag name={t} href={`/tags/${t}`} />)}
      </div>
      <div class="paper-abstract">
        <b>Abstract.</b>
        {' '}
        {abstract}
      </div>
      <div class="paper-body">
        <slot />
      </div>
    </div>
    <aside class="paper-side" aria-label="Sidenotes">
      <div id="sidenotes-root"></div>
    </aside>
  </article>
</BaseLayout>

<style>
  .paper {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--measure-tufte-side);
    gap: var(--space-8);
    padding: var(--space-6) var(--space-8);
    max-width: var(--measure-tufte-total);
    margin: 0 auto;
  }
  .paper-main {
    min-width: 0;
  }
  .paper-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin: var(--space-2) 0 var(--space-2) 0;
    color: var(--color-fg);
  }
  .paper-author {
    font-size: var(--text-sm);
    color: var(--color-muted);
    margin: 0 0 var(--space-3) 0;
  }
  .paper-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }
  .paper-abstract {
    font-size: var(--text-xs);
    line-height: var(--leading-normal);
    color: var(--color-text);
    padding: var(--space-3) var(--space-4);
    background: var(--color-abstract-bg);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-5);
  }
  .paper-abstract b {
    color: var(--color-fg);
  }
  .paper-side {
    font-size: var(--text-2xs);
    color: var(--color-muted);
    padding-top: 40px;
  }
  @media (max-width: 900px) {
    .paper {
      grid-template-columns: 1fr;
    }
    .paper-side {
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }
  }
</style>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors.

### Task 3.3 — `PostLayout`

Implements brief §6.5: single 640px column.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/layouts/PostLayout.astro`

- [ ] **Step 1: Write the file**

```astro
---
// src/layouts/PostLayout.astro
// Brief §6.5 — Classic Centered single-column layout for posts.
import type { CollectionEntry } from 'astro:content';
import BaseLayout from './BaseLayout.astro';
import MetaChip from '../components/MetaChip.astro';
import Tag from '../components/Tag.astro';
import SEO from '../components/SEO.astro';

interface Props {
  entry: CollectionEntry<'posts'>;
  canonicalPath: string;
  readingTime: string;
}
const { entry, canonicalPath, readingTime } = Astro.props;
const { title, lead, publishedAt, updatedAt, tags, language } = entry.data;

const dateFormat = new Intl.DateTimeFormat(language, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const chipText = `Post · ${dateFormat.format(publishedAt)} · ${readingTime}`;
---

<BaseLayout lang={language}>
  <SEO
    slot="head"
    title={`${title} — Eduardo Kohn`}
    description={lead}
    canonicalPath={canonicalPath}
    jsonLd={{
      kind: 'post',
      title,
      lead,
      publishedAt,
      updatedAt,
      tags,
      inLanguage: language,
    }}
  />

  <article class="post">
    <MetaChip text={chipText} />
    <h1 class="post-title">{title}</h1>
    <p class="post-lead">{lead}</p>
    <div class="post-tags">
      {tags.map((t) => <Tag name={t} href={`/tags/${t}`} />)}
    </div>
    <div class="post-body">
      <slot />
    </div>
  </article>
</BaseLayout>

<style>
  .post {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .post-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin: var(--space-2) 0 var(--space-2) 0;
    color: var(--color-fg);
  }
  .post-lead {
    font-size: var(--text-sm);
    color: var(--color-muted);
    margin: 0 0 var(--space-3) 0;
  }
  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-5);
  }
</style>
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx astro check`

Expected: 0 errors.

### Task 3.4 — Commit Phase 3

- [ ] **Step 1: Commit**

```bash
git add src/layouts/
git commit -m "feat(layouts): add BaseLayout, PaperLayout (Tufte), PostLayout (Classic)"
```

---

## Phase 4 — MDX Semantic Components

Components that MDX content files consume as `<Theorem>`, `<Definition>`, etc. Brief §5.5, §5.8.

### Task 4.1 — Theorem / Definition / Proof / Lemma

Four variants of the Accent Box pattern. Each gets its own file for clarity.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/mdx/Theorem.astro`
- Create: `/home/eduardo/Documents/blog/src/components/mdx/Definition.astro`
- Create: `/home/eduardo/Documents/blog/src/components/mdx/Proof.astro`
- Create: `/home/eduardo/Documents/blog/src/components/mdx/Lemma.astro`
- Create: `/home/eduardo/Documents/blog/src/components/mdx/_semantic.css` (shared styles imported by all four)

- [ ] **Step 1: Write the shared CSS**

```css
/* src/components/mdx/_semantic.css */
/* Brief §5.5 — Accent Box semantic blocks. */
.semantic {
  display: block;
  margin: var(--space-4) 0;
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid;
  border-radius: var(--radius-md);
}
.semantic-label {
  display: block;
  font-size: var(--text-2xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--space-1);
}
.semantic-num {
  font-family: var(--font-mono);
  margin-right: 6px;
}
.semantic-body {
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  color: var(--color-text);
}
.semantic--italic .semantic-body {
  font-style: italic;
}
.semantic--theorem,
.semantic--lemma {
  background: var(--color-accent-soft);
  border-left-color: var(--color-accent);
}
.semantic--theorem .semantic-label,
.semantic--lemma .semantic-label {
  color: var(--color-accent);
}
.semantic--definition {
  background: var(--color-accent-2-soft);
  border-left-color: var(--color-accent-2);
}
.semantic--definition .semantic-label {
  color: var(--color-accent-2);
}
.semantic--proof {
  background: var(--color-border-soft);
  border-left-color: var(--color-muted);
}
.semantic--proof .semantic-label {
  color: var(--color-muted);
}
.semantic-qed {
  display: inline-block;
  margin-left: var(--space-2);
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-style: normal;
}
```

- [ ] **Step 2: Write `Theorem.astro`**

```astro
---
// src/components/mdx/Theorem.astro
// Brief §5.5 — Theorem semantic block (Accent Box, Wine, italic body).
import './_semantic.css';
interface Props {
  /** Numeric label shown before the title, e.g. "2.1". */
  n?: string;
  /** Optional human-readable title, e.g. "Hoare comparison bound". */
  title?: string;
}
const { n, title } = Astro.props;
---

<div class="semantic semantic--theorem semantic--italic">
  <span class="semantic-label">
    {n && <span class="semantic-num">{n}</span>}
    Theorem{title && <>: {title}</>}
  </span>
  <div class="semantic-body"><slot /></div>
</div>
```

- [ ] **Step 3: Write `Definition.astro`**

```astro
---
// src/components/mdx/Definition.astro
import './_semantic.css';
interface Props {
  n?: string;
  title?: string;
}
const { n, title } = Astro.props;
---

<div class="semantic semantic--definition semantic--italic">
  <span class="semantic-label">
    {n && <span class="semantic-num">{n}</span>}
    Definition{title && <>: {title}</>}
  </span>
  <div class="semantic-body"><slot /></div>
</div>
```

- [ ] **Step 4: Write `Proof.astro`**

```astro
---
// src/components/mdx/Proof.astro
// Proof is upright (not italic) per §5.5 convention, with a QED mark.
import './_semantic.css';
interface Props {
  of?: string;
}
const { of } = Astro.props;
---

<div class="semantic semantic--proof">
  <span class="semantic-label">Proof{of && <> of {of}</>}</span>
  <div class="semantic-body">
    <slot />
    <span class="semantic-qed" aria-label="End of proof">∎</span>
  </div>
</div>
```

- [ ] **Step 5: Write `Lemma.astro`**

```astro
---
// src/components/mdx/Lemma.astro
import './_semantic.css';
interface Props {
  n?: string;
  title?: string;
}
const { n, title } = Astro.props;
---

<div class="semantic semantic--theorem semantic--italic">
  <span class="semantic-label">
    {n && <span class="semantic-num">{n}</span>}
    Lemma{title && <>: {title}</>}
  </span>
  <div class="semantic-body"><slot /></div>
</div>
```

- [ ] **Step 6: Verify types**

Run: `npx astro check`

Expected: 0 errors.

### Task 4.2 — Figure / Note / Warning / Sidenote

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/mdx/Figure.astro`
- Create: `/home/eduardo/Documents/blog/src/components/mdx/Note.astro`
- Create: `/home/eduardo/Documents/blog/src/components/mdx/Warning.astro`
- Create: `/home/eduardo/Documents/blog/src/components/mdx/Sidenote.astro`

- [ ] **Step 1: Write `Figure.astro`**

```astro
---
// src/components/mdx/Figure.astro
// Semantic <figure> with accessible caption.
interface Props {
  caption: string;
  alt?: string;
}
const { caption } = Astro.props;
---

<figure class="figure">
  <div class="figure-body"><slot /></div>
  <figcaption class="figure-caption">{caption}</figcaption>
</figure>

<style>
  .figure {
    margin: var(--space-4) 0;
    padding: 0;
  }
  .figure-caption {
    font-size: var(--text-2xs);
    color: var(--color-muted);
    font-style: italic;
    margin-top: var(--space-2);
    text-align: center;
  }
</style>
```

- [ ] **Step 2: Write `Note.astro`**

```astro
---
// src/components/mdx/Note.astro
// Generic informational callout.
---

<div class="callout callout--note">
  <span class="callout-label">Note</span>
  <div class="callout-body"><slot /></div>
</div>

<style>
  .callout {
    display: block;
    margin: var(--space-4) 0;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--color-accent-2);
    background: var(--color-accent-2-soft);
  }
  .callout-label {
    display: block;
    font-size: var(--text-2xs);
    font-weight: var(--font-weight-extrabold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-accent-2);
    margin-bottom: var(--space-1);
  }
  .callout-body {
    font-size: var(--text-xs);
    line-height: var(--leading-normal);
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 3: Write `Warning.astro`**

```astro
---
// src/components/mdx/Warning.astro
// Warning callout — uses Wine accent to signal "stop and read".
---

<div class="callout callout--warn">
  <span class="callout-label">Warning</span>
  <div class="callout-body"><slot /></div>
</div>

<style>
  .callout {
    display: block;
    margin: var(--space-4) 0;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--color-accent);
    background: var(--color-accent-soft);
  }
  .callout-label {
    display: block;
    font-size: var(--text-2xs);
    font-weight: var(--font-weight-extrabold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-accent);
    margin-bottom: var(--space-1);
  }
  .callout-body {
    font-size: var(--text-xs);
    line-height: var(--leading-normal);
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 4: Write `Sidenote.astro`**

The Sidenote renders a marker (`<sup>`) in the flow, and then a block that CSS positions in the Tufte margin. This is a simplified
single-pass version: each sidenote is self-contained (marker + content in the same component), and CSS handles placement. In Plan 04 we can
tune it.

```astro
---
// src/components/mdx/Sidenote.astro
// Brief §5.8 — inline marker + marginal note. Each instance renders:
//   <sup>N</sup><aside>…</aside>
// On desktop the <aside> is positioned in the right margin by
// `position: absolute; right: calc(-1 * (var(--measure-tufte-side) + var(--space-8)));`
// On mobile it collapses inline beneath the paragraph.
interface Props {
  n: number;
}
const { n } = Astro.props;
---

<sup class="sidenote-marker">{n}</sup>
<span class="sidenote">
  <span class="sidenote-num">{n}.</span>
  <slot />
</span>

<style>
  .sidenote-marker {
    color: var(--color-accent);
    font-weight: var(--font-weight-bold);
    font-size: 0.7em;
    font-family: var(--font-mono);
    margin-left: 1px;
  }
  .sidenote {
    display: block;
    margin: var(--space-2) 0 var(--space-3) 0;
    padding-left: var(--space-3);
    border-left: 2px solid var(--color-accent);
    font-size: var(--text-2xs);
    color: var(--color-muted);
    line-height: var(--leading-normal);
  }
  .sidenote-num {
    font-family: var(--font-mono);
    color: var(--color-accent);
    font-weight: var(--font-weight-bold);
    margin-right: 4px;
  }

  /* Desktop Tufte margin placement — absolute inside the paper grid. */
  @media (min-width: 901px) {
    .sidenote {
      display: block;
      float: right;
      clear: right;
      width: var(--measure-tufte-side);
      margin-right: calc(-1 * (var(--measure-tufte-side) + var(--space-8)));
      margin-top: 0;
      margin-bottom: var(--space-3);
    }
  }
</style>
```

- [ ] **Step 5: Verify types**

Run: `npx astro check`

Expected: 0 errors.

### Task 4.3 — Wire MDX components globally

So that MDX files can use `<Theorem>` etc. without importing them in every file, register them as MDX components through Astro's MDX
integration options.

**Files:**

- Modify: `/home/eduardo/Documents/blog/astro.config.mjs` (MDX options)
- Create: `/home/eduardo/Documents/blog/src/components/mdx/index.ts` (re-export barrel)

- [ ] **Step 1: Write the re-export barrel**

```ts
// src/components/mdx/index.ts
// Central re-export so MDX files and layouts import from one place.
export { default as Theorem } from './Theorem.astro';
export { default as Definition } from './Definition.astro';
export { default as Proof } from './Proof.astro';
export { default as Lemma } from './Lemma.astro';
export { default as Figure } from './Figure.astro';
export { default as Note } from './Note.astro';
export { default as Warning } from './Warning.astro';
export { default as Sidenote } from './Sidenote.astro';
```

MDX files import components explicitly at their top, from the barrel. No `astro.config.mjs` change is needed — this plan intentionally does
not register MDX globals. Sample MDX in Phase 5 imports from the barrel.

- [ ] **Step 2: Verify types**

Run: `npx astro check`

Expected: 0 errors.

### Task 4.4 — Commit Phase 4

- [ ] **Step 1: Commit**

```bash
git add src/components/mdx/
git commit -m "feat(mdx): add semantic blocks (theorem, definition, proof, lemma) and callouts"
```

---

## Phase 5 — Sample Content

### Task 5.1 — Sample paper in EN + pt-BR with BibTeX

**Files:**

- Create: `/home/eduardo/Documents/blog/src/content/papers/quicksort-partitioning/en.mdx`
- Create: `/home/eduardo/Documents/blog/src/content/papers/quicksort-partitioning/pt-BR.mdx`
- Create: `/home/eduardo/Documents/blog/src/content/papers/quicksort-partitioning/references.bib`

- [ ] **Step 1: Write `references.bib`**

```bibtex
@article{Hoare1962,
  author  = {Hoare, C. A. R.},
  title   = {Algorithm 64: Quicksort},
  journal = {Communications of the ACM},
  year    = {1962},
  volume  = {5},
  number  = {7},
  pages   = {322},
  doi     = {10.1145/366622.366644}
}

@article{Sedgewick1977,
  author  = {Sedgewick, Robert},
  title   = {The Analysis of Quicksort Programs},
  journal = {Acta Informatica},
  year    = {1977},
  volume  = {7},
  number  = {4},
  pages   = {327--355}
}
```

- [ ] **Step 2: Write `en.mdx`**

````mdx
---
title: 'A Note on Quicksort Partitioning'
abstract:
  "We revisit Hoare's partition scheme and compare it against Lomuto's under varied input distributions, establishing tight bounds on
  comparison counts observed in practice."
publishedAt: '2026-03-14'
authors:
  - name: 'Eduardo Kohn'
    affiliation: 'Independent researcher'
tags:
  - sorting
  - algorithms
  - complexity
language: 'en'
status: 'published'
---

import { Theorem, Definition, Proof, Sidenote, Figure } from '../../../components/mdx';

Partitioning is the core operation of quicksort. Two classical schemes exist: Hoare's<Sidenote n={1}>Hoare (1962), two pointers converging
inward.</Sidenote> and Lomuto's<Sidenote n={2}>Lomuto uses a single pointer; simpler but slower in practice.</Sidenote>.

Given an array $a[\ell..r]$ and a pivot $p$, partitioning rearranges values so every element to the left of some index $k$ satisfies
$a[i] \le a[k]$ and every element to the right satisfies $a[j] \ge a[k]$.

<Definition n="1.1" title="Partition function">
A function `partition(a, lo, hi)` rearranges $a[\ell..r]$ so that there
exists an index $k \in [\ell, r]$ where $a[i] \le a[k]$ for $i < k$ and
$a[j] \ge a[k]$ for $j > k$, and returns $k$.
</Definition>

<Theorem n="2.1" title="Hoare comparison bound">
  For any input array of size $n \ge 2$, Hoare's partition performs at most $\lceil 3n/4 \rceil$ comparisons in the worst case.
</Theorem>

<Proof of="Theorem 2.1">
  The left and right pointers advance monotonically and meet in $O(n)$ steps. A tight bookkeeping argument shows the total number of
  comparisons is bounded by $3n/4$ in the worst case, attained when the pivot lands near a quarter-point.
</Proof>

The following TypeScript implementation mirrors Hoare's original scheme, with two pointers converging inward and `swap()` exchanging
out-of-place elements:

```ts title="partition.ts"
// Hoare-style partition
function partition(arr: number[], lo: number, hi: number): number {
  const pivot = arr[lo];
  let i = lo - 1;
  let j = hi + 1;
  while (true) {
    do {
      i++;
    } while (arr[i] < pivot);
    do {
      j--;
    } while (arr[j] > pivot);
    if (i >= j) return j;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
```

Calling `partition(arr, lo, hi)` returns the split index. An unbalanced pivot degrades quicksort to $\Theta(n^2)$; randomising the pivot
restores expected $\Theta(n \log n)$.
````

- [ ] **Step 3: Write `pt-BR.mdx`**

````mdx
---
title: 'Uma Nota sobre Particionamento em Quicksort'
abstract:
  'Revisitamos o esquema de particionamento de Hoare e o comparamos ao de Lomuto sob distribuições variadas de entrada, estabelecendo
  limites justos para o número de comparações observadas na prática.'
publishedAt: '2026-03-14'
authors:
  - name: 'Eduardo Kohn'
    affiliation: 'Pesquisador independente'
tags:
  - sorting
  - algorithms
  - complexity
language: 'pt-BR'
status: 'published'
---

import { Theorem, Definition, Proof, Sidenote, Figure } from '../../../components/mdx';

O particionamento é a operação central do quicksort. Existem dois esquemas clássicos: o de Hoare<Sidenote n={1}>Hoare (1962), dois ponteiros
convergindo para o centro.</Sidenote> e o de Lomuto<Sidenote n={2}>Lomuto usa um único ponteiro; mais simples, mas mais lento na
prática.</Sidenote>.

Dado um arranjo $a[\ell..r]$ e um pivô $p$, o particionamento reorganiza os valores de modo que todo elemento à esquerda de algum índice $k$
satisfaça $a[i] \le a[k]$ e todo elemento à direita satisfaça $a[j] \ge a[k]$.

<Definition n="1.1" title="Função de partição">
Uma função `partition(a, lo, hi)` reorganiza $a[\ell..r]$ de modo que
exista um índice $k \in [\ell, r]$ onde $a[i] \le a[k]$ para $i < k$ e
$a[j] \ge a[k]$ para $j > k$, e retorna $k$.
</Definition>

<Theorem n="2.1" title="Limite de comparações de Hoare">
  Para qualquer arranjo de tamanho $n \ge 2$, o particionamento de Hoare executa no máximo $\lceil 3n/4 \rceil$ comparações no pior caso.
</Theorem>

<Proof of="Teorema 2.1">
  Os ponteiros esquerdo e direito avançam de forma monotônica e se encontram em $O(n)$ passos. Um argumento de contagem justo mostra que o
  total de comparações é limitado por $3n/4$ no pior caso, atingido quando o pivô cai próximo de um quarto do arranjo.
</Proof>

A implementação a seguir em TypeScript espelha o esquema original de Hoare, com dois ponteiros convergindo e `swap()` trocando elementos
fora de lugar:

```ts title="partition.ts"
// Partição estilo Hoare
function partition(arr: number[], lo: number, hi: number): number {
  const pivot = arr[lo];
  let i = lo - 1;
  let j = hi + 1;
  while (true) {
    do {
      i++;
    } while (arr[i] < pivot);
    do {
      j--;
    } while (arr[j] > pivot);
    if (i >= j) return j;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
```

Chamar `partition(arr, lo, hi)` retorna o índice de separação. Um pivô desbalanceado degrada o quicksort para $\Theta(n^2)$; escolher o pivô
aleatoriamente restaura a expectativa $\Theta(n \log n)$.
````

- [ ] **Step 4: Verify content validates**

Run: `npx astro sync && npx astro check`

Expected: 0 errors, 0 warnings. The papers collection now has one entry group `quicksort-partitioning` with both locales.

### Task 5.2 — Sample post in EN + pt-BR

**Files:**

- Create: `/home/eduardo/Documents/blog/src/content/posts/welcome/en.mdx`
- Create: `/home/eduardo/Documents/blog/src/content/posts/welcome/pt-BR.mdx`

- [ ] **Step 1: Write `en.mdx`**

````mdx
---
title: "Why I'm rewriting my blog in Astro"
lead: 'A short tour through the tradeoffs: static-first, islands architecture, and keeping the client JavaScript budget close to zero.'
publishedAt: '2026-03-09'
tags:
  - astro
  - webdev
  - meta
language: 'en'
status: 'published'
---

Last year I ran my blog on **Gatsby**. It worked, but the JavaScript budget kept creeping up and Lighthouse scores drifted down. I wanted
static HTML, minimum JS, and a pipeline that treats math, code, and diagrams as first-class citizens.

## The stack

Astro as the SSG, Tailwind v4 for utilities, `remark-math` + `rehype-katex` for LaTeX, and Pagefind for client-side search. Everything
pre-rendered at build time.

```js title="astro.config.mjs"
export default defineConfig({
  output: 'static',
  integrations: [mdx(), preact(), sitemap()],
});
```

The only JavaScript shipped to the browser lives inside four explicit islands (command palette, theme toggle, comments, analytics). Pages
that don't use those islands ship **0 KB** of runtime JS.

Lighthouse scores bounce back to 100/100.
````

- [ ] **Step 2: Write `pt-BR.mdx`**

````mdx
---
title: 'Por que estou reescrevendo meu blog em Astro'
lead:
  'Um breve passeio pelos trade-offs: static-first, arquitetura de ilhas, e manter o orçamento de JavaScript no cliente próximo de zero.'
publishedAt: '2026-03-09'
tags:
  - astro
  - webdev
  - meta
language: 'pt-BR'
status: 'published'
---

No ano passado meu blog rodava em **Gatsby**. Funcionava, mas o orçamento de JavaScript crescia continuamente e as notas do Lighthouse caíam
junto. Eu queria HTML estático, JS mínimo e um pipeline que tratasse matemática, código e diagramas como cidadãos de primeira classe.

## A stack

Astro como SSG, Tailwind v4 para utilitários, `remark-math` + `rehype-katex` para LaTeX, e Pagefind para busca client-side. Tudo
pré-renderizado no build.

```js title="astro.config.mjs"
export default defineConfig({
  output: 'static',
  integrations: [mdx(), preact(), sitemap()],
});
```

O único JavaScript enviado ao navegador vive em quatro ilhas explícitas (command palette, theme toggle, comentários, analytics). Páginas que
não usam essas ilhas entregam **0 KB** de runtime JS.

As notas do Lighthouse voltam a ser 100/100.
````

- [ ] **Step 3: Verify content validates**

Run: `npx astro sync && npx astro check`

Expected: 0 errors, 0 warnings.

### Task 5.3 — Commit Phase 5

- [ ] **Step 1: Commit**

```bash
git add src/content/
git commit -m "feat(content): add sample paper (quicksort) and post (welcome) in EN + pt-BR"
```

---

## Phase 6 — EN Pages

### Task 6.1 — `/papers` listing and `/papers/[slug]` detail

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/papers/index.astro`
- Create: `/home/eduardo/Documents/blog/src/pages/papers/[slug].astro`
- Modify: `/home/eduardo/Documents/blog/src/pages/index.astro` (will be replaced entirely in Task 6.3)

- [ ] **Step 1: Write `src/pages/papers/index.astro`**

```astro
---
// src/pages/papers/index.astro
// Papers listing (EN). Lists every paper whose EN entry is published,
// most recent first.
import BaseLayout from '../../layouts/BaseLayout.astro';
import MetaChip from '../../components/MetaChip.astro';
import Tag from '../../components/Tag.astro';
import SEO from '../../components/SEO.astro';
import { getValidatedCollection } from '../../lib/collections';

const groups = await getValidatedCollection('papers');
const papers = Object.entries(groups)
  .map(([slug, g]) => ({ slug, entry: g.en! }))
  .sort((a, b) => b.entry.data.publishedAt.getTime() - a.entry.data.publishedAt.getTime());

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
---

<BaseLayout lang="en">
  <SEO
    slot="head"
    title="Papers — Eduardo Kohn"
    description="Computer-science papers by Eduardo Kohn."
    canonicalPath="/papers"
    jsonLd={{ kind: 'collection', name: 'papers' }}
  />
  <main class="listing">
    <h1 class="listing-title">Papers</h1>
    <ul class="entries">
      {
        papers.map(({ slug, entry }) => (
          <li class="entry">
            <MetaChip text={`Paper · ${dateFormat.format(entry.data.publishedAt)}`} />
            <a class="entry-title" href={`/papers/${slug}`}>
              {entry.data.title}
            </a>
            <p class="entry-abstract">{entry.data.abstract}</p>
            <div class="entry-tags">
              {entry.data.tags.map((t) => (
                <Tag name={t} href={`/tags/${t}`} />
              ))}
            </div>
          </li>
        ))
      }
    </ul>
  </main>
</BaseLayout>

<style>
  .listing {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .listing-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    margin: 0 0 var(--space-5) 0;
    color: var(--color-fg);
  }
  .entries {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .entry {
    padding: var(--space-4) 0;
    border-bottom: 1px solid var(--color-border-soft);
  }
  .entry:last-child {
    border-bottom: none;
  }
  .entry-title {
    display: block;
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-fg);
    text-decoration: none;
    margin: var(--space-1) 0 var(--space-2) 0;
    letter-spacing: var(--tracking-snug);
    line-height: var(--leading-snug);
  }
  .entry-title:hover {
    color: var(--color-accent);
  }
  .entry-abstract {
    font-size: var(--text-sm);
    color: var(--color-text);
    margin: 0 0 var(--space-2) 0;
    line-height: var(--leading-normal);
  }
  .entry-tags {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
</style>
```

- [ ] **Step 2: Write `src/pages/papers/[slug].astro`**

```astro
---
// src/pages/papers/[slug].astro
// Paper detail page (EN). `getStaticPaths` enumerates every validated
// paper slug; each path renders the EN entry inside PaperLayout.
import PaperLayout from '../../layouts/PaperLayout.astro';
import { getValidatedCollection } from '../../lib/collections';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const groups = await getValidatedCollection('papers');
  return Object.entries(groups).map(([slug, g]) => ({
    params: { slug },
    props: { entry: g.en! },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);

function estimateReadingTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min`;
}
const readingTime = estimateReadingTime(entry.body ?? '');
---

<PaperLayout entry={entry} canonicalPath={`/papers/${Astro.params.slug}`} readingTime={readingTime}>
  <Content />
</PaperLayout>
```

- [ ] **Step 3: Verify build**

Run: `npx astro sync && npx astro check && npm run build`

Expected: `astro check` 0 errors; build emits `dist/papers/index.html` and `dist/papers/quicksort-partitioning/index.html`.

### Task 6.2 — `/posts` listing and `/posts/[slug]` detail

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/posts/index.astro`
- Create: `/home/eduardo/Documents/blog/src/pages/posts/[slug].astro`

- [ ] **Step 1: Write `src/pages/posts/index.astro`**

```astro
---
// src/pages/posts/index.astro
// Posts listing (EN).
import BaseLayout from '../../layouts/BaseLayout.astro';
import MetaChip from '../../components/MetaChip.astro';
import Tag from '../../components/Tag.astro';
import SEO from '../../components/SEO.astro';
import { getValidatedCollection } from '../../lib/collections';

const groups = await getValidatedCollection('posts');
const posts = Object.entries(groups)
  .map(([slug, g]) => ({ slug, entry: g.en! }))
  .sort((a, b) => b.entry.data.publishedAt.getTime() - a.entry.data.publishedAt.getTime());

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
---

<BaseLayout lang="en">
  <SEO
    slot="head"
    title="Posts — Eduardo Kohn"
    description="Short technical posts by Eduardo Kohn."
    canonicalPath="/posts"
    jsonLd={{ kind: 'collection', name: 'posts' }}
  />
  <main class="listing">
    <h1 class="listing-title">Posts</h1>
    <ul class="entries">
      {
        posts.map(({ slug, entry }) => (
          <li class="entry">
            <MetaChip text={`Post · ${dateFormat.format(entry.data.publishedAt)}`} />
            <a class="entry-title" href={`/posts/${slug}`}>
              {entry.data.title}
            </a>
            <p class="entry-lead">{entry.data.lead}</p>
            <div class="entry-tags">
              {entry.data.tags.map((t) => (
                <Tag name={t} href={`/tags/${t}`} />
              ))}
            </div>
          </li>
        ))
      }
    </ul>
  </main>
</BaseLayout>

<style>
  .listing {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .listing-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    margin: 0 0 var(--space-5) 0;
    color: var(--color-fg);
  }
  .entries {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .entry {
    padding: var(--space-4) 0;
    border-bottom: 1px solid var(--color-border-soft);
  }
  .entry:last-child {
    border-bottom: none;
  }
  .entry-title {
    display: block;
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-fg);
    text-decoration: none;
    margin: var(--space-1) 0 var(--space-2) 0;
    letter-spacing: var(--tracking-snug);
    line-height: var(--leading-snug);
  }
  .entry-title:hover {
    color: var(--color-accent);
  }
  .entry-lead {
    font-size: var(--text-sm);
    color: var(--color-text);
    margin: 0 0 var(--space-2) 0;
    line-height: var(--leading-normal);
  }
  .entry-tags {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
</style>
```

- [ ] **Step 2: Write `src/pages/posts/[slug].astro`**

```astro
---
// src/pages/posts/[slug].astro
// Post detail page (EN).
import PostLayout from '../../layouts/PostLayout.astro';
import { getValidatedCollection } from '../../lib/collections';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const groups = await getValidatedCollection('posts');
  return Object.entries(groups).map(([slug, g]) => ({
    params: { slug },
    props: { entry: g.en! },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);

function estimateReadingTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min`;
}
const readingTime = estimateReadingTime(entry.body ?? '');
---

<PostLayout entry={entry} canonicalPath={`/posts/${Astro.params.slug}`} readingTime={readingTime}>
  <Content />
</PostLayout>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: build emits `dist/posts/index.html` and `dist/posts/welcome/index.html`.

### Task 6.3 — Home page (magazine grid)

Implements brief §6.3. Featured card = newest paper, sidebar has Recent Posts (up to 3) and Tags.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/pages/index.astro` (replace the scaffold placeholder)

- [ ] **Step 1: Rewrite `src/pages/index.astro`**

```astro
---
// src/pages/index.astro
// Home (EN) — Brief §6.3 Magazine Grid: featured piece (2fr) with
// gradient background + sidebar (1fr) with Recent Posts and Tags.
import BaseLayout from '../layouts/BaseLayout.astro';
import MetaChip from '../components/MetaChip.astro';
import SEO from '../components/SEO.astro';
import { getValidatedCollection } from '../lib/collections';

const paperGroups = await getValidatedCollection('papers');
const postGroups = await getValidatedCollection('posts');

const papers = Object.entries(paperGroups)
  .map(([slug, g]) => ({ slug, entry: g.en! }))
  .sort((a, b) => b.entry.data.publishedAt.getTime() - a.entry.data.publishedAt.getTime());

const posts = Object.entries(postGroups)
  .map(([slug, g]) => ({ slug, entry: g.en! }))
  .sort((a, b) => b.entry.data.publishedAt.getTime() - a.entry.data.publishedAt.getTime());

const featured = papers[0];
const morePapers = papers.slice(1, 4);
const recentPosts = posts.slice(0, 3);

const allTags = Array.from(new Set([...papers.flatMap((p) => p.entry.data.tags), ...posts.flatMap((p) => p.entry.data.tags)])).sort();

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
---

<BaseLayout lang="en">
  <SEO
    slot="head"
    title="Eduardo Kohn — Computer Science Notes"
    description="Papers and posts on computer science by Eduardo Kohn."
    canonicalPath="/"
    jsonLd={{ kind: 'home' }}
  />

  <section class="sub-header">
    <h1 class="site-title">Eduardo Kohn</h1>
    <p class="site-sub">Computer Science · Papers and Posts</p>
  </section>

  <div class="magazine">
    <div class="main-col">
      {
        featured && (
          <a class="featured" href={`/papers/${featured.slug}`}>
            <MetaChip text={`Featured · Paper · ${dateFormat.format(featured.entry.data.publishedAt)}`} />
            <div class="featured-title">{featured.entry.data.title}</div>
            <p class="featured-desc">{featured.entry.data.abstract}</p>
          </a>
        )
      }
      {
        morePapers.map(({ slug, entry }) => (
          <a class="row" href={`/papers/${slug}`}>
            <MetaChip text={`Paper · ${dateFormat.format(entry.data.publishedAt)}`} />
            <div class="row-title">{entry.data.title}</div>
            <p class="row-desc">{entry.data.abstract}</p>
          </a>
        ))
      }
    </div>

    <aside class="side-col" aria-label="Sidebar">
      <section class="side-block">
        <h3 class="side-label">Recent Posts</h3>
        {
          recentPosts.map(({ slug, entry }) => (
            <a class="side-item" href={`/posts/${slug}`}>
              <div class="side-item-title">{entry.data.title}</div>
              <p class="side-item-desc">{entry.data.lead}</p>
            </a>
          ))
        }
      </section>
      <section class="side-block">
        <h3 class="side-label">Tags</h3>
        <p class="tag-list">
          {
            allTags.map((t, i) => (
              <>
                {i > 0 && ' · '}
                <a href={`/tags/${t}`}>{t}</a>
              </>
            ))
          }
        </p>
      </section>
    </aside>
  </div>
</BaseLayout>

<style>
  .sub-header {
    padding: 36px var(--space-8) 20px var(--space-8);
    text-align: center;
    border-bottom: 1px solid var(--color-border);
  }
  .site-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-snug);
    margin: 0;
    color: var(--color-fg);
  }
  .site-sub {
    font-size: var(--text-2xs);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-muted);
    margin: var(--space-1) 0 0 0;
  }

  .magazine {
    max-width: var(--measure-magazine);
    margin: 0 auto;
    padding: 28px var(--space-8) 40px var(--space-8);
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-8);
  }
  .main-col {
    min-width: 0;
  }
  .featured {
    display: block;
    background: var(--gradient-featured);
    border: 1px solid var(--color-border-featured);
    padding: 28px 24px;
    border-radius: var(--radius-lg);
    text-decoration: none;
    color: var(--color-fg);
  }
  .featured-title {
    font-size: var(--text-xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--tracking-snug);
    margin: var(--space-2) 0;
  }
  .featured-desc {
    font-size: var(--text-sm);
    color: var(--color-text);
    margin: 0;
    line-height: var(--leading-normal);
  }
  .row {
    display: block;
    padding: var(--space-4) 0;
    border-bottom: 1px solid var(--color-border-soft);
    text-decoration: none;
    color: var(--color-fg);
  }
  .row:last-child {
    border-bottom: none;
  }
  .row-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--tracking-snug);
    margin: var(--space-1) 0 var(--space-1) 0;
  }
  .row-desc {
    font-size: var(--text-sm);
    color: var(--color-text);
    margin: 0;
    line-height: var(--leading-normal);
  }

  .side-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .side-block {
  }
  .side-label {
    font-size: var(--text-2xs);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-accent);
    margin: 0 0 var(--space-2) 0;
    font-weight: var(--font-weight-bold);
    border-bottom: 2px solid var(--color-accent);
    padding-bottom: 3px;
  }
  .side-item {
    display: block;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-soft);
    text-decoration: none;
    color: var(--color-fg);
  }
  .side-item:last-child {
    border-bottom: none;
  }
  .side-item-title {
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-1);
  }
  .side-item-desc {
    font-size: var(--text-2xs);
    color: var(--color-muted);
    margin: 0;
  }
  .tag-list {
    font-size: var(--text-sm);
    color: var(--color-muted);
    margin: 0;
  }
  .tag-list a {
    color: var(--color-accent);
    text-decoration: none;
  }
  .tag-list a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 760px) {
    .magazine {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 2: Verify build produces the home page**

Run: `npm run build && grep -c "Featured · Paper" dist/index.html`

Expected: build succeeds; grep returns `1` (the featured chip text is present).

### Task 6.4 — Commit Phase 6

- [ ] **Step 1: Commit**

```bash
git add src/pages/
git commit -m "feat(pages): add EN home (magazine grid), papers, and posts routes"
```

---

## Phase 7 — Smoke Verification

### Task 7.1 — Build + structural assertions

- [ ] **Step 1: Full build**

Run: `npm run build`

Expected: 5 pages built (`/`, `/papers`, `/papers/quicksort-partitioning`, `/posts`, `/posts/welcome`), plus sitemap.

- [ ] **Step 2: Assert the paper page has math, code, and a theorem block**

Run:

```bash
grep -c 'class="katex"' dist/papers/quicksort-partitioning/index.html
grep -c 'semantic--theorem' dist/papers/quicksort-partitioning/index.html
grep -c 'partition.ts' dist/papers/quicksort-partitioning/index.html
```

Expected: each `grep -c` returns a positive integer (≥ 1). This confirms KaTeX math rendered, the Theorem block reached the DOM, and the
code block retained its filename annotation.

- [ ] **Step 3: Assert JSON-LD for the paper is emitted**

Run: `grep -c 'ScholarlyArticle' dist/papers/quicksort-partitioning/index.html`

Expected: `1`.

- [ ] **Step 4: Assert hreflang alternates are present**

Run: `grep -c 'hreflang="pt-BR"' dist/papers/quicksort-partitioning/index.html`

Expected: `1`.

### Task 7.2 — Dev-server visual verification

This is the manual checkpoint. Start the dev server, open the site, walk through the pages. The agent running this plan should pause here
and prompt the operator to verify visually.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (runs in foreground; Ctrl-C to stop)

Expected: server starts on `http://localhost:4321`.

- [ ] **Step 2: Walk through these pages (operator)**

Open each URL and confirm:

1. `http://localhost:4321/` — home renders magazine grid, featured card has the gradient background (light mode), tags sidebar lists
   `algorithms · astro · complexity · meta · sorting · webdev`.
2. `http://localhost:4321/papers` — listing shows the one paper (newest first).
3. `http://localhost:4321/papers/quicksort-partitioning` — Tufte layout: main column with abstract, theorem, definition, proof, code block,
   inline code with rose chip; right rail with sidenote markers referenced from the prose.
4. `http://localhost:4321/posts` — listing shows the welcome post.
5. `http://localhost:4321/posts/welcome` — Classic Centered single column, title, lead, tag pills, prose, code block with traffic-light
   header, inline code chip.
6. Click the **theme toggle** in the header. Entire page flips to Nordic Muted dark (Frost accent, Polar Night background). No flash of
   wrong theme on reload.
7. Reload and confirm the stored theme persists.

- [ ] **Step 3: Stop the dev server**

Press Ctrl-C in the terminal running `npm run dev`.

### Task 7.3 — Final commit, quality gate, and tag

- [ ] **Step 1: Run full quality gate**

Run: `npm run check && npm test && npm run build`

Expected: all three exit 0, all tests pass, build produces 5 HTML pages.

- [ ] **Step 2: Verify working tree clean**

Run: `git status`

Expected: "nothing to commit, working tree clean".

- [ ] **Step 3: Tag milestone**

```bash
git tag -a v0.2.0-layouts-en -m "Plan 02 complete: layouts, components, EN pages, sample content"
```

---

## Done Criteria

Plan 02 is complete when ALL of the following are true:

1. `npm run check` exits 0 (0 errors, 0 warnings from `astro check`; 0 errors from markdownlint).
2. `npm test` exits 0 (21+ passing tests — Plan 01 tests still pass).
3. `npm run build` produces 5 HTML pages: `/`, `/papers`, `/papers/quicksort-partitioning`, `/posts`, `/posts/welcome`.
4. The paper page contains rendered KaTeX math, a Theorem accent box, a syntax-highlighted code block with traffic-light header, inline code
   with rose chip, and sidenote markers.
5. The post page has its Classic Centered layout with code block and inline code.
6. Home renders the magazine grid with the featured paper card and sidebar.
7. Theme toggle swaps to Nordic Muted dark without FOUC; preference persists across reloads.
8. `hreflang` alternates and page-type-specific JSON-LD are emitted on every page.
9. Working tree clean; git tag `v0.2.0-layouts-en` applied.

## What's Next

**Plan 03 (pt-BR mirror + tags + static pages)** adds: pt-BR route tree (`/pt-br/...`), LangToggle component, `/tags` and `/tags/[tag]`
pages, `/about`, `/cv`, and `/newsletter` static pages.
