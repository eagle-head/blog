# Blog — Plan 04: RSS, Sitemap, OG Images, IEEE Citations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the SEO / discoverability layer of the blog. RSS/Atom feeds (combined + per-collection × 2 locales), sitemap with `hreflang`
alternates + `robots.txt`, automatically-generated Open Graph images for every paper and post, and proper IEEE citation formatting in
`rehype-citation`.

**Architecture:** Feeds are Astro endpoint routes (`*.xml.ts`) that read the validated collections and emit `<rss>` via `@astrojs/rss`. The
sitemap integration reads Astro's i18n config and emits `<xhtml:link rel="alternate" hreflang="..."/>` entries automatically; a `filter`
function excludes draft content and dynamic `/og/*` paths. OG images are Astro static routes (`.png.ts`) that run Satori → SVG →
`@resvg/resvg-js` → PNG at build time, generating one image per {collection × slug × locale}. `rehype-citation` is re-configured with the
official IEEE CSL XML bundled in `public/csl/`.

**Tech Stack:** `@astrojs/rss` (already installed), `@astrojs/sitemap` (already installed), Satori + `@resvg/resvg-js` (already installed),
`rehype-citation` (already installed).

**Reference specs:**

- Architecture: `docs/superpowers/specs/2026-04-19-eduardokohn-blog-design.md`
- Visual design brief: `docs/superpowers/specs/2026-04-19-visual-design.md`

**Prerequisites:** Plan 03 complete (tag `v0.3.0-bilingual`). Working tree clean.

---

## Phase 1 — RSS Feeds

Six feed routes total: combined/papers/posts × {EN, pt-BR}. Shared helper keeps the route files tiny.

### Task 1.1 — Shared RSS helper

**Files:**

- Create: `/home/eduardo/Documents/blog/src/lib/rss.ts`

- [ ] **Step 1: Write the helper**

```ts
// src/lib/rss.ts
// Build per-locale RSS feeds for one collection or both merged. Returns the
// array of items ready for `@astrojs/rss` rss() — the caller is
// responsible for calling rss({ items: await buildRssItems(...), ... }) in
// a Response handler.
import type { RSSFeedItem } from '@astrojs/rss';
import { getLocalizedEntries } from './collections';
import type { Locale } from './content';
import { localePrefix } from './i18n';

export type FeedSource = 'papers' | 'posts' | 'both';

export async function buildRssItems(source: FeedSource, locale: Locale): Promise<RSSFeedItem[]> {
  const prefix = localePrefix(locale);
  const items: RSSFeedItem[] = [];

  if (source === 'papers' || source === 'both') {
    const papers = await getLocalizedEntries('papers', locale);
    for (const { slug, entry } of papers) {
      items.push({
        title: entry.data.title,
        pubDate: entry.data.publishedAt,
        description: entry.data.abstract,
        link: `${prefix}/papers/${slug}`,
        categories: entry.data.tags,
      });
    }
  }
  if (source === 'posts' || source === 'both') {
    const posts = await getLocalizedEntries('posts', locale);
    for (const { slug, entry } of posts) {
      items.push({
        title: entry.data.title,
        pubDate: entry.data.publishedAt,
        description: entry.data.lead,
        link: `${prefix}/posts/${slug}`,
        categories: entry.data.tags,
      });
    }
  }

  items.sort((a, b) => {
    const aT = a.pubDate ? a.pubDate.getTime() : 0;
    const bT = b.pubDate ? b.pubDate.getTime() : 0;
    return bT - aT;
  });
  return items;
}

export function feedMetaForLocale(locale: Locale, source: FeedSource) {
  const titles: Record<Locale, Record<FeedSource, string>> = {
    en: {
      both: 'Eduardo Kohn — All',
      papers: 'Eduardo Kohn — Papers',
      posts: 'Eduardo Kohn — Posts',
    },
    'pt-BR': {
      both: 'Eduardo Kohn — Tudo',
      papers: 'Eduardo Kohn — Artigos',
      posts: 'Eduardo Kohn — Posts',
    },
  };
  const descriptions: Record<Locale, Record<FeedSource, string>> = {
    en: {
      both: 'Papers and posts on computer science.',
      papers: 'Computer-science papers by Eduardo Kohn.',
      posts: 'Short technical posts by Eduardo Kohn.',
    },
    'pt-BR': {
      both: 'Artigos e posts sobre ciência da computação.',
      papers: 'Artigos científicos por Eduardo Kohn.',
      posts: 'Posts técnicos curtos por Eduardo Kohn.',
    },
  };
  return {
    title: titles[locale][source],
    description: descriptions[locale][source],
  };
}
```

- [ ] **Step 2: Verify types**

Run: `npx astro sync && npx astro check`

Expected: 0 errors.

### Task 1.2 — EN feeds: combined, papers, posts

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/rss.xml.ts`
- Create: `/home/eduardo/Documents/blog/src/pages/papers.rss.xml.ts`
- Create: `/home/eduardo/Documents/blog/src/pages/posts.rss.xml.ts`

- [ ] **Step 1: Combined EN feed**

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { buildRssItems, feedMetaForLocale } from '../lib/rss';

export async function GET(context: APIContext) {
  const items = await buildRssItems('both', 'en');
  const meta = feedMetaForLocale('en', 'both');
  return rss({
    title: meta.title,
    description: meta.description,
    site: context.site ?? 'https://eduardokohn.com',
    items,
    customData: `<language>en</language>`,
  });
}
```

- [ ] **Step 2: Papers EN feed**

```ts
// src/pages/papers.rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { buildRssItems, feedMetaForLocale } from '../lib/rss';

export async function GET(context: APIContext) {
  const items = await buildRssItems('papers', 'en');
  const meta = feedMetaForLocale('en', 'papers');
  return rss({
    title: meta.title,
    description: meta.description,
    site: context.site ?? 'https://eduardokohn.com',
    items,
    customData: `<language>en</language>`,
  });
}
```

- [ ] **Step 3: Posts EN feed**

```ts
// src/pages/posts.rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { buildRssItems, feedMetaForLocale } from '../lib/rss';

export async function GET(context: APIContext) {
  const items = await buildRssItems('posts', 'en');
  const meta = feedMetaForLocale('en', 'posts');
  return rss({
    title: meta.title,
    description: meta.description,
    site: context.site ?? 'https://eduardokohn.com',
    items,
    customData: `<language>en</language>`,
  });
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build && ls dist/rss.xml dist/papers.rss.xml dist/posts.rss.xml`

Expected: three `.xml` files exist.

### Task 1.3 — pt-BR feeds (3 mirrors)

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/rss.xml.ts`
- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/papers.rss.xml.ts`
- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/posts.rss.xml.ts`

- [ ] **Step 1: pt-BR combined**

```ts
// src/pages/pt-br/rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { buildRssItems, feedMetaForLocale } from '../../lib/rss';

export async function GET(context: APIContext) {
  const items = await buildRssItems('both', 'pt-BR');
  const meta = feedMetaForLocale('pt-BR', 'both');
  return rss({
    title: meta.title,
    description: meta.description,
    site: context.site ?? 'https://eduardokohn.com',
    items,
    customData: `<language>pt-BR</language>`,
  });
}
```

- [ ] **Step 2: pt-BR papers**

```ts
// src/pages/pt-br/papers.rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { buildRssItems, feedMetaForLocale } from '../../lib/rss';

export async function GET(context: APIContext) {
  const items = await buildRssItems('papers', 'pt-BR');
  const meta = feedMetaForLocale('pt-BR', 'papers');
  return rss({
    title: meta.title,
    description: meta.description,
    site: context.site ?? 'https://eduardokohn.com',
    items,
    customData: `<language>pt-BR</language>`,
  });
}
```

- [ ] **Step 3: pt-BR posts**

```ts
// src/pages/pt-br/posts.rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { buildRssItems, feedMetaForLocale } from '../../lib/rss';

export async function GET(context: APIContext) {
  const items = await buildRssItems('posts', 'pt-BR');
  const meta = feedMetaForLocale('pt-BR', 'posts');
  return rss({
    title: meta.title,
    description: meta.description,
    site: context.site ?? 'https://eduardokohn.com',
    items,
    customData: `<language>pt-BR</language>`,
  });
}
```

- [ ] **Step 4: Verify**

Run: `npm run build && ls dist/pt-br/rss.xml dist/pt-br/papers.rss.xml dist/pt-br/posts.rss.xml`

Expected: three pt-BR `.xml` files exist.

### Task 1.4 — Update Footer RSS link per-locale

Footer link always points to `/rss.xml` today. Make it locale-aware.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/components/Footer.astro`

- [ ] **Step 1: Rewrite the component**

```astro
---
// src/components/Footer.astro
// Brief §6.2 — Site footer. RSS link resolves to the current locale's feed.
import { detectLocaleFromPath, localePrefix } from '../lib/i18n';

const year = new Date().getFullYear();
const locale = detectLocaleFromPath(Astro.url.pathname);
const prefix = localePrefix(locale);
const rssHref = `${prefix}/rss.xml`;
const newsletterHref = `${prefix}/newsletter`;
---

<footer class="site-footer">
  <span>© {year} Eduardo Kohn</span>
  <span class="links">
    <a href={rssHref}>RSS</a>
    <span class="sep">·</span>
    <a href={newsletterHref}>Newsletter</a>
    <span class="sep">·</span>
    <a href="https://github.com/eagle-head" rel="me noopener">GitHub</a>
  </span>
</footer>

<style>
  .site-footer {
    padding: 20px var(--space-8);
    border-top: 1px solid var(--color-border);
    font-size: var(--text-sm);
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

- [ ] **Step 2: Verify build + link correctness**

Run: `npm run build && grep -oE 'href="[^"]*rss\.xml"' dist/index.html && grep -oE 'href="[^"]*rss\.xml"' dist/pt-br/index.html`

Expected: EN home shows `href="/rss.xml"`; pt-BR home shows `href="/pt-br/rss.xml"`.

### Task 1.5 — Commit Phase 1

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat(feeds): add RSS feeds (combined, papers, posts) for EN and pt-BR"
```

---

## Phase 2 — Sitemap + robots.txt

### Task 2.1 — Configure sitemap i18n

`@astrojs/sitemap` accepts an `i18n` option that emits `<xhtml:link rel="alternate" hreflang="..."/>` for each page.

**Files:**

- Modify: `/home/eduardo/Documents/blog/astro.config.mjs`

- [ ] **Step 1: Update integrations array**

Replace the existing `sitemap()` call with:

```js
sitemap({
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: 'en',
      'pt-BR': 'pt-BR',
    },
  },
  filter: (page) => {
    // Exclude dynamic asset endpoints from the sitemap.
    if (page.includes('/og/')) return false;
    return true;
  },
}),
```

- [ ] **Step 2: Verify build**

Run: `npm run build && head -40 dist/sitemap-0.xml`

Expected: XML contains `<xhtml:link rel="alternate" hreflang="en" ...>` and `<xhtml:link rel="alternate" hreflang="pt-BR" ...>` entries
alongside canonical URLs.

### Task 2.2 — Add `robots.txt`

**Files:**

- Create: `/home/eduardo/Documents/blog/public/robots.txt`

- [ ] **Step 1: Write the file**

```text
User-agent: *
Allow: /

Sitemap: https://eduardokohn.com/sitemap-index.xml
```

- [ ] **Step 2: Verify build**

Run: `npm run build && cat dist/robots.txt`

Expected: file is copied to `dist/` verbatim.

### Task 2.3 — Commit Phase 2

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat(seo): configure sitemap hreflang and add robots.txt"
```

---

## Phase 3 — Open Graph Images

Dynamic OG images per entry per locale at build time. Satori renders JSX to SVG; resvg converts SVG to PNG.

### Task 3.1 — Add Inter font file for Satori

Satori requires font data as `ArrayBuffer`, not CSS. The `@fontsource-variable/inter` package ships WOFF2 only, which Satori does not accept
directly. Bundle an Inter TTF explicitly for OG generation.

**Files:**

- Create: `/home/eduardo/Documents/blog/public/fonts/og/Inter-Bold.ttf`
- Create: `/home/eduardo/Documents/blog/public/fonts/og/Inter-Regular.ttf`

- [ ] **Step 1: Fetch Inter TTF files from the official Inter repo**

Run:

```bash
mkdir -p public/fonts/og
curl -L -o public/fonts/og/Inter-Regular.ttf \
  https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.otf
curl -L -o public/fonts/og/Inter-Bold.ttf \
  https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.otf
ls -la public/fonts/og/
```

Expected: two files, each ~300 KB. (The files are named `.ttf` for convention even though the source is OTF — Satori accepts both and many
tutorials standardise on the `.ttf` extension.)

Note: if the Inter repo's `docs/font-files/` path has moved, the alternate source is the Inter release ZIP on GitHub:
`https://github.com/rsms/inter/releases/latest`.

### Task 3.2 — OG template helper

**Files:**

- Create: `/home/eduardo/Documents/blog/src/lib/og.ts`

- [ ] **Step 1: Write the helper**

```ts
// src/lib/og.ts
// Build an Open Graph PNG for a single entry: returns a PNG Buffer.
import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import type { Locale } from './content';

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts', 'og');

let cachedFonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[] | null = null;

async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const [regular, bold] = await Promise.all([
    fs.readFile(path.join(FONT_DIR, 'Inter-Regular.ttf')),
    fs.readFile(path.join(FONT_DIR, 'Inter-Bold.ttf')),
  ]);
  cachedFonts = [
    {
      name: 'Inter',
      data: regular.buffer.slice(regular.byteOffset, regular.byteOffset + regular.byteLength),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: bold.buffer.slice(bold.byteOffset, bold.byteOffset + bold.byteLength),
      weight: 700,
      style: 'normal',
    },
  ];
  return cachedFonts;
}

export type OgParams = {
  kind: 'paper' | 'post';
  title: string;
  description: string;
  date: Date;
  locale: Locale;
};

export async function renderOgImage(params: OgParams): Promise<Buffer> {
  const fonts = await loadFonts();
  const dateLabel = new Intl.DateTimeFormat(params.locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(params.date);
  const kindLabel = params.kind === 'paper' ? 'PAPER' : 'POST';
  const accent = '#9d174d';

  const tree = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '630px',
        padding: '64px 80px',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fef3c7 100%)',
        fontFamily: 'Inter',
        color: '#0a0a0a',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '16px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: accent,
                  },
                  children: `${kindLabel} · ${dateLabel.toUpperCase()}`,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '64px',
                    fontWeight: 700,
                    lineHeight: 1.08,
                    letterSpacing: '-0.025em',
                    maxWidth: '1040px',
                  },
                  children: params.title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '28px',
                    fontWeight: 400,
                    lineHeight: 1.4,
                    color: '#262626',
                    maxWidth: '1040px',
                  },
                  children: params.description,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              fontSize: '24px',
              fontWeight: 700,
              color: '#0a0a0a',
            },
            children: 'Eduardo Kohn · eduardokohn.com',
          },
        },
      ],
    },
  };

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg);
  const pngBuffer = resvg.render().asPng();
  return Buffer.from(pngBuffer);
}
```

- [ ] **Step 2: Verify types**

Run: `npx astro check`

Expected: 0 errors.

### Task 3.3 — OG endpoint

One static route that enumerates every { collection, slug, locale } and emits a PNG per path.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/og/[collection]/[slug]-[lang].png.ts`

- [ ] **Step 1: Write the endpoint**

```ts
// src/pages/og/[collection]/[slug]-[lang].png.ts
import type { APIContext, APIRoute, GetStaticPaths } from 'astro';
import { getValidatedCollection } from '../../../lib/collections';
import { renderOgImage } from '../../../lib/og';

type Params = { collection: 'papers' | 'posts'; slug: string; lang: 'en' | 'pt-br' };

export const getStaticPaths: GetStaticPaths = async () => {
  const [papers, posts] = await Promise.all([getValidatedCollection('papers'), getValidatedCollection('posts')]);
  const out: { params: Params }[] = [];
  for (const [slug] of Object.entries(papers)) {
    out.push({ params: { collection: 'papers', slug, lang: 'en' } });
    out.push({ params: { collection: 'papers', slug, lang: 'pt-br' } });
  }
  for (const [slug] of Object.entries(posts)) {
    out.push({ params: { collection: 'posts', slug, lang: 'en' } });
    out.push({ params: { collection: 'posts', slug, lang: 'pt-br' } });
  }
  return out;
};

export const GET: APIRoute = async (context: APIContext) => {
  const { collection, slug, lang } = context.params as unknown as Params;
  const locale = lang === 'pt-br' ? ('pt-BR' as const) : ('en' as const);

  if (collection === 'papers') {
    const groups = await getValidatedCollection('papers');
    const entry = groups[slug!]?.[locale];
    if (!entry) return new Response('Not found', { status: 404 });
    const png = await renderOgImage({
      kind: 'paper',
      title: entry.data.title,
      description: entry.data.abstract,
      date: entry.data.publishedAt,
      locale,
    });
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  } else {
    const groups = await getValidatedCollection('posts');
    const entry = groups[slug!]?.[locale];
    if (!entry) return new Response('Not found', { status: 404 });
    const png = await renderOgImage({
      kind: 'post',
      title: entry.data.title,
      description: entry.data.lead,
      date: entry.data.publishedAt,
      locale,
    });
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  }
};
```

- [ ] **Step 2: Verify build produces PNGs**

Run:

```bash
npm run build
ls dist/og/papers/quicksort-partitioning-en.png
ls dist/og/papers/quicksort-partitioning-pt-br.png
ls dist/og/posts/welcome-en.png
ls dist/og/posts/welcome-pt-br.png
```

Expected: all four PNGs exist. Each file should be ~30–80 KB.

### Task 3.4 — Wire `ogImage` prop in layouts

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/layouts/PaperLayout.astro`
- Modify: `/home/eduardo/Documents/blog/src/layouts/PostLayout.astro`

- [ ] **Step 1: Update PaperLayout to pass ogImage**

Find the `<SEO ... />` invocation inside `src/layouts/PaperLayout.astro` and add `ogImage`:

```astro
<SEO
  slot="head"
  title={`${title} — Eduardo Kohn`}
  description={abstract}
  canonicalPath={canonicalPath}
  ogImage={`/og/papers/${canonicalPath.replace('/papers/', '')}-${language === 'en' ? 'en' : 'pt-br'}.png`}
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
```

- [ ] **Step 2: Update PostLayout analogously**

In `src/layouts/PostLayout.astro`:

```astro
<SEO
  slot="head"
  title={`${title} — Eduardo Kohn`}
  description={lead}
  canonicalPath={canonicalPath}
  ogImage={`/og/posts/${canonicalPath.replace('/posts/', '')}-${language === 'en' ? 'en' : 'pt-br'}.png`}
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
```

- [ ] **Step 3: Verify the meta tag is emitted**

Run: `npm run build && grep -oE 'og:image" content="[^"]*"' dist/papers/quicksort-partitioning/index.html`

Expected: prints `og:image" content="/og/papers/quicksort-partitioning-en.png"`.

The `SEO.astro` component already prefixes with `Astro.site`; the relative path passed here is joined internally — check the existing
implementation before changing SEO.astro. If SEO.astro does not prepend the site, the paper page will emit a relative `og:image` which is
acceptable for build verification but should be made absolute in the SEO component. If that adjustment is needed, add this step:

**Step 3b (only if og:image lacks scheme + host):** in `src/components/SEO.astro`, change the `ogImage` `<meta>` to prepend `site` when a
relative path is provided:

```astro
{ogImage && <meta property="og:image" content={ogImage.startsWith('http') ? ogImage : `${site}${ogImage}`} />}
```

And do the same for `twitter:image`. After the change, re-run the grep.

### Task 3.5 — Commit Phase 3

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat(seo): generate per-entry Open Graph images with Satori"
```

---

## Phase 4 — IEEE Citations

### Task 4.1 — Add the IEEE CSL XML

**Files:**

- Create: `/home/eduardo/Documents/blog/public/csl/ieee.csl`

- [ ] **Step 1: Download the official IEEE CSL**

Run:

```bash
mkdir -p public/csl
curl -L -o public/csl/ieee.csl \
  https://raw.githubusercontent.com/citation-style-language/styles/master/ieee.csl
wc -l public/csl/ieee.csl
```

Expected: file is ~200–400 lines of XML/CSL.

### Task 4.2 — Configure rehype-citation

**Files:**

- Modify: `/home/eduardo/Documents/blog/astro.config.mjs`

- [ ] **Step 1: Point rehype-citation to the IEEE CSL**

Replace the existing `rehypeCitation` entry in `rehypePlugins`:

```js
[
  rehypeCitation,
  {
    // Absolute path resolution at build time — Astro reads the file
    // directly from the working directory.
    csl: './public/csl/ieee.csl',
    linkCitations: true,
  },
],
```

- [ ] **Step 2: Verify build renders IEEE-style citations**

Run: `npm run build && grep -c 'class="csl-entry"' dist/papers/quicksort-partitioning/index.html`

Expected: at least `2` (one per reference in `references.bib`).

### Task 4.3 — Commit Phase 4

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat(mdx): configure rehype-citation with bundled IEEE CSL"
```

---

## Phase 5 — Smoke Verification and Tag

### Task 5.1 — Full quality gate

- [ ] **Step 1: Run every gate**

Run: `npm run check && npm test && npm run build`

Expected: all three exit 0.

- [ ] **Step 2: Structural assertions**

Run:

```bash
# RSS feeds
ls dist/rss.xml dist/papers.rss.xml dist/posts.rss.xml
ls dist/pt-br/rss.xml dist/pt-br/papers.rss.xml dist/pt-br/posts.rss.xml
# each has at least one <item>
grep -c '<item>' dist/rss.xml
grep -c '<item>' dist/papers.rss.xml
# sitemap has hreflang
grep -c 'xhtml:link' dist/sitemap-0.xml
# robots
cat dist/robots.txt
# OG PNGs
ls dist/og/papers/*.png dist/og/posts/*.png
# IEEE citations
grep -c 'csl-entry' dist/papers/quicksort-partitioning/index.html
# og:image is emitted
grep -c 'property="og:image"' dist/papers/quicksort-partitioning/index.html
```

Expected: all commands succeed with non-zero counts where applicable.

### Task 5.2 — Final commit and tag

- [ ] **Step 1: Working tree check**

Run: `git status`

Expected: "nothing to commit, working tree clean".

- [ ] **Step 2: Tag milestone**

```bash
git tag -a v0.4.0-seo -m "Plan 04 complete: RSS feeds, sitemap hreflang, OG images, IEEE citations"
```

---

## Done Criteria

Plan 04 is complete when ALL of the following are true:

1. `npm run check` exits 0.
2. `npm test` exits 0 (Plan 01/03 tests still pass).
3. `npm run build` emits:
   - 6 RSS feeds (`dist/rss.xml`, `dist/papers.rss.xml`, `dist/posts.rss.xml`, and three pt-BR mirrors)
   - Sitemap with `xhtml:link` hreflang entries
   - `robots.txt` in `dist/`
   - One OG PNG per entry per locale (4 total given current sample content: 2 papers × 1 = 2; 2 posts × 1 = 2 ... i.e., one paper + one post
     × 2 locales = 4 PNGs)
   - Paper citations render IEEE-style via `rehype-citation`
4. `og:image` meta tag is present on every paper and post page.
5. Working tree clean; tag `v0.4.0-seo` applied.

## What's Next

**Plan 05 (Islands)** adds: Pagefind-powered Command Palette island, Giscus comments (opt-in per post), Cloudflare Web Analytics snippet,
and wires the Buttondown newsletter form in the header. After Plan 05 the site has its full interactive surface.
