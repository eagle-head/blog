# Blog — Plan 01: Foundations & Content Model

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish baseline tooling (scripts, lint, formatter, test runner), configure Astro for bilingual SSG with the full remark/rehype
pipeline, and define the `papers` / `posts` content collections with Zod schemas plus cross-language validation helpers. At the end of this
plan, `npm run check` and `npm test` pass on an empty-but-wired project.

**Architecture:** SSG on Astro 6, `output: 'static'`, i18n built-in (`en` default, `pt-BR` secondary). Content authored as MDX in
`src/content/{papers,posts}/<slug>/{en,pt-BR}.mdx`. Per-slug folder co-locates translations and assets. Cross-language validation runs in a
library module that the build pulls in via `getCollection` wrappers. Logic modules (`src/lib/*.ts`) are unit-tested with Vitest; content and
Astro pieces are validated by `astro check` and `astro build`.

**Tech Stack:** Astro 6.1.8, TypeScript 5.9 (via `@astrojs/check`), MDX pipeline (remark-math, rehype-katex, rehype-mermaid,
rehype-citation, remark-directive, rehype-slug, rehype-autolink-headings, remark-gfm), Tailwind CSS v4 (via `@tailwindcss/vite`), Zod
(bundled with `astro:content`), Vitest.

**Reference specs:**

- Architecture: `docs/superpowers/specs/2026-04-19-eduardokohn-blog-design.md`
- Visual design brief: `docs/superpowers/specs/2026-04-19-visual-design.md` (authoritative source for colors, typography, spacing, tokens)

---

## Phase 0 — Baseline Tooling

The scaffold already created `package.json`, `tsconfig.json`, and a minimal `src/pages/index.astro`. This phase adds the tooling around them
(scripts, formatter, linter, test runner, editor config) so every subsequent task has `npm run X` commands that work.

### Task 0.1 — Add npm scripts

**Files:**

- Modify: `/home/eduardo/Documents/blog/package.json`

- [ ] **Step 1: Read current scripts block**

Run: `node -e "console.log(JSON.stringify(require('./package.json').scripts, null, 2))"`

Expected: an object with at least `dev`, `build`, `preview`, `astro` keys from the Astro minimal template.

- [ ] **Step 2: Replace the `scripts` block with the full set**

Edit `package.json` so the `scripts` object is exactly:

```json
{
  "dev": "astro dev",
  "start": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro",
  "sync": "astro sync",
  "check": "astro sync && astro check && npm run lint:md",
  "lint": "eslint . && npm run lint:md && npm run format:check",
  "lint:md": "markdownlint-cli2 \"**/*.md\" \"!node_modules\" \"!dist\" \"!.astro\"",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Verify scripts run (even if some fail for now)**

Run: `npm run astro -- --version`

Expected: prints Astro's version (6.x.x) to confirm `scripts` block parses.

### Task 0.2 — Create `.editorconfig`

**Files:**

- Create: `/home/eduardo/Documents/blog/.editorconfig`

- [ ] **Step 1: Create the file with this exact content**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 2: Verify file exists**

Run: `cat .editorconfig | head -3`

Expected: prints `root = true` on the first line.

### Task 0.3 — Prettier configuration

**Files:**

- Create: `/home/eduardo/Documents/blog/.prettierrc.json`
- Create: `/home/eduardo/Documents/blog/.prettierignore`

- [ ] **Step 1: Write `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": { "parser": "astro" }
    },
    {
      "files": "*.md",
      "options": { "printWidth": 80, "proseWrap": "always" }
    }
  ]
}
```

- [ ] **Step 2: Write `.prettierignore`**

```text
node_modules
dist
.astro
package-lock.json
public/fonts
```

- [ ] **Step 3: Verify prettier parses the project**

Run: `npm run format:check`

Expected: a list of files with formatting differences, exiting non-zero. That is acceptable — it means prettier runs. We will run
`npm run format` to fix everything after all configs are in place (Task 0.7).

### Task 0.4 — ESLint flat configuration

**Files:**

- Create: `/home/eduardo/Documents/blog/eslint.config.mjs`

- [ ] **Step 1: Write the config**

```js
// eslint.config.mjs
import eslintAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**', 'public/**'],
  },
  ...tseslint.configs.recommended,
  ...eslintAstro.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.astro'],
    rules: {
      // keep defaults from eslint-plugin-astro
    },
  },
];
```

- [ ] **Step 2: Verify ESLint loads the config**

Run: `npx eslint --print-config astro.config.mjs > /tmp/eslint-check.json && head -5 /tmp/eslint-check.json`

Expected: prints JSON (not an error). Confirms config parses.

### Task 0.5 — Install Vitest and write its config

**Files:**

- Modify: `/home/eduardo/Documents/blog/package.json` (dev dep)
- Create: `/home/eduardo/Documents/blog/vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest @vitest/coverage-v8`

Expected: `vitest` and `@vitest/coverage-v8` appear under `devDependencies`.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
    },
  },
});
```

- [ ] **Step 3: Verify Vitest can start (with no tests)**

Run: `npm test`

Expected: Vitest reports "No test files found" and exits 0 (or exits with code 1 but logs "No test files found, exiting with code 1" — both
are fine; the point is Vitest itself ran).

### Task 0.6 — Add `.gitattributes`

**Files:**

- Create: `/home/eduardo/Documents/blog/.gitattributes`

- [ ] **Step 1: Write the file**

```text
* text=auto eol=lf
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.woff binary
*.woff2 binary
package-lock.json -diff
```

- [ ] **Step 2: Refresh line endings**

Run: `git add --renormalize .`

Expected: no errors. (Git may not report anything if the repo already has LF line endings — that is fine.)

### Task 0.7 — Format everything and commit Phase 0

**Files:**

- All tracked files (formatting pass)

- [ ] **Step 1: Run the formatter**

Run: `npm run format`

Expected: Prettier reports files it rewrote. Should include `astro.config.mjs`, `tsconfig.json`, and the markdown files in `docs/`.

- [ ] **Step 2: Verify format is clean**

Run: `npm run format:check`

Expected: exits 0 with no files needing changes.

- [ ] **Step 3: Verify lint passes on what exists**

Run: `npm run lint:md`

Expected: 0 errors from markdownlint.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: set up baseline tooling (scripts, prettier, eslint, vitest)"
```

---

## Phase 1 — Astro Configuration

Wire Astro for bilingual SSG, the full MDX pipeline, Tailwind v4, and dark-mode-ready base CSS. At the end of this phase `npm run build`
produces a `dist/` folder from the current (empty) project.

### Task 1.1 — Rewrite `astro.config.mjs` with full config

**Files:**

- Modify: `/home/eduardo/Documents/blog/astro.config.mjs`

- [ ] **Step 1: Replace the file contents**

```js
// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';

import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';
import rehypeCitation from 'rehype-citation';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// https://astro.build/config
export default defineConfig({
  site: 'https://eduardokohn.com',
  output: 'static',
  trailingSlash: 'never',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-BR'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
    remarkPlugins: [remarkGfm, remarkMath, remarkDirective],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      rehypeKatex,
      [rehypeMermaid, { strategy: 'inline-svg' }],
      [
        rehypeCitation,
        {
          csl: 'ieee',
          linkCitations: true,
        },
      ],
    ],
  },

  integrations: [mdx(), preact(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 2: Format the file**

Run: `npx prettier --write astro.config.mjs`

Expected: file reformatted, exits 0.

- [ ] **Step 3: Verify Astro accepts the config**

Run: `npx astro sync`

Expected: types regenerated under `.astro/`, exits 0. Any import errors here indicate a misspelled plugin name.

### Task 1.2 — Install JetBrains Mono and create global CSS with design tokens

Implements §2 (typography), §3 (color system), and §4 (spacing) of the visual design brief. All token names match the brief exactly so
components in later plans can reference them without re-mapping.

**Files:**

- Modify: `/home/eduardo/Documents/blog/package.json` (add font dep)
- Create: `/home/eduardo/Documents/blog/src/styles/global.css`

- [ ] **Step 1: Install JetBrains Mono variable font**

Run: `npm install @fontsource-variable/jetbrains-mono`

Expected: `@fontsource-variable/jetbrains-mono` appears under `dependencies` in `package.json`. Inter was installed during bootstrap.

- [ ] **Step 2: Write `src/styles/global.css`**

This is the authoritative token file. It imports Tailwind v4, the typography plugin, both variable fonts, and declares the complete token
system from the visual design brief. Dark-mode tokens override through `[data-theme='dark']` — no Tailwind `dark:*` variant is needed
because components consume tokens via `var(...)` and the attribute swaps them.

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

/* Self-hosted variable fonts (see visual brief §2.1) */
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';

/* =========================================================================
 * Design tokens — Tailwind v4 @theme block
 * Source of truth: docs/superpowers/specs/2026-04-19-visual-design.md
 * ========================================================================= */

@theme {
  /* Fonts */
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  /* Type scale (brief §2.2) */
  --text-3xs: 10px;
  --text-2xs: 11px;
  --text-xs: 12.5px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-lg: 17px;
  --text-xl: 20px;
  --text-2xl: 28px;
  --text-3xl: 36px;

  /* Weights (brief §2.3) */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* Line heights (brief §2.4) */
  --leading-tight: 1.08;
  --leading-snug: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;
  --leading-loose: 1.75;

  /* Letter spacing (brief §2.5) */
  --tracking-tight: -0.025em;
  --tracking-snug: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.08em;
  --tracking-wider: 0.18em;

  /* Spacing — base 4px (brief §4) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Content widths (brief §4.1) */
  --measure-prose: 640px;
  --measure-tufte-total: 980px;
  --measure-tufte-side: 220px;
  --measure-magazine: 1040px;
  --measure-hero: 720px;

  /* Radii (brief §4.3) */
  --radius-sm: 3px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-pill: 999px;

  /* ---- Light-mode palette (default, brief §3) ---- */
  --color-bg: #ffffff;
  --color-fg: #0a0a0a;
  --color-text: #262626;
  --color-muted: #737373;
  --color-border: #e5e5e5;
  --color-border-soft: #f0f0f0;

  --color-accent: #9d174d; /* Wine */
  --color-accent-soft: rgba(157, 23, 77, 0.06);
  --color-accent-2: #2563eb; /* Definition blue */
  --color-accent-2-soft: rgba(37, 99, 235, 0.06);

  --color-kbd-bg: #f5f5f5;
  --color-kbd-border: #d4d4d4;
  --color-abstract-bg: #f0f0f0;

  --color-bg-inline: #fef2f2;
  --color-border-inline: #fce7f3;
  --color-text-inline: #9d174d;

  /* Code blocks — Dark Always, identical across modes (brief §5.6) */
  --color-code-bg: #0d1117;
  --color-code-fg: #c9d1d9;
  --color-code-head-bg: #161b22;
  --color-code-border: #161b22;
  --color-syntax-key: #ff7b72;
  --color-syntax-fn: #d2a8ff;
  --color-syntax-str: #a5d6ff;
  --color-syntax-num: #79c0ff;
  --color-syntax-com: #8b949e;
  --color-syntax-var: #ffa657;

  /* Featured gradient (home magazine grid) */
  --gradient-featured: linear-gradient(135deg, #fdf2f8 0%, #fef3c7 100%);
  --color-border-featured: #fbcfe8;
}

/* =========================================================================
 * Dark mode — Nordic Muted (brief §3, dark column)
 * Token overrides only; components read tokens via var(), so no dark:*
 * variant is needed.
 * ========================================================================= */

[data-theme='dark'] {
  --color-bg: #2e3440; /* Polar Night 0 */
  --color-fg: #eceff4; /* Snow */
  --color-text: #d8dee9;
  --color-muted: #8892a5;
  --color-border: #3b4252; /* Polar Night 1 */
  --color-border-soft: #353a48;

  --color-accent: #88c0d0; /* Frost 3 */
  --color-accent-soft: rgba(136, 192, 208, 0.08);
  --color-accent-2: #81a1c1; /* Frost 2 */
  --color-accent-2-soft: rgba(129, 161, 193, 0.08);

  --color-kbd-bg: #3b4252;
  --color-kbd-border: #4c566a;
  --color-abstract-bg: #353a48;

  --color-bg-inline: rgba(136, 192, 208, 0.12);
  --color-border-inline: rgba(136, 192, 208, 0.2);
  --color-text-inline: #88c0d0;

  /* Code palette unchanged (Dark Always) */

  --gradient-featured: linear-gradient(135deg, rgba(136, 192, 208, 0.08) 0%, rgba(235, 203, 139, 0.06) 100%);
  --color-border-featured: rgba(136, 192, 208, 0.3);

  color-scheme: dark;
}

/* =========================================================================
 * Base element styling
 * ========================================================================= */

html {
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-sans);
  font-feature-settings:
    'cv11' 1,
    'ss01' 1; /* Inter: straight 'a', curved 'l' */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  line-height: var(--leading-relaxed);
  color: var(--color-text);
}

code,
pre,
kbd,
samp {
  font-family: var(--font-mono);
}

a {
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

a:hover {
  text-decoration-thickness: 2px;
}

::selection {
  background: var(--color-accent);
  color: var(--color-bg);
}

/* Inline code (brief §5.7) */
:not(pre) > code {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-inline);
  background: var(--color-bg-inline);
  border: 1px solid var(--color-border-inline);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
}
```

- [ ] **Step 3: Verify CSS parses via Astro**

Run: `npx astro sync`

Expected: exits 0. (Astro picks up the Tailwind Vite plugin; the CSS file is validated when a page imports it.)

### Task 1.3 — Create inline theme script (FOUC-free)

The dark-mode toggle writes to `localStorage.theme` and to `document.documentElement.dataset.theme`. This tiny script runs before any paint,
preventing a flash of the wrong theme.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/lib/theme-init.ts`

- [ ] **Step 1: Write the file**

```ts
// Runs as an inline <script> in <head>. Must be synchronous and small.
// Exported as a string to be embedded via `set:html` in BaseLayout later.

export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset.theme = stored;
      return;
    }
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    document.documentElement.dataset.theme = mql.matches ? 'dark' : 'light';
  } catch (_e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`.trim();
```

- [ ] **Step 2: Verify TypeScript accepts it**

Run: `npx astro sync && npx astro check`

Expected: 0 errors from astro check. (It picks up the new `.ts` file and typechecks it against the generated virtual-module types.)

### Task 1.4 — Rewrite `src/pages/index.astro` to sanity-check the build

We will replace this entirely in Plan 2. For now it just needs to compile so `astro build` succeeds.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/pages/index.astro`

- [ ] **Step 1: Replace file content**

```astro
---
import '../styles/global.css';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Eduardo Kohn — Blog (scaffold)</title>
  </head>
  <body>
    <main class="mx-auto max-w-prose p-8">
      <h1 class="text-3xl font-bold">Scaffold OK</h1>
      <p class="mt-4 text-[var(--color-muted)]">Foundations in place. Content model coming next.</p>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`

Expected: Astro builds successfully; `dist/index.html` exists. If the build fails on `rehype-mermaid` or `rehype-citation` it is because the
pages reference those plugins but no MDX uses them yet — they should not fail on an empty pipeline. Investigate the actual error and fix
before moving on.

- [ ] **Step 3: Verify `dist/index.html` contains the page**

Run: `grep -c "Scaffold OK" dist/index.html`

Expected: prints `1`.

### Task 1.5 — Commit Phase 1

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat: configure astro i18n, MDX pipeline, tailwind v4, theme tokens"
```

---

## Phase 2 — Content Model

Define the `papers` and `posts` collections with strict Zod schemas. Write cross-language validation helpers using TDD before they plug into
Astro's `getCollection`.

### Task 2.1 — Write `src/content.config.ts` with Zod schemas

**Files:**

- Create: `/home/eduardo/Documents/blog/src/content.config.ts`

- [ ] **Step 1: Write the file**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const LOCALES = ['en', 'pt-BR'] as const;
const localeSchema = z.enum(LOCALES);

const authorSchema = z.object({
  name: z.string().min(1),
  affiliation: z.string().optional(),
  orcid: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/)
    .optional(),
  email: z.string().email().optional(),
});

const statusSchema = z.enum(['draft', 'published']);

const papers = defineCollection({
  loader: glob({
    pattern: '**/{en,pt-BR}.mdx',
    base: './src/content/papers',
  }),
  schema: ({ image: _image }) =>
    z.object({
      title: z.string().min(1),
      abstract: z.string().min(150).max(300),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      authors: z.array(authorSchema).min(1),
      tags: z.array(z.string()).min(1),
      language: localeSchema,
      keywords: z.array(z.string()).optional(),
      doi: z.string().optional(),
      status: statusSchema,
      bibliography: z.string().default('./references.bib'),
    }),
});

const posts = defineCollection({
  loader: glob({
    pattern: '**/{en,pt-BR}.mdx',
    base: './src/content/posts',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      lead: z.string().min(80).max(160),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      tags: z.array(z.string()).min(1),
      language: localeSchema,
      status: statusSchema,
      heroImage: image().optional(),
      series: z.object({ id: z.string(), order: z.number().int().nonnegative() }).optional(),
    }),
});

export const collections = { papers, posts };
```

- [ ] **Step 2: Verify types compile**

Run: `npx astro sync && npx astro check`

Expected: `astro sync` regenerates `.astro/` types (`collections` typed in `.astro/content.d.ts`); `astro check` exits 0.

### Task 2.2 — TDD: write failing tests for cross-language validation

**Files:**

- Create: `/home/eduardo/Documents/blog/src/lib/content.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, expect, it } from 'vitest';
import { parseEntryId, groupBySlug, assertAllLocalesPresent, assertSharedFieldsMatch } from './content';

describe('parseEntryId', () => {
  it('splits "<slug>/<locale>" into parts', () => {
    expect(parseEntryId('quicksort/en')).toEqual({
      slug: 'quicksort',
      locale: 'en',
    });
    expect(parseEntryId('merge-sort/pt-BR')).toEqual({
      slug: 'merge-sort',
      locale: 'pt-BR',
    });
  });

  it('rejects ids with no slash', () => {
    expect(() => parseEntryId('quicksort')).toThrow(/invalid entry id/i);
  });

  it('rejects unknown locales', () => {
    expect(() => parseEntryId('x/fr')).toThrow(/unknown locale/i);
  });
});

describe('groupBySlug', () => {
  it('groups entries by slug across locales', () => {
    const entries = [
      { id: 'a/en', data: {} },
      { id: 'a/pt-BR', data: {} },
      { id: 'b/en', data: {} },
    ];
    expect(groupBySlug(entries)).toEqual({
      a: { en: entries[0], 'pt-BR': entries[1] },
      b: { en: entries[2] },
    });
  });
});

describe('assertAllLocalesPresent', () => {
  it('passes when every slug has both locales', () => {
    const groups = {
      a: { en: { id: 'a/en' }, 'pt-BR': { id: 'a/pt-BR' } },
    };
    expect(() => assertAllLocalesPresent(groups, 'papers')).not.toThrow();
  });

  it('throws listing missing locales', () => {
    const groups = { a: { en: { id: 'a/en' } } };
    expect(() => assertAllLocalesPresent(groups, 'papers')).toThrow(/papers\/a.*pt-BR/i);
  });
});

describe('assertSharedFieldsMatch', () => {
  it('passes when publishedAt, tags, status match', () => {
    const date = new Date('2025-01-01');
    const groups = {
      a: {
        en: {
          id: 'a/en',
          data: { publishedAt: date, tags: ['x'], status: 'published' },
        },
        'pt-BR': {
          id: 'a/pt-BR',
          data: { publishedAt: date, tags: ['x'], status: 'published' },
        },
      },
    };
    expect(() => assertSharedFieldsMatch(groups, ['publishedAt', 'tags', 'status'])).not.toThrow();
  });

  it('throws listing the mismatch', () => {
    const groups = {
      a: {
        en: {
          id: 'a/en',
          data: {
            publishedAt: new Date('2025-01-01'),
            tags: ['x'],
            status: 'published',
          },
        },
        'pt-BR': {
          id: 'a/pt-BR',
          data: {
            publishedAt: new Date('2025-02-01'),
            tags: ['x'],
            status: 'published',
          },
        },
      },
    };
    expect(() => assertSharedFieldsMatch(groups, ['publishedAt', 'tags', 'status'])).toThrow(/publishedAt.*a/);
  });
});
```

- [ ] **Step 2: Run the test, expect failure**

Run: `npm test`

Expected: all tests fail because `src/lib/content.ts` does not exist yet.

### Task 2.3 — Implement `src/lib/content.ts` to make tests pass

**Files:**

- Create: `/home/eduardo/Documents/blog/src/lib/content.ts`

- [ ] **Step 1: Write the file**

```ts
export type Locale = 'en' | 'pt-BR';
export const LOCALES: readonly Locale[] = ['en', 'pt-BR'] as const;

export type EntryLike<T = unknown> = {
  id: string;
  data: T;
};

export type EntryGroup<T> = Partial<Record<Locale, EntryLike<T>>>;

export type GroupedEntries<T> = Record<string, EntryGroup<T>>;

export function parseEntryId(id: string): { slug: string; locale: Locale } {
  const idx = id.lastIndexOf('/');
  if (idx < 0) throw new Error(`invalid entry id (no '/'): ${id}`);
  const slug = id.slice(0, idx);
  const locale = id.slice(idx + 1);
  if (!LOCALES.includes(locale as Locale)) {
    throw new Error(`unknown locale in entry id '${id}': ${locale}`);
  }
  return { slug, locale: locale as Locale };
}

export function groupBySlug<T>(entries: ReadonlyArray<EntryLike<T>>): GroupedEntries<T> {
  const out: GroupedEntries<T> = {};
  for (const entry of entries) {
    const { slug, locale } = parseEntryId(entry.id);
    (out[slug] ??= {})[locale] = entry;
  }
  return out;
}

export function assertAllLocalesPresent<T>(groups: GroupedEntries<T>, collection: string, required: readonly Locale[] = LOCALES): void {
  const problems: string[] = [];
  for (const [slug, group] of Object.entries(groups)) {
    for (const loc of required) {
      if (!group[loc]) {
        problems.push(`${collection}/${slug}: missing ${loc}`);
      }
    }
  }
  if (problems.length) {
    throw new Error(`Missing translations in collection '${collection}':\n  - ${problems.join('\n  - ')}`);
  }
}

export function assertSharedFieldsMatch<T extends Record<string, unknown>>(groups: GroupedEntries<T>, fields: readonly (keyof T)[]): void {
  const problems: string[] = [];
  for (const [slug, group] of Object.entries(groups)) {
    const localesInGroup = Object.keys(group) as Locale[];
    if (localesInGroup.length < 2) continue;
    const [first, ...rest] = localesInGroup;
    const firstEntry = group[first]!;
    for (const other of rest) {
      const otherEntry = group[other]!;
      for (const field of fields) {
        if (!fieldEquals(firstEntry.data[field], otherEntry.data[field])) {
          problems.push(`${slug}: field '${String(field)}' differs between ${first} and ${other}`);
        }
      }
    }
  }
  if (problems.length) {
    throw new Error(`Shared-field mismatch across locales:\n  - ${problems.join('\n  - ')}`);
  }
}

function fieldEquals(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => fieldEquals(v, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const ak = Object.keys(a as object).sort();
    const bk = Object.keys(b as object).sort();
    if (ak.length !== bk.length || ak.some((k, i) => k !== bk[i])) return false;
    return ak.every((k) => fieldEquals((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return a === b;
}
```

- [ ] **Step 2: Run tests, expect all pass**

Run: `npm test`

Expected: 7+ tests pass across 4 describe blocks, exits 0.

### Task 2.4 — Write a `getValidatedCollection` wrapper

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/lib/content.ts` (append)

- [ ] **Step 1: Append the wrapper function**

Add at the end of `src/lib/content.ts`:

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type AnyCollection = 'papers' | 'posts';

export const SHARED_FIELDS: Record<AnyCollection, readonly string[]> = {
  papers: ['publishedAt', 'tags', 'status'],
  posts: ['publishedAt', 'tags', 'status'],
};

export async function getValidatedCollection<C extends AnyCollection>(
  name: C,
  opts: { includeDrafts?: boolean } = {},
): Promise<GroupedEntries<CollectionEntry<C>['data']>> {
  const all = (await getCollection(name, (entry) => {
    if (opts.includeDrafts) return true;
    return (entry.data as { status?: string }).status === 'published';
  })) as unknown as EntryLike<CollectionEntry<C>['data']>[];

  const groups = groupBySlug(all);
  assertAllLocalesPresent(groups, name);
  assertSharedFieldsMatch(groups, SHARED_FIELDS[name] as readonly (keyof CollectionEntry<C>['data'])[]);
  return groups;
}
```

- [ ] **Step 2: Verify type-checks**

Run: `npx astro sync && npx astro check`

Expected: exits 0.

### Task 2.5 — Commit Phase 2

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat: add content collections with zod schemas and cross-language validation"
```

---

## Phase 3 — i18n Helpers

Small, pure functions that compute URLs across locales. Written TDD.

### Task 3.1 — Write failing tests for i18n helpers

**Files:**

- Create: `/home/eduardo/Documents/blog/src/lib/i18n.test.ts`

- [ ] **Step 1: Write the tests**

```ts
import { describe, expect, it } from 'vitest';
import { localePrefix, localizedPath, stripLocalePrefix, detectLocaleFromPath, alternateUrls } from './i18n';

describe('localePrefix', () => {
  it('returns empty for default locale', () => {
    expect(localePrefix('en')).toBe('');
  });
  it('returns /pt-br for pt-BR (lowercased)', () => {
    expect(localePrefix('pt-BR')).toBe('/pt-br');
  });
});

describe('localizedPath', () => {
  it('keeps path as-is for default locale', () => {
    expect(localizedPath('/papers/quicksort', 'en')).toBe('/papers/quicksort');
  });
  it('prepends /pt-br for pt-BR', () => {
    expect(localizedPath('/papers/quicksort', 'pt-BR')).toBe('/pt-br/papers/quicksort');
  });
  it('normalizes leading slash', () => {
    expect(localizedPath('papers/quicksort', 'pt-BR')).toBe('/pt-br/papers/quicksort');
  });
  it('handles root', () => {
    expect(localizedPath('/', 'pt-BR')).toBe('/pt-br/');
    expect(localizedPath('/', 'en')).toBe('/');
  });
});

describe('stripLocalePrefix', () => {
  it('strips /pt-br', () => {
    expect(stripLocalePrefix('/pt-br/papers/qs')).toBe('/papers/qs');
  });
  it('leaves EN paths alone', () => {
    expect(stripLocalePrefix('/papers/qs')).toBe('/papers/qs');
  });
  it('handles /pt-br alone', () => {
    expect(stripLocalePrefix('/pt-br')).toBe('/');
    expect(stripLocalePrefix('/pt-br/')).toBe('/');
  });
});

describe('detectLocaleFromPath', () => {
  it('returns pt-BR for /pt-br prefix', () => {
    expect(detectLocaleFromPath('/pt-br/papers/x')).toBe('pt-BR');
  });
  it('defaults to en', () => {
    expect(detectLocaleFromPath('/papers/x')).toBe('en');
  });
});

describe('alternateUrls', () => {
  it('returns both locale URLs for a canonical path', () => {
    expect(alternateUrls('/papers/quicksort')).toEqual({
      en: '/papers/quicksort',
      'pt-BR': '/pt-br/papers/quicksort',
    });
  });
  it('works from a localized path too', () => {
    expect(alternateUrls('/pt-br/papers/quicksort')).toEqual({
      en: '/papers/quicksort',
      'pt-BR': '/pt-br/papers/quicksort',
    });
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

Run: `npm test`

Expected: tests fail because `src/lib/i18n.ts` doesn't exist.

### Task 3.2 — Implement `src/lib/i18n.ts`

**Files:**

- Create: `/home/eduardo/Documents/blog/src/lib/i18n.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Locale } from './content';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'pt-BR'];

/** Path prefix for a locale ("" for default, "/pt-br" for pt-BR). */
export function localePrefix(locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return '';
  return `/${locale.toLowerCase()}`;
}

/** Produce a full path for a given locale. `path` should be canonical (EN). */
export function localizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const prefix = localePrefix(locale);
  if (!prefix) return normalized;
  if (normalized === '/') return `${prefix}/`;
  return `${prefix}${normalized}`;
}

/** Remove a locale prefix from a path, returning the canonical (EN) form. */
export function stripLocalePrefix(path: string): string {
  for (const loc of LOCALES) {
    const prefix = localePrefix(loc);
    if (!prefix) continue;
    if (path === prefix) return '/';
    if (path === `${prefix}/`) return '/';
    if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length);
  }
  return path;
}

/** Detect which locale a path belongs to based on its prefix. */
export function detectLocaleFromPath(path: string): Locale {
  for (const loc of LOCALES) {
    const prefix = localePrefix(loc);
    if (!prefix) continue;
    if (path === prefix || path.startsWith(`${prefix}/`)) return loc;
  }
  return DEFAULT_LOCALE;
}

/** Map of locale → URL for every locale, given any path. */
export function alternateUrls(path: string): Record<Locale, string> {
  const canonical = stripLocalePrefix(path);
  return {
    en: localizedPath(canonical, 'en'),
    'pt-BR': localizedPath(canonical, 'pt-BR'),
  };
}
```

- [ ] **Step 2: Run tests, expect all pass**

Run: `npm test`

Expected: all i18n tests pass alongside the Phase 2 tests, exits 0.

### Task 3.3 — Commit Phase 3

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat: add i18n url helpers with tdd"
```

---

## Phase 4 — Full-Foundations Smoke Test

Prove the whole foundation works end to end: lint, typecheck, tests, and build all succeed on a wired-up but content-free project.

### Task 4.1 — Run every quality gate

- [ ] **Step 1: Format check**

Run: `npm run format:check`

Expected: exits 0.

- [ ] **Step 2: Markdown lint**

Run: `npm run lint:md`

Expected: `Summary: 0 error(s)`.

- [ ] **Step 3: ESLint**

Run: `npx eslint .`

Expected: exits 0. Fix any rule failures inline (imports order, unused vars) before proceeding.

- [ ] **Step 4: Astro + markdown check**

Run: `npm run check`

Expected: `0 errors` from `astro check`, and markdownlint reports `Summary: 0 error(s)`.

- [ ] **Step 5: Unit tests**

Run: `npm test`

Expected: all Vitest tests in `src/lib/*.test.ts` pass.

- [ ] **Step 6: Build**

Run: `npm run build`

Expected: Astro builds; `dist/index.html` exists and contains the scaffold string.

### Task 4.2 — Final commit and summary

- [ ] **Step 1: Verify clean working tree**

Run: `git status`

Expected: "nothing to commit, working tree clean".

- [ ] **Step 2: Log what's in place**

Run: `git log --oneline | head`

Expected: at least four commits from this plan (tooling, astro config, content model, i18n).

- [ ] **Step 3: Tag the foundations milestone (optional but useful)**

```bash
git tag -a v0.1.0-foundations -m "Plan 01 complete: foundations and content model"
```

---

## Done Criteria

Plan 01 is complete when ALL of the following are true:

1. `npm run check` exits 0.
2. `npm test` exits 0 with at least 12 passing tests (content helpers + i18n helpers).
3. `npm run build` produces `dist/index.html`.
4. `src/content.config.ts` defines `papers` and `posts` collections with the full schemas from the spec.
5. `src/lib/content.ts` and `src/lib/i18n.ts` exist and are fully covered by tests.
6. Working tree is clean.

## What's Next

**Plan 02 (Layouts + EN pages + sample content)** adds: `BaseLayout`, `PaperLayout`, `PostLayout`, the `SEO` component with JSON-LD, MDX
semantic components (Theorem/Definition/Proof/Lemma/Figure/Note/Warning), one fully featured sample paper and sample post (both locales),
and the EN-side pages (home, `/papers`, `/papers/[slug]`, `/posts`, `/posts/[slug]`). After Plan 02 the site renders real, styled content.
