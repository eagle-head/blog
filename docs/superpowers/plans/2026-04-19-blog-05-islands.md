# Blog — Plan 05: Islands (Command Palette, Comments, Analytics)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the three client-side islands the brief calls for: a keyboard-driven Command Palette (Ctrl/Cmd+K, `/`) backed by Pagefind,
Giscus comments opt-in per paper/post, and privacy-preserving Cloudflare Web Analytics. Every island must be lazy-mounted so the zero-JS
reading experience on a cold paper or post page stays intact.

**Architecture:** Pagefind is generated at `build` time by the already-installed `astro-pagefind` integration; the palette is a Preact
island split into a tiny host (`CommandPaletteHost.tsx`, mounted `client:idle`) and a heavy panel (`CommandPalettePanel.tsx`) dynamically
imported on first open — so cold paper/post pages pay nothing for the palette until the reader actually asks for it. Giscus is an Astro
component placed below the content slot in `PaperLayout`/`PostLayout` and gated by a `comments` boolean in the Zod schema. Cloudflare Web
Analytics is a single `<script is:inline defer>` tag emitted from `BaseLayout` only when the `PUBLIC_CF_ANALYTICS_TOKEN` env var is set —
absent in dev, present in prod — so local builds never ping the beacon.

**Tech Stack:** `astro-pagefind@^1.8.6` + `pagefind@^1.5.2` (installed), Preact (installed), Giscus (script-only, no package), Cloudflare
Web Analytics (script-only, no package).

**Reference specs:**

- Architecture: `docs/superpowers/specs/2026-04-19-eduardokohn-blog-design.md`
- Visual design brief: `docs/superpowers/specs/2026-04-19-visual-design.md`

**Prerequisites:** Plan 04 complete (tag `v0.4.0-seo`). Working tree clean. Repository public on GitHub with Discussions enabled and a
Giscus app installed — the repo identifiers must be available at build time (fallback: placeholders + `.env.example` doc).

**Constraints (from the brief):**

- Minimum JavaScript. Palette and comments are the _only_ routes that ever ship meaningful JS; analytics is a tiny beacon.
- Dark Always for the palette modal (matches `github-dark` code blocks).
- Palette hotkeys: `Ctrl/Cmd+K` _and_ `/` when no input is focused; `Esc` closes.
- Giscus must not run on draft pages, and must inherit the current theme (light/dark).
- Cloudflare Web Analytics only (no Google, no GA4, no cookies).

---

## Phase 1 — Pagefind Integration

`astro-pagefind` is installed but not in `astro.config.mjs`. Its `astro:build:done` hook runs Pagefind over `dist/` and writes the index to
`dist/pagefind/*`. In dev the integration's middleware serves the last-built index from `dist/` so the palette works during `astro dev`
_after_ one `astro build` has completed.

### Task 1.1 — Register the integration

**Files:**

- Modify: `/home/eduardo/Documents/blog/astro.config.mjs`

- [ ] **Step 1: Add the import**

At the top of `astro.config.mjs`, alongside the other `@astrojs/*` imports, add:

```js
import pagefind from 'astro-pagefind';
```

- [ ] **Step 2: Register it in `integrations`**

Inside the `integrations` array, add `pagefind()` **after** `mdx()` / `preact()` and **before** `sitemap(...)`:

```js
integrations: [
  mdx(),
  preact(),
  pagefind(),
  sitemap({ /* unchanged */ }),
],
```

- [ ] **Step 3: Run the build**

```bash
npm run build
```

Expected: the build log ends with lines like `[pagefind] Pagefind indexed N pages` and
`[pagefind] Pagefind wrote index to /home/eduardo/Documents/blog/dist/pagefind`. Verify the directory exists:

```bash
ls dist/pagefind/
```

Expected: `pagefind.js`, `wasm/`, `fragment/`, `index/`, `pagefind-entry.json`.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(search): register astro-pagefind integration"
```

---

### Task 1.2 — Mark paper/post articles as Pagefind bodies

Pagefind indexes anything with `data-pagefind-body` (or, absent that, the whole `<body>`). We want only article content indexed, not the
header, footer, tag cloud, lang toggle, etc.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/layouts/PaperLayout.astro`
- Modify: `/home/eduardo/Documents/blog/src/layouts/PostLayout.astro`

- [ ] **Step 1: Annotate the paper article**

In `PaperLayout.astro`, change the opening `<article class="paper">` to include the Pagefind attributes (body, meta, filter). Only the
opening tag changes — keep the existing children and `</article>` as-is:

<!-- prettier-ignore -->
```text
<article
  class="paper"
  data-pagefind-body
  data-pagefind-meta={`kind:paper,lang:${language}`}
  data-pagefind-filter={`kind:paper,lang:${language}`}
>
```

- [ ] **Step 2: Annotate the post article**

In `PostLayout.astro`, mirror the change on `<article class="post">` (opening tag only):

<!-- prettier-ignore -->
```text
<article
  class="post"
  data-pagefind-body
  data-pagefind-meta={`kind:post,lang:${language}`}
  data-pagefind-filter={`kind:post,lang:${language}`}
>
```

- [ ] **Step 3: Rebuild and spot-check the index**

```bash
npm run build
```

Expected: Pagefind log reports the same page count as the `astro build` log reports for paper+post routes (4 total from samples:
quicksort-partitioning en/pt-br + welcome en/pt-br).

- [ ] **Step 4: Commit**

```bash
git add src/layouts/PaperLayout.astro src/layouts/PostLayout.astro
git commit -m "feat(search): mark paper/post articles as pagefind bodies with kind+lang filters"
```

---

### Task 1.3 — Exclude listing pages from the index

Listing pages (/papers, /posts, /tags, static pages) duplicate content already indexed through the detail pages and pollute results. Add
`data-pagefind-ignore` on the outermost content container.

**Files (only those that actually exist — step 1 prunes the list):**

- Modify: `src/pages/papers.astro`
- Modify: `src/pages/posts.astro`
- Modify: `src/pages/tags/index.astro`
- Modify: `src/pages/tags/[tag].astro`
- Modify: `src/pages/pt-br/papers.astro`
- Modify: `src/pages/pt-br/posts.astro`
- Modify: `src/pages/pt-br/tags/index.astro`
- Modify: `src/pages/pt-br/tags/[tag].astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/pt-br/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/pt-br/about.astro`
- Modify: `src/pages/cv.astro`
- Modify: `src/pages/pt-br/cv.astro`
- Modify: `src/pages/newsletter.astro`
- Modify: `src/pages/pt-br/newsletter.astro`

- [ ] **Step 1: Confirm which files exist**

```bash
ls src/pages/ src/pages/pt-br/ src/pages/tags/ src/pages/pt-br/tags/ 2>/dev/null
```

Drop any non-existent file from the work.

- [ ] **Step 2: Add `data-pagefind-ignore` to each listing page's top-level container**

For each file, find the outermost content element that wraps all listings (commonly `<section class="listing">` or the `<article>` on static
pages) and add the attribute. Example for `src/pages/papers.astro`:

<!-- prettier-ignore -->
```text
// before
<section class="listing">

// after
<section class="listing" data-pagefind-ignore>
```

For home pages (magazine grid), annotate the outermost `<section>` inside `<main>`. For `about.astro`, `cv.astro`, `newsletter.astro`,
annotate the `<article>` wrapper — palette results are scoped to papers + posts per the brief, and static pages shouldn't appear.

- [ ] **Step 3: Rebuild and verify**

```bash
npm run build
```

Expected: `[pagefind] indexed N pages` count equals the number of `<article data-pagefind-body>` pages (4 with sample content). If higher,
find which listing leaked via the build log's "Indexing page" messages.

- [ ] **Step 4: Commit**

```bash
git add src/pages/
git commit -m "feat(search): ignore listing/static pages from pagefind index"
```

---

## Phase 2 — Command Palette Island

Two files: a small host that loads on every page (hotkey listener + open state) and a heavy panel that's dynamic-imported on first open
(result rendering + Pagefind client).

### Task 2.1 — Translations for the palette

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/lib/ui.ts`

- [ ] **Step 1: Add the palette strings**

Inside the `strings` object, after the `'search.label'` entry, add:

```ts
'search.empty': { en: 'Type to search\u2026', 'pt-BR': 'Digite para buscar\u2026' },
'search.no-results': { en: 'No results.', 'pt-BR': 'Nenhum resultado.' },
'search.loading': { en: 'Loading\u2026', 'pt-BR': 'Carregando\u2026' },
'search.close': { en: 'Close', 'pt-BR': 'Fechar' },
'search.filter.all': { en: 'All', 'pt-BR': 'Tudo' },
'search.filter.papers': { en: 'Papers', 'pt-BR': 'Artigos' },
'search.filter.posts': { en: 'Posts', 'pt-BR': 'Posts' },
```

- [ ] **Step 2: Run the existing unit tests**

```bash
npm test
```

Expected: all tests pass (only UI keys added, no behavior changed).

- [ ] **Step 3: Commit**

```bash
git add src/lib/ui.ts
git commit -m "feat(i18n): add command-palette UI strings"
```

---

### Task 2.2 — Palette host (hotkeys + open state)

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/CommandPaletteHost.tsx`

- [ ] **Step 1: Write the host component**

```tsx
// src/components/CommandPaletteHost.tsx
import { useEffect, useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import type { Locale } from '../lib/content';

interface Props {
  locale: Locale;
}

type PanelComponent = FunctionalComponent<{ locale: Locale; onClose: () => void }>;

const CommandPaletteHost: FunctionalComponent<Props> = ({ locale }) => {
  const [open, setOpen] = useState(false);
  const [Panel, setPanel] = useState<PanelComponent | null>(null);

  useEffect(() => {
    function openPalette() {
      setOpen(true);
      if (!Panel) {
        void import('./CommandPalettePanel').then((m) => setPanel(() => m.default));
      }
    }
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.key === '/' && !mod) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        if (t?.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        openPalette();
      }
    }
    function onTrigger() {
      openPalette();
    }
    const trigger = document.getElementById('cmdk-trigger');
    window.addEventListener('keydown', onKey);
    trigger?.addEventListener('click', onTrigger);
    return () => {
      window.removeEventListener('keydown', onKey);
      trigger?.removeEventListener('click', onTrigger);
    };
  }, [Panel]);

  if (!open || !Panel) return null;
  return <Panel locale={locale} onClose={() => setOpen(false)} />;
};

export default CommandPaletteHost;
```

- [ ] **Step 2: TypeScript check**

```bash
npm run check
```

Expected: one error pointing to the missing `./CommandPalettePanel` module. Task 2.3 creates it.

- [ ] **Step 3: Do NOT commit yet — Task 2.3 provides the missing module.**

---

### Task 2.3 — Palette panel (Pagefind + UI)

Pagefind's `excerpt` field returns an HTML fragment where match tokens are wrapped in `<mark>…</mark>` (everything else is already escaped
at build time). We parse the `<mark>` boundaries ourselves and render each segment as either a plain `<span>` or a `<mark>` element — never
touching the DOM's raw HTML sink. This preserves the match-highlight UX while being XSS-proof by construction.

A small helper decodes the five HTML entities Pagefind emits (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`) so accented text reads naturally
without re-escaping.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/CommandPalettePanel.tsx`

- [ ] **Step 1: Write the panel component**

```tsx
// src/components/CommandPalettePanel.tsx
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import type { Locale } from '../lib/content';
import { t } from '../lib/ui';

interface PagefindSubResult {
  url: string;
  excerpt: string;
  meta: { title?: string } & Record<string, string>;
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindSubResult>;
}
interface PagefindApi {
  search: (q: string, opts?: { filters?: Record<string, string | string[]> }) => Promise<{ results: PagefindResult[] }>;
  options?: (o: Record<string, unknown>) => void;
}

type Kind = 'all' | 'paper' | 'post';

interface Props {
  locale: Locale;
  onClose: () => void;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function Excerpt({ html }: { html: string }) {
  // Pagefind excerpts are HTML fragments containing only <mark>…</mark> tags.
  // Parse by hand so we render pure JSX (no raw HTML sink, no XSS surface).
  const parts: { text: string; mark: boolean }[] = [];
  const re = /<mark>([\s\S]*?)<\/mark>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) parts.push({ text: decodeEntities(html.slice(last, m.index)), mark: false });
    parts.push({ text: decodeEntities(m[1]), mark: true });
    last = m.index + m[0].length;
  }
  if (last < html.length) parts.push({ text: decodeEntities(html.slice(last)), mark: false });
  return (
    <span class="cmdk-hit-excerpt">{parts.map((p, i) => (p.mark ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}</span>
  );
}

const CommandPalettePanel: FunctionalComponent<Props> = ({ locale, onClose }) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PagefindSubResult[]>([]);
  const pagefindRef = useRef<PagefindApi | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mod = (await import(/* @vite-ignore */ '/pagefind/pagefind.js')) as PagefindApi;
        if (!alive) return;
        mod.options?.({ excerptLength: 24 });
        pagefindRef.current = mod;
      } catch {
        // Pagefind index is produced at build time. In dev it loads only
        // after one prior `astro build`.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const pf = pagefindRef.current;
    if (!pf) return;
    setLoading(true);
    const handle = setTimeout(async () => {
      const filters: Record<string, string> = { lang: locale };
      if (kind !== 'all') filters.kind = kind;
      const { results: hits } = await pf.search(query, { filters });
      const top = await Promise.all(hits.slice(0, 8).map((r) => r.data()));
      setResults(top);
      setLoading(false);
    }, 120);
    return () => clearTimeout(handle);
  }, [query, kind, locale]);

  const kinds: { id: Kind; label: string }[] = useMemo(
    () => [
      { id: 'all', label: t(locale, 'search.filter.all') },
      { id: 'paper', label: t(locale, 'search.filter.papers') },
      { id: 'post', label: t(locale, 'search.filter.posts') },
    ],
    [locale],
  );

  return (
    <div
      class="cmdk-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t(locale, 'search.label')}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div class="cmdk-panel">
        <input
          ref={inputRef}
          class="cmdk-input"
          type="search"
          value={query}
          placeholder={t(locale, 'search.placeholder')}
          aria-label={t(locale, 'search.label')}
          onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
        />
        <div class="cmdk-filters" role="tablist">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={kind === k.id}
              class={`cmdk-chip ${kind === k.id ? 'is-active' : ''}`}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div class="cmdk-results" role="listbox">
          {loading ? (
            <p class="cmdk-hint">{t(locale, 'search.loading')}</p>
          ) : !query.trim() ? (
            <p class="cmdk-hint">{t(locale, 'search.empty')}</p>
          ) : results.length === 0 ? (
            <p class="cmdk-hint">{t(locale, 'search.no-results')}</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.url}>
                  <a href={r.url} class="cmdk-hit" onClick={onClose}>
                    <span class="cmdk-hit-title">{r.meta.title ?? r.url}</span>
                    <Excerpt html={r.excerpt} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalettePanel;
```

- [ ] **Step 2: TypeScript check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit host + panel together**

```bash
git add src/components/CommandPaletteHost.tsx src/components/CommandPalettePanel.tsx
git commit -m "feat(search): add command palette preact island (host + lazy panel)"
```

---

### Task 2.4 — Palette styles

The palette inherits Dark Always. We use fixed hex values for the overlay and the panel surface to match `github-dark`, rather than the
`--color-*` tokens (which flip between light and dark modes). Same pattern as the code-block chrome.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/styles/global.css`

- [ ] **Step 1: Append the palette block**

Add at the end of the file:

```css
/* Command Palette — Dark Always (brief §5.6). */
.cmdk-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 17, 23, 0.72);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh var(--space-4) var(--space-4);
  z-index: 9999;
  backdrop-filter: blur(2px);
}
.cmdk-panel {
  width: min(640px, 100%);
  background: #0d1117;
  color: #c9d1d9;
  border: 1px solid #30363d;
  border-radius: var(--radius-md);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}
.cmdk-input {
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  color: inherit;
  border: 0;
  border-bottom: 1px solid #30363d;
  font: inherit;
  font-size: var(--text-base);
  outline: none;
}
.cmdk-input::placeholder {
  color: #8b949e;
}
.cmdk-filters {
  display: flex;
  gap: var(--space-2);
  padding: 10px 16px;
  border-bottom: 1px solid #30363d;
}
.cmdk-chip {
  padding: 4px 10px;
  background: transparent;
  color: #8b949e;
  border: 1px solid #30363d;
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
}
.cmdk-chip.is-active {
  background: #21262d;
  color: #c9d1d9;
  border-color: #8b949e;
}
.cmdk-results {
  overflow-y: auto;
  padding: var(--space-2) 0;
}
.cmdk-results ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.cmdk-hit {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 16px;
  color: inherit;
  text-decoration: none;
  border-left: 2px solid transparent;
}
.cmdk-hit:hover,
.cmdk-hit:focus {
  background: #161b22;
  border-left-color: var(--color-accent);
}
.cmdk-hit-title {
  font-weight: var(--font-weight-bold);
  color: #c9d1d9;
}
.cmdk-hit-excerpt {
  font-size: var(--text-xs);
  color: #8b949e;
  line-height: var(--leading-normal);
}
.cmdk-hit-excerpt mark {
  background: transparent;
  color: #f0883e;
}
.cmdk-hint {
  padding: var(--space-4) 16px;
  font-size: var(--text-sm);
  color: #8b949e;
  margin: 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(search): style command palette (dark always)"
```

---

### Task 2.5 — Mount the host in `BaseLayout`

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Import and mount**

At the top of the frontmatter in `BaseLayout.astro`, add:

```ts
import CommandPaletteHost from '../components/CommandPaletteHost';
```

At the bottom of `<body>`, _before_ the closing `</body>`, add:

```astro
<CommandPaletteHost client:idle locale={lang} />
```

`client:idle` defers hydration until the browser goes idle, so the palette panel bundle is not fetched until the reader actually opens it.

- [ ] **Step 2: Full build + preview smoke test**

```bash
npm run build && npm run preview
```

Open `http://localhost:4321/papers/quicksort-partitioning`, confirm:

1. Pressing `Ctrl+K` opens the palette.
2. Pressing `/` with focus in the body (not the URL bar) opens it.
3. Typing "quicksort" returns the paper.
4. Clicking a result navigates.
5. Filter chip "Papers" scopes results.
6. Esc closes.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(search): mount command palette host on every page via client:idle"
```

---

## Phase 3 — Giscus Comments

Giscus is opt-in per entry via a `comments` boolean in the Zod schema (default: `true` for posts, `false` for papers — scholarly papers
don't get a comment thread unless the author explicitly enables it). Theme follows the current light/dark mode via Giscus's `setConfig`
postMessage API after ThemeToggle fires.

### Task 3.1 — Add `comments` flag to the Zod schemas

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/content.config.ts`

- [ ] **Step 1: Extend both schemas**

In the `papers` schema (after `bibliography: ...`), add:

```ts
comments: z.boolean().default(false),
```

In the `posts` schema (after `series: ...`), add:

```ts
comments: z.boolean().default(true),
```

- [ ] **Step 2: Sync types**

```bash
npm run sync
```

Expected: no errors; `.astro/content.d.ts` regenerated with the new field.

- [ ] **Step 3: Do NOT commit yet — later tasks consume the flag.**

---

### Task 3.2 — Env vars for Giscus repo identifiers

Giscus needs four repo-level identifiers. They are not secrets (they ship to the client), so store them as `PUBLIC_*` env vars so Astro
exposes them at build time via `import.meta.env`.

**Files:**

- Create: `/home/eduardo/Documents/blog/.env.example`

- [ ] **Step 1: Write `.env.example`**

```env
# Giscus — public repo identifiers (not secrets, safe to ship to the client).
# Obtain from https://giscus.app after enabling Discussions on the repo.
PUBLIC_GISCUS_REPO=eagle-head/blog
PUBLIC_GISCUS_REPO_ID=
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=

# Cloudflare Web Analytics — public token emitted as a script tag.
# Absent in dev so beacons never fire locally.
PUBLIC_CF_ANALYTICS_TOKEN=
```

- [ ] **Step 2: Confirm `.env` is already gitignored**

```bash
grep -n "^\.env" .gitignore || echo "missing"
```

If the grep prints `missing`, append these lines to `.gitignore`:

```gitignore
.env
.env.local
```

- [ ] **Step 3: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore(env): document Giscus + Cloudflare Analytics PUBLIC_ env vars"
```

---

### Task 3.3 — Giscus island component

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/Giscus.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Giscus.astro
interface Props {
  lang: 'en' | 'pt-BR';
}
const { lang } = Astro.props;

const repo = import.meta.env.PUBLIC_GISCUS_REPO;
const repoId = import.meta.env.PUBLIC_GISCUS_REPO_ID;
const category = import.meta.env.PUBLIC_GISCUS_CATEGORY;
const categoryId = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID;

// Giscus uses a single language code, not a BCP-47 tag — map pt-BR → pt.
const giscusLang = lang === 'pt-BR' ? 'pt' : 'en';

const ready = repo && repoId && category && categoryId;
---

{
  ready ? (
    <section class="giscus-wrap" aria-label="Comments">
      <script
        src="https://giscus.app/client.js"
        data-repo={repo}
        data-repo-id={repoId}
        data-category={category}
        data-category-id={categoryId}
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang={giscusLang}
        data-loading="lazy"
        crossorigin="anonymous"
        async
      />
    </section>
  ) : null
}

<style>
  .giscus-wrap {
    margin-top: var(--space-8);
    padding-top: var(--space-6);
    border-top: 1px solid var(--color-border);
  }
</style>
```

- [ ] **Step 2: Sync theme to Giscus when ThemeToggle fires**

Open `/home/eduardo/Documents/blog/src/components/ThemeToggle.astro`. Find the inline `<script>` block that swaps
`document.documentElement.dataset.theme`. **Right after** the line that writes the new theme value, add:

```js
// Notify Giscus (if present on the page) so its theme follows ours.
const giscus = document.querySelector('iframe.giscus-frame');
if (giscus) {
  giscus.contentWindow?.postMessage({ giscus: { setConfig: { theme: newTheme === 'dark' ? 'dark' : 'light' } } }, 'https://giscus.app');
}
```

Substitute `newTheme` with whatever variable name the existing script uses for the just-applied theme value. If ThemeToggle structures its
script differently, adapt the insertion point to where the data-theme flip actually happens.

- [ ] **Step 3: TypeScript check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Giscus.astro src/components/ThemeToggle.astro
git commit -m "feat(comments): giscus island with theme-sync via postMessage"
```

---

### Task 3.4 — Wire Giscus into paper and post layouts

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/layouts/PaperLayout.astro`
- Modify: `/home/eduardo/Documents/blog/src/layouts/PostLayout.astro`

- [ ] **Step 1: Read the `comments` field in `PaperLayout`**

Change the destructure at the top to include `comments`:

```ts
const { title, abstract, publishedAt, updatedAt, authors, tags, keywords, doi, language, comments } = entry.data;
```

Import the component:

```ts
import Giscus from '../components/Giscus.astro';
```

After the `</div>` that closes `.paper-body`, and **still inside** `.paper-main`, add:

```astro
{comments && <Giscus lang={language} />}
```

- [ ] **Step 2: Repeat for `PostLayout`**

Destructure `comments`:

```ts
const { title, lead, publishedAt, updatedAt, tags, language, comments } = entry.data;
```

Import:

```ts
import Giscus from '../components/Giscus.astro';
```

After the `</div>` that closes `.post-body`, add:

```astro
{comments && <Giscus lang={language} />}
```

- [ ] **Step 3: Sync content + rebuild**

```bash
npm run sync && npm run build
```

Expected: build succeeds. With `.env` absent, `PUBLIC_GISCUS_REPO_ID` is empty → the Giscus component renders nothing, so the build produces
no client script tag for the widget. This is the desired dev/CI default.

- [ ] **Step 4: Commit schema + layout wiring**

```bash
git add src/content.config.ts src/layouts/PaperLayout.astro src/layouts/PostLayout.astro
git commit -m "feat(comments): opt-in giscus per entry via schema flag"
```

---

## Phase 4 — Cloudflare Web Analytics

One script tag, emitted only when the token env var is set. No fallback, no cookie banner.

### Task 4.1 — Analytics snippet

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/Analytics.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Analytics.astro
const token = import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN;
---

{
  token ? (
    <script is:inline defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={`{"token": "${token}"}`} />
  ) : null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Analytics.astro
git commit -m "feat(analytics): cloudflare web analytics beacon (env-gated)"
```

---

### Task 4.2 — Mount Analytics in `BaseLayout`

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Import and place**

At the top of the frontmatter, add:

```ts
import Analytics from '../components/Analytics.astro';
```

At the bottom of `<head>`, _after_ the `<slot name="head" />`, add:

```astro
<Analytics />
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: without the env var set, inspect `dist/index.html` and confirm there is NO `cloudflareinsights.com/beacon.min.js` script in
`<head>`.

- [ ] **Step 3: Gated build smoke**

```bash
PUBLIC_CF_ANALYTICS_TOKEN=test123 npm run build
```

Re-inspect `dist/index.html`. Expected: a line like
`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "test123"}'>` appears in head. Then redo
the build WITHOUT the env var so nothing ships:

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(analytics): mount cloudflare analytics beacon in base layout"
```

---

## Phase 5 — Smoke Test + Release

### Task 5.1 — End-to-end smoke

**Files:** none (manual verification).

- [ ] **Step 1: Run full CI locally**

```bash
npm run check && npm test && npm run build
```

Expected: all green; Pagefind logs 4 indexed pages (sample content).

- [ ] **Step 2: Preview and walk through every surface**

```bash
npm run preview
```

Verify each of the following on the preview server:

1. `http://localhost:4321/` — home loads, `Ctrl+K` opens palette, `/` opens palette, result navigation works.
2. `http://localhost:4321/pt-br/` — palette shows pt-BR UI strings, search scoped to pt-BR content.
3. `http://localhost:4321/papers/quicksort-partitioning` — paper renders with margin sidenotes, Giscus area absent (paper schema defaults
   `comments: false`).
4. `http://localhost:4321/posts/welcome` — post renders, Giscus area absent (env vars empty → component early-returns `null`).
5. `view-source:…` on any paper — confirm `<script data-cf-beacon>` is absent (token env var empty locally).
6. DevTools Network tab on a cold post page — initial HTML has _no_ JS entry for the palette panel; pressing `Ctrl+K` triggers the panel
   bundle download on demand.

- [ ] **Step 3: Verify hreflang regression-check**

Click a palette hit, then `View Source`. Expect `<link rel="alternate" hreflang="en" href="…">` still present (Plan 04 sitemap behavior must
not have regressed).

---

### Task 5.2 — Tag the release

- [ ] **Step 1: Confirm clean tree**

```bash
git status
```

Expected: "nothing to commit, working tree clean."

- [ ] **Step 2: Tag and note**

```bash
git tag -a v0.5.0-islands -m "islands: command palette, giscus comments, cloudflare analytics"
```

- [ ] **Step 3: Summary output**

```bash
git log --oneline -n 12 && echo "---" && git tag -n1 -l "v0.5.0-*"
```

---

## Out of Scope (deferred to Plan 06)

- CI workflow running `npm run check` + `npm test` + `npm run build` on PRs.
- Cloudflare Pages project creation and DNS.
- Giscus app actually installed and env vars populated with real IDs — this plan leaves `.env.example` and an empty-state component ready.
