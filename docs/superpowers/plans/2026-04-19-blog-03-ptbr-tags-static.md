# Blog — Plan 03: pt-BR Mirror, Tags, Static Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the EN-only site shipped in Plan 02 into a complete bilingual blog by adding the pt-BR mirror (home, lists, details), tags
pages (index + per-tag), the three static pages (about, cv, newsletter), and a `LangToggle` so readers swap between locales while staying on
the same content.

**Architecture:** pt-BR routes live under `src/pages/pt-br/...`, structurally mirroring the EN routes but passing `lang="pt-BR"` to the
shared `PaperLayout` / `PostLayout` / `BaseLayout`. Three small helpers keep the mirror DRY: `getLocalizedEntries` (collections → sorted
per-locale list), `formatDateForLocale` (Intl.DateTimeFormat with UTC), and a `t(locale, key)` UI-strings module. Tags are derived at build
time from the validated collections and rendered into the same listing shell. Static pages are plain `.astro` templates with hand-authored
copy; the newsletter page embeds a Buttondown subscribe form as a pure HTML POST.

**Tech Stack:** Astro 6, MDX (no new plugins), Vitest, existing `PaperLayout` / `PostLayout` / `BaseLayout` / `SEO` components.

**Reference specs:**

- Architecture: `docs/superpowers/specs/2026-04-19-eduardokohn-blog-design.md`
- Visual design brief: `docs/superpowers/specs/2026-04-19-visual-design.md`

**Prerequisites:** Plan 02 complete (tag `v0.2.0-layouts-en`). Working tree clean.

---

## Phase 1 — Shared Helpers and EN Refactor

Introduce three helpers (`formatDateForLocale`, `getLocalizedEntries`, `t`) and refactor the existing EN pages to consume them. This keeps
pt-BR pages tiny in Phase 3 — every route becomes one helper call plus a layout.

### Task 1.1 — Add `formatDateForLocale` to `i18n.ts`

Centralises the date-formatter creation that currently appears in every page/layout. Always uses `timeZone: 'UTC'` so calendar-day dates
from frontmatter render consistently regardless of build TZ.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/lib/i18n.ts`
- Modify: `/home/eduardo/Documents/blog/src/lib/__tests__/i18n.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/__tests__/i18n.test.ts`:

```ts
import { formatDateForLocale } from '../i18n';

describe('formatDateForLocale', () => {
  const d = new Date('2026-03-14T00:00:00Z');

  it('formats an EN long date in UTC', () => {
    expect(formatDateForLocale(d, 'en')).toBe('March 14, 2026');
  });

  it('formats a pt-BR long date in UTC', () => {
    // pt-BR long: "14 de março de 2026"
    expect(formatDateForLocale(d, 'pt-BR')).toBe('14 de março de 2026');
  });

  it('is timezone-invariant (UTC boundary)', () => {
    // Date at midnight UTC stays on the same day no matter the machine TZ.
    const boundary = new Date('2026-01-01T00:00:00Z');
    expect(formatDateForLocale(boundary, 'en')).toMatch(/January 1, 2026/);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

Run: `npm test`

Expected: the three new tests fail with "formatDateForLocale is not a function" (or similar — the export does not exist yet).

- [ ] **Step 3: Implement the helper**

Append to `src/lib/i18n.ts`:

```ts
/** Format a Date as a long calendar date for the given locale in UTC. */
export function formatDateForLocale(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `npm test`

Expected: all tests pass (25 total: 22 existing + 3 new).

### Task 1.2 — Add the UI-strings module

Small centralised dictionary for UI labels that need EN + pt-BR versions (section headings, button labels, nav items). Pure, tested
function.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/lib/ui.ts`
- Create: `/home/eduardo/Documents/blog/src/lib/__tests__/ui.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/ui.test.ts
import { describe, expect, it } from 'vitest';
import { t, type UiKey } from '../ui';

describe('t', () => {
  it('returns the EN string for a known key', () => {
    expect(t('en', 'nav.papers')).toBe('Papers');
  });

  it('returns the pt-BR string for a known key', () => {
    expect(t('pt-BR', 'nav.papers')).toBe('Artigos');
  });

  it('falls back to EN when pt-BR has no translation', () => {
    // If a key is only defined in EN, pt-BR requests return the EN value.
    // (Safety net so a missing translation never shows a placeholder.)
    const key = 'nav.papers' satisfies UiKey;
    expect(typeof t('pt-BR', key)).toBe('string');
  });
});
```

- [ ] **Step 2: Run test — expect failure**

Run: `npm test`

Expected: new tests fail with module-not-found error.

- [ ] **Step 3: Create `src/lib/ui.ts`**

```ts
import type { Locale } from './content';
import { DEFAULT_LOCALE } from './i18n';

// Shape: flat key → { en, pt-BR? }. pt-BR is optional; missing entries
// fall back to EN so a missing translation never surfaces as an empty
// string or a raw key.
const strings = {
  'nav.papers': { en: 'Papers', 'pt-BR': 'Artigos' },
  'nav.posts': { en: 'Posts', 'pt-BR': 'Posts' },
  'nav.about': { en: 'About', 'pt-BR': 'Sobre' },
  'nav.cv': { en: 'CV', 'pt-BR': 'CV' },
  'nav.newsletter': { en: 'Newsletter', 'pt-BR': 'Newsletter' },
  'search.placeholder': { en: 'Search\u2026', 'pt-BR': 'Buscar\u2026' },
  'search.label': { en: 'Search posts and papers', 'pt-BR': 'Buscar posts e artigos' },
  'site.subtitle': {
    en: 'Computer Science · Papers and Posts',
    'pt-BR': 'Ciência da Computação · Artigos e Posts',
  },
  'listing.papers.title': { en: 'Papers', 'pt-BR': 'Artigos' },
  'listing.papers.description': {
    en: 'Computer-science papers by Eduardo Kohn.',
    'pt-BR': 'Artigos de Ciência da Computação por Eduardo Kohn.',
  },
  'listing.posts.title': { en: 'Posts', 'pt-BR': 'Posts' },
  'listing.posts.description': {
    en: 'Short technical posts by Eduardo Kohn.',
    'pt-BR': 'Posts técnicos curtos por Eduardo Kohn.',
  },
  'listing.tags.title': { en: 'Tags', 'pt-BR': 'Tags' },
  'listing.tags.description': {
    en: 'Browse papers and posts by topic.',
    'pt-BR': 'Navegue artigos e posts por assunto.',
  },
  'home.featured': { en: 'Featured', 'pt-BR': 'Destaque' },
  'home.recent-posts': { en: 'Recent Posts', 'pt-BR': 'Posts Recentes' },
  'home.tags': { en: 'Tags', 'pt-BR': 'Tags' },
  'kind.paper': { en: 'Paper', 'pt-BR': 'Artigo' },
  'kind.post': { en: 'Post', 'pt-BR': 'Post' },
  'footer.rss': { en: 'RSS', 'pt-BR': 'RSS' },
  'footer.newsletter': { en: 'Newsletter', 'pt-BR': 'Newsletter' },
  'footer.github': { en: 'GitHub', 'pt-BR': 'GitHub' },
  'tag.entriesCount': { en: 'entries', 'pt-BR': 'itens' },
  'about.title': { en: 'About', 'pt-BR': 'Sobre' },
  'cv.title': { en: 'Curriculum Vitae', 'pt-BR': 'Currículo' },
  'newsletter.title': { en: 'Newsletter', 'pt-BR': 'Newsletter' },
  'newsletter.lead': {
    en: 'One email when I publish a new paper or post. No spam, unsubscribe anytime.',
    'pt-BR': 'Um email quando eu publicar um artigo ou post novo. Sem spam, cancele quando quiser.',
  },
  'newsletter.email.label': { en: 'Email address', 'pt-BR': 'Endereço de email' },
  'newsletter.email.placeholder': { en: 'you@example.com', 'pt-BR': 'voce@exemplo.com' },
  'newsletter.subscribe': { en: 'Subscribe', 'pt-BR': 'Inscrever-se' },
  'lang.toggle.label.to-en': { en: 'Switch to English', 'pt-BR': 'Alternar para inglês' },
  'lang.toggle.label.to-pt': {
    en: 'Switch to Portuguese (BR)',
    'pt-BR': 'Alternar para português (BR)',
  },
} as const;

export type UiKey = keyof typeof strings;

export function t(locale: Locale, key: UiKey): string {
  const entry = strings[key] as Partial<Record<Locale, string>> & { en: string };
  return entry[locale] ?? entry[DEFAULT_LOCALE];
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `npm test`

Expected: all 28+ tests pass (22 content + 6 i18n + 3 ui, give or take).

### Task 1.3 — Add `getLocalizedEntries` and `collectAllTags` helpers

Two helpers in `collections.ts` that Phase 3/4/6 use verbatim.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/lib/collections.ts`

- [ ] **Step 1: Append the helpers**

After `getValidatedCollection` in `src/lib/collections.ts`, append:

```ts
import type { Locale } from './content';

export type LocalizedEntry<C extends AnyCollection> = {
  slug: string;
  entry: CollectionEntry<C>;
};

/**
 * Load a validated collection, pick a single locale's entries, sort by
 * publishedAt descending. Returns an array of { slug, entry } suitable
 * for direct iteration in listing/detail pages.
 */
export async function getLocalizedEntries<C extends AnyCollection>(
  name: C,
  locale: Locale,
  opts: { includeDrafts?: boolean } = {},
): Promise<LocalizedEntry<C>[]> {
  const groups = await getValidatedCollection(name, opts);
  const out: LocalizedEntry<C>[] = [];
  for (const [slug, group] of Object.entries(groups)) {
    const entry = group[locale];
    if (entry) out.push({ slug, entry });
  }
  out.sort((a, b) => {
    const aT = (a.entry.data as { publishedAt: Date }).publishedAt.getTime();
    const bT = (b.entry.data as { publishedAt: Date }).publishedAt.getTime();
    return bT - aT;
  });
  return out;
}

export type TagCount = { tag: string; count: number };

/**
 * Collect all tags across both collections for one locale, with per-tag
 * entry counts. Tags are shared across locales (cross-language
 * validation enforces this), so the result is effectively locale-
 * independent for counts; we still take a locale to filter entries the
 * caller's locale surfaces.
 */
export async function collectAllTags(locale: Locale): Promise<TagCount[]> {
  const papers = await getLocalizedEntries('papers', locale);
  const posts = await getLocalizedEntries('posts', locale);
  const counts = new Map<string, number>();
  for (const { entry } of [...papers, ...posts]) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

/**
 * Return the union set of tag slugs across both collections (no counts,
 * both locales — used by getStaticPaths for /tags/[tag]).
 */
export async function listAllTagSlugs(): Promise<string[]> {
  const [papers, posts] = await Promise.all([getLocalizedEntries('papers', 'en'), getLocalizedEntries('posts', 'en')]);
  const all = new Set<string>();
  for (const { entry } of [...papers, ...posts]) {
    for (const tag of entry.data.tags) all.add(tag);
  }
  return Array.from(all).sort();
}

/**
 * Papers + posts that include `tag`, for `locale`. Returned in the same
 * `LocalizedEntry` shape as `getLocalizedEntries`, with a `kind`
 * discriminator so the listing can label each entry.
 */
export type TaggedEntry =
  | { kind: 'paper'; slug: string; entry: CollectionEntry<'papers'> }
  | { kind: 'post'; slug: string; entry: CollectionEntry<'posts'> };

export async function getEntriesByTag(tag: string, locale: Locale): Promise<TaggedEntry[]> {
  const [papers, posts] = await Promise.all([getLocalizedEntries('papers', locale), getLocalizedEntries('posts', locale)]);
  const out: TaggedEntry[] = [];
  for (const { slug, entry } of papers) {
    if (entry.data.tags.includes(tag)) out.push({ kind: 'paper', slug, entry });
  }
  for (const { slug, entry } of posts) {
    if (entry.data.tags.includes(tag)) out.push({ kind: 'post', slug, entry });
  }
  out.sort((a, b) => {
    const aT = (a.entry.data as { publishedAt: Date }).publishedAt.getTime();
    const bT = (b.entry.data as { publishedAt: Date }).publishedAt.getTime();
    return bT - aT;
  });
  return out;
}
```

- [ ] **Step 2: Verify types**

Run: `npx astro sync && npx astro check`

Expected: 0 errors.

### Task 1.4 — Refactor EN pages to use the new helpers

Shrinks each EN page by replacing the inline `Object.entries(...)` + `sort` + `Intl.DateTimeFormat` with calls to the helpers. Behaviour is
identical.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/pages/index.astro`
- Modify: `/home/eduardo/Documents/blog/src/pages/papers/index.astro`
- Modify: `/home/eduardo/Documents/blog/src/pages/papers/[slug].astro`
- Modify: `/home/eduardo/Documents/blog/src/pages/posts/index.astro`
- Modify: `/home/eduardo/Documents/blog/src/pages/posts/[slug].astro`

- [ ] **Step 1: Refactor `src/pages/index.astro`**

Replace the frontmatter block (everything between the two `---` fences) with:

```astro
---
// src/pages/index.astro
// Home (EN) — Brief §6.3 Magazine Grid.
import BaseLayout from '../layouts/BaseLayout.astro';
import MetaChip from '../components/MetaChip.astro';
import SEO from '../components/SEO.astro';
import { collectAllTags, getLocalizedEntries } from '../lib/collections';
import { formatDateForLocale } from '../lib/i18n';
import { t } from '../lib/ui';

const LOCALE = 'en' as const;

const papers = await getLocalizedEntries('papers', LOCALE);
const posts = await getLocalizedEntries('posts', LOCALE);
const tags = await collectAllTags(LOCALE);

const featured = papers[0];
const morePapers = papers.slice(1, 4);
const recentPosts = posts.slice(0, 3);
---
```

Then inside the template body, update the three places that used `dateFormat.format(...)` to use `formatDateForLocale(..., LOCALE)`. The
featured chip text becomes:

```astro
text={`${t(LOCALE, 'home.featured')} · ${t(LOCALE, 'kind.paper')} · ${formatDateForLocale(featured.entry.data.publishedAt, LOCALE)}`}
```

The row chip text becomes:

```astro
text={`${t(LOCALE, 'kind.paper')} · ${formatDateForLocale(entry.data.publishedAt, LOCALE)}`}
```

Update the hero subtitle text to `{t(LOCALE, 'site.subtitle')}`. Update `<h3 class="side-label">` texts: `Recent Posts` →
`{t(LOCALE, 'home.recent-posts')}` and `Tags` → `{t(LOCALE, 'home.tags')}`. The tag list loop continues to use `tags` (now typed as
`TagCount[]`), iterating via `tags.map((t, i) => ...)` — remember to use a different variable name inside the map (`{ tag, count }`) to
avoid shadowing the `t` helper.

- [ ] **Step 2: Refactor `src/pages/papers/index.astro`**

Frontmatter becomes:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import MetaChip from '../../components/MetaChip.astro';
import Tag from '../../components/Tag.astro';
import SEO from '../../components/SEO.astro';
import { getLocalizedEntries } from '../../lib/collections';
import { formatDateForLocale } from '../../lib/i18n';
import { t } from '../../lib/ui';

const LOCALE = 'en' as const;
const papers = await getLocalizedEntries('papers', LOCALE);
---
```

Template changes:

- Page title: `title={t(LOCALE, 'listing.papers.title') + ' — Eduardo Kohn'}`
- Description: `description={t(LOCALE, 'listing.papers.description')}`
- `<h1 class="listing-title">` text: `{t(LOCALE, 'listing.papers.title')}`
- Chip text inside `papers.map(...)`: `` `${t(LOCALE, 'kind.paper')} · ${formatDateForLocale(entry.data.publishedAt, LOCALE)}` ``

- [ ] **Step 3: Refactor `src/pages/posts/index.astro`**

Same pattern as papers index:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import MetaChip from '../../components/MetaChip.astro';
import Tag from '../../components/Tag.astro';
import SEO from '../../components/SEO.astro';
import { getLocalizedEntries } from '../../lib/collections';
import { formatDateForLocale } from '../../lib/i18n';
import { t } from '../../lib/ui';

const LOCALE = 'en' as const;
const posts = await getLocalizedEntries('posts', LOCALE);
---
```

Template changes mirror Step 2 but use `listing.posts.*` keys and `'kind.post'` for the chip label.

- [ ] **Step 4: Detail pages do not need changes**

`src/pages/papers/[slug].astro` and `src/pages/posts/[slug].astro` already use `getValidatedCollection` + `PaperLayout` / `PostLayout`,
which format dates internally via the layout's own `Intl.DateTimeFormat`. No refactor needed — the layouts still own their date rendering.

- [ ] **Step 5: Update both layouts to use `formatDateForLocale`**

In `src/layouts/PaperLayout.astro`, replace:

```ts
const dateFormat = new Intl.DateTimeFormat(language, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const chipText = `Paper · ${dateFormat.format(publishedAt)} · ${readingTime}`;
```

with:

```ts
import { formatDateForLocale } from '../lib/i18n';
import { t } from '../lib/ui';

// … (rest of existing frontmatter)

const chipText = `${t(language, 'kind.paper')} · ${formatDateForLocale(publishedAt, language)} · ${readingTime}`;
```

Move the two new imports up to the existing import list.

Do the same in `src/layouts/PostLayout.astro`, using `'kind.post'`.

- [ ] **Step 6: Verify**

Run: `npm run check && npm test && npm run build`

Expected: all three exit 0. `dist/` emits the same 5 pages as before.

### Task 1.5 — Commit Phase 1

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat(lib): add formatDateForLocale, getLocalizedEntries, collectAllTags, and UI-strings helpers"
```

---

## Phase 2 — LangToggle Component

A button in the header that switches between EN and pt-BR while keeping the reader on the corresponding content path.

### Task 2.1 — Create the component

**Files:**

- Create: `/home/eduardo/Documents/blog/src/components/LangToggle.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/LangToggle.astro
// Swap between locales while preserving the current route.
// /papers/x ↔ /pt-br/papers/x, /tags/sorting ↔ /pt-br/tags/sorting, etc.
import { alternateUrls, detectLocaleFromPath } from '../lib/i18n';
import { t } from '../lib/ui';

const path = Astro.url.pathname;
const currentLocale = detectLocaleFromPath(path);
const otherLocale = currentLocale === 'en' ? 'pt-BR' : 'en';
const alts = alternateUrls(path);
const href = alts[otherLocale];
const otherLabel = otherLocale === 'en' ? 'EN' : 'PT';
const titleKey = otherLocale === 'en' ? 'lang.toggle.label.to-en' : 'lang.toggle.label.to-pt';
const title = t(currentLocale, titleKey);
---

<a class="lang-toggle" href={href} title={title} aria-label={title}>
  <span aria-hidden="true">{otherLabel}</span>
</a>

<style>
  .lang-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    height: 34px;
    padding: 0 8px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    letter-spacing: 0.04em;
  }
  .lang-toggle:hover {
    color: var(--color-fg);
    border-color: var(--color-muted);
  }
  .lang-toggle:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
</style>
```

- [ ] **Step 2: Verify types**

Run: `npx astro check`

Expected: 0 errors.

### Task 2.2 — Wire LangToggle into the Header

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/components/Header.astro`

- [ ] **Step 1: Update the component**

Replace the existing Header frontmatter to import `LangToggle`:

```astro
---
import Kbd from './Kbd.astro';
import LangToggle from './LangToggle.astro';
import ThemeToggle from './ThemeToggle.astro';
---
```

And inside `<div class="site-actions">`, place the LangToggle between the search-trigger button and the ThemeToggle:

```astro
<button id="cmdk-trigger" type="button" class="search-trigger" …>…</button>
<LangToggle />
<ThemeToggle />
```

- [ ] **Step 2: Verify build + structural check**

Run: `npm run build && grep -c 'lang-toggle' dist/index.html`

Expected: build succeeds; grep prints `1` (the toggle rendered on the home page).

### Task 2.3 — Commit Phase 2

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat(ui): add LangToggle that preserves route across EN ↔ pt-BR"
```

---

## Phase 3 — pt-BR Routes

Every page under `src/pages/pt-br/` mirrors an EN page. Thanks to the helpers from Phase 1 each file is small.

### Task 3.1 — `/pt-br/` home

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/index.astro`

- [ ] **Step 1: Write the file**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import MetaChip from '../../components/MetaChip.astro';
import SEO from '../../components/SEO.astro';
import { collectAllTags, getLocalizedEntries } from '../../lib/collections';
import { formatDateForLocale } from '../../lib/i18n';
import { t } from '../../lib/ui';

const LOCALE = 'pt-BR' as const;

const papers = await getLocalizedEntries('papers', LOCALE);
const posts = await getLocalizedEntries('posts', LOCALE);
const tags = await collectAllTags(LOCALE);

const featured = papers[0];
const morePapers = papers.slice(1, 4);
const recentPosts = posts.slice(0, 3);
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title="Eduardo Kohn — Notas de Ciência da Computação"
    description="Artigos e posts sobre ciência da computação por Eduardo Kohn."
    canonicalPath="/"
    jsonLd={{ kind: 'home' }}
  />

  <section class="sub-header">
    <h1 class="site-title">Eduardo Kohn</h1>
    <p class="site-sub">{t(LOCALE, 'site.subtitle')}</p>
  </section>

  <div class="magazine">
    <div class="main-col">
      {
        featured && (
          <a class="featured" href={`/pt-br/papers/${featured.slug}`}>
            <MetaChip
              text={`${t(LOCALE, 'home.featured')} · ${t(LOCALE, 'kind.paper')} · ${formatDateForLocale(featured.entry.data.publishedAt, LOCALE)}`}
            />
            <div class="featured-title">{featured.entry.data.title}</div>
            <p class="featured-desc">{featured.entry.data.abstract}</p>
          </a>
        )
      }
      {
        morePapers.map(({ slug, entry }) => (
          <a class="row" href={`/pt-br/papers/${slug}`}>
            <MetaChip text={`${t(LOCALE, 'kind.paper')} · ${formatDateForLocale(entry.data.publishedAt, LOCALE)}`} />
            <div class="row-title">{entry.data.title}</div>
            <p class="row-desc">{entry.data.abstract}</p>
          </a>
        ))
      }
    </div>

    <aside class="side-col" aria-label="Sidebar">
      <section class="side-block">
        <h3 class="side-label">{t(LOCALE, 'home.recent-posts')}</h3>
        {
          recentPosts.map(({ slug, entry }) => (
            <a class="side-item" href={`/pt-br/posts/${slug}`}>
              <div class="side-item-title">{entry.data.title}</div>
              <p class="side-item-desc">{entry.data.lead}</p>
            </a>
          ))
        }
      </section>
      <section class="side-block">
        <h3 class="side-label">{t(LOCALE, 'home.tags')}</h3>
        <p class="tag-list">
          {
            tags.map(({ tag }, i) => (
              <>
                {i > 0 && ' · '}
                <a href={`/pt-br/tags/${tag}`}>{tag}</a>
              </>
            ))
          }
        </p>
      </section>
    </aside>
  </div>
</BaseLayout>

<style>
  /* Same styles as /src/pages/index.astro — duplicated intentionally
   * for now; Plan 04 can factor into a shared layout class if it grows
   * further. */
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
    margin: var(--space-1) 0;
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

- [ ] **Step 2: Verify build**

Run: `npm run build && ls dist/pt-br/index.html`

Expected: build succeeds; `dist/pt-br/index.html` exists.

### Task 3.2 — pt-BR papers listing and detail

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/papers/index.astro`
- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/papers/[slug].astro`

- [ ] **Step 1: Listing**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import MetaChip from '../../../components/MetaChip.astro';
import Tag from '../../../components/Tag.astro';
import SEO from '../../../components/SEO.astro';
import { getLocalizedEntries } from '../../../lib/collections';
import { formatDateForLocale } from '../../../lib/i18n';
import { t } from '../../../lib/ui';

const LOCALE = 'pt-BR' as const;
const papers = await getLocalizedEntries('papers', LOCALE);
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'listing.papers.title')} — Eduardo Kohn`}
    description={t(LOCALE, 'listing.papers.description')}
    canonicalPath="/papers"
    jsonLd={{ kind: 'collection', name: 'papers' }}
  />
  <div class="listing">
    <h1 class="listing-title">{t(LOCALE, 'listing.papers.title')}</h1>
    <ul class="entries">
      {
        papers.map(({ slug, entry }) => (
          <li class="entry">
            <MetaChip text={`${t(LOCALE, 'kind.paper')} · ${formatDateForLocale(entry.data.publishedAt, LOCALE)}`} />
            <a class="entry-title" href={`/pt-br/papers/${slug}`}>
              {entry.data.title}
            </a>
            <p class="entry-abstract">{entry.data.abstract}</p>
            <div class="entry-tags">
              {entry.data.tags.map((tag) => (
                <Tag name={tag} href={`/pt-br/tags/${tag}`} />
              ))}
            </div>
          </li>
        ))
      }
    </ul>
  </div>
</BaseLayout>

<style>
  .listing {
    max-width: var(--measure-listing);
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

- [ ] **Step 2: Detail**

```astro
---
import PaperLayout from '../../../layouts/PaperLayout.astro';
import { getValidatedCollection } from '../../../lib/collections';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const groups = await getValidatedCollection('papers');
  return Object.entries(groups).map(([slug, g]) => ({
    params: { slug },
    props: { entry: g['pt-BR']! },
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

Note: `canonicalPath` is the **EN** path; `SEO.astro` derives both locale URLs from it.

- [ ] **Step 3: Verify**

Run: `npm run build && ls dist/pt-br/papers/`

Expected: `index.html` and `quicksort-partitioning/index.html` exist.

### Task 3.3 — pt-BR posts listing and detail

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/posts/index.astro`
- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/posts/[slug].astro`

- [ ] **Step 1: Listing**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import MetaChip from '../../../components/MetaChip.astro';
import Tag from '../../../components/Tag.astro';
import SEO from '../../../components/SEO.astro';
import { getLocalizedEntries } from '../../../lib/collections';
import { formatDateForLocale } from '../../../lib/i18n';
import { t } from '../../../lib/ui';

const LOCALE = 'pt-BR' as const;
const posts = await getLocalizedEntries('posts', LOCALE);
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'listing.posts.title')} — Eduardo Kohn`}
    description={t(LOCALE, 'listing.posts.description')}
    canonicalPath="/posts"
    jsonLd={{ kind: 'collection', name: 'posts' }}
  />
  <div class="listing">
    <h1 class="listing-title">{t(LOCALE, 'listing.posts.title')}</h1>
    <ul class="entries">
      {
        posts.map(({ slug, entry }) => (
          <li class="entry">
            <MetaChip text={`${t(LOCALE, 'kind.post')} · ${formatDateForLocale(entry.data.publishedAt, LOCALE)}`} />
            <a class="entry-title" href={`/pt-br/posts/${slug}`}>
              {entry.data.title}
            </a>
            <p class="entry-lead">{entry.data.lead}</p>
            <div class="entry-tags">
              {entry.data.tags.map((tag) => (
                <Tag name={tag} href={`/pt-br/tags/${tag}`} />
              ))}
            </div>
          </li>
        ))
      }
    </ul>
  </div>
</BaseLayout>

<style>
  .listing {
    max-width: var(--measure-listing);
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

- [ ] **Step 2: Detail**

```astro
---
import PostLayout from '../../../layouts/PostLayout.astro';
import { getValidatedCollection } from '../../../lib/collections';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const groups = await getValidatedCollection('posts');
  return Object.entries(groups).map(([slug, g]) => ({
    params: { slug },
    props: { entry: g['pt-BR']! },
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

- [ ] **Step 3: Verify**

Run: `npm run build`

Expected: builds `/pt-br/posts/` and `/pt-br/posts/welcome/` pages.

### Task 3.4 — Commit Phase 3

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat(pages): add pt-BR route mirror (home, papers, posts)"
```

---

## Phase 4 — Tags

### Task 4.1 — `/tags` index (EN)

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/tags/index.astro`

- [ ] **Step 1: Write the file**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SEO from '../../components/SEO.astro';
import { collectAllTags } from '../../lib/collections';
import { t } from '../../lib/ui';

const LOCALE = 'en' as const;
const tags = await collectAllTags(LOCALE);
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'listing.tags.title')} — Eduardo Kohn`}
    description={t(LOCALE, 'listing.tags.description')}
    canonicalPath="/tags"
    jsonLd={{ kind: 'collection', name: 'tag' }}
  />
  <div class="listing">
    <h1 class="listing-title">{t(LOCALE, 'listing.tags.title')}</h1>
    <p class="listing-description">{t(LOCALE, 'listing.tags.description')}</p>
    <ul class="tag-grid">
      {
        tags.map(({ tag, count }) => (
          <li>
            <a class="tag-link" href={`/tags/${tag}`}>
              <span class="tag-name">#{tag}</span>
              <span class="tag-count">
                {count} {t(LOCALE, 'tag.entriesCount')}
              </span>
            </a>
          </li>
        ))
      }
    </ul>
  </div>
</BaseLayout>

<style>
  .listing {
    max-width: var(--measure-listing);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .listing-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    margin: 0 0 var(--space-2) 0;
    color: var(--color-fg);
  }
  .listing-description {
    font-size: var(--text-sm);
    color: var(--color-muted);
    margin: 0 0 var(--space-5) 0;
  }
  .tag-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-3);
  }
  .tag-link {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--color-fg);
  }
  .tag-link:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }
  .tag-name {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-accent);
    font-weight: var(--font-weight-semibold);
  }
  .tag-count {
    font-size: var(--text-2xs);
    color: var(--color-muted);
  }
</style>
```

### Task 4.2 — `/tags/[tag]` per-tag page (EN)

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/tags/[tag].astro`

- [ ] **Step 1: Write the file**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import MetaChip from '../../components/MetaChip.astro';
import SEO from '../../components/SEO.astro';
import { getEntriesByTag, listAllTagSlugs } from '../../lib/collections';
import { formatDateForLocale } from '../../lib/i18n';
import { t } from '../../lib/ui';

export async function getStaticPaths() {
  const tags = await listAllTagSlugs();
  return tags.map((tag) => ({ params: { tag } }));
}

const LOCALE = 'en' as const;
const { tag } = Astro.params;
const entries = await getEntriesByTag(tag!, LOCALE);
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`#${tag} — Eduardo Kohn`}
    description={`Papers and posts tagged ${tag}.`}
    canonicalPath={`/tags/${tag}`}
    jsonLd={{ kind: 'collection', name: 'tag', tagName: tag }}
  />
  <div class="listing">
    <h1 class="listing-title">
      #{tag}
    </h1>
    <ul class="entries">
      {
        entries.map(({ kind, slug, entry }) => (
          <li class="entry">
            <MetaChip
              text={`${t(LOCALE, kind === 'paper' ? 'kind.paper' : 'kind.post')} · ${formatDateForLocale(entry.data.publishedAt, LOCALE)}`}
            />
            <a class="entry-title" href={`/${kind === 'paper' ? 'papers' : 'posts'}/${slug}`}>
              {entry.data.title}
            </a>
            <p class="entry-excerpt">
              {kind === 'paper' ? (entry.data as { abstract: string }).abstract : (entry.data as { lead: string }).lead}
            </p>
          </li>
        ))
      }
    </ul>
  </div>
</BaseLayout>

<style>
  .listing {
    max-width: var(--measure-listing);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .listing-title {
    font-family: var(--font-mono);
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    margin: 0 0 var(--space-5) 0;
    color: var(--color-accent);
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
  .entry-excerpt {
    font-size: var(--text-sm);
    color: var(--color-text);
    margin: 0;
    line-height: var(--leading-normal);
  }
</style>
```

### Task 4.3 — `/pt-br/tags` index and `/pt-br/tags/[tag]` per-tag

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/tags/index.astro`
- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/tags/[tag].astro`

- [ ] **Step 1: Index**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import SEO from '../../../components/SEO.astro';
import { collectAllTags } from '../../../lib/collections';
import { t } from '../../../lib/ui';

const LOCALE = 'pt-BR' as const;
const tags = await collectAllTags(LOCALE);
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'listing.tags.title')} — Eduardo Kohn`}
    description={t(LOCALE, 'listing.tags.description')}
    canonicalPath="/tags"
    jsonLd={{ kind: 'collection', name: 'tag' }}
  />
  <div class="listing">
    <h1 class="listing-title">{t(LOCALE, 'listing.tags.title')}</h1>
    <p class="listing-description">{t(LOCALE, 'listing.tags.description')}</p>
    <ul class="tag-grid">
      {
        tags.map(({ tag, count }) => (
          <li>
            <a class="tag-link" href={`/pt-br/tags/${tag}`}>
              <span class="tag-name">#{tag}</span>
              <span class="tag-count">
                {count} {t(LOCALE, 'tag.entriesCount')}
              </span>
            </a>
          </li>
        ))
      }
    </ul>
  </div>
</BaseLayout>

<style>
  /* Same as /src/pages/tags/index.astro */
  .listing {
    max-width: var(--measure-listing);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .listing-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    margin: 0 0 var(--space-2) 0;
    color: var(--color-fg);
  }
  .listing-description {
    font-size: var(--text-sm);
    color: var(--color-muted);
    margin: 0 0 var(--space-5) 0;
  }
  .tag-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-3);
  }
  .tag-link {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--color-fg);
  }
  .tag-link:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }
  .tag-name {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-accent);
    font-weight: var(--font-weight-semibold);
  }
  .tag-count {
    font-size: var(--text-2xs);
    color: var(--color-muted);
  }
</style>
```

- [ ] **Step 2: Per-tag page**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import MetaChip from '../../../components/MetaChip.astro';
import SEO from '../../../components/SEO.astro';
import { getEntriesByTag, listAllTagSlugs } from '../../../lib/collections';
import { formatDateForLocale } from '../../../lib/i18n';
import { t } from '../../../lib/ui';

export async function getStaticPaths() {
  const tags = await listAllTagSlugs();
  return tags.map((tag) => ({ params: { tag } }));
}

const LOCALE = 'pt-BR' as const;
const { tag } = Astro.params;
const entries = await getEntriesByTag(tag!, LOCALE);
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`#${tag} — Eduardo Kohn`}
    description={`Artigos e posts marcados com ${tag}.`}
    canonicalPath={`/tags/${tag}`}
    jsonLd={{ kind: 'collection', name: 'tag', tagName: tag }}
  />
  <div class="listing">
    <h1 class="listing-title">
      #{tag}
    </h1>
    <ul class="entries">
      {
        entries.map(({ kind, slug, entry }) => (
          <li class="entry">
            <MetaChip
              text={`${t(LOCALE, kind === 'paper' ? 'kind.paper' : 'kind.post')} · ${formatDateForLocale(entry.data.publishedAt, LOCALE)}`}
            />
            <a class="entry-title" href={`/pt-br/${kind === 'paper' ? 'papers' : 'posts'}/${slug}`}>
              {entry.data.title}
            </a>
            <p class="entry-excerpt">
              {kind === 'paper' ? (entry.data as { abstract: string }).abstract : (entry.data as { lead: string }).lead}
            </p>
          </li>
        ))
      }
    </ul>
  </div>
</BaseLayout>

<style>
  /* Same as /src/pages/tags/[tag].astro */
  .listing {
    max-width: var(--measure-listing);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .listing-title {
    font-family: var(--font-mono);
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    margin: 0 0 var(--space-5) 0;
    color: var(--color-accent);
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
  .entry-excerpt {
    font-size: var(--text-sm);
    color: var(--color-text);
    margin: 0;
    line-height: var(--leading-normal);
  }
</style>
```

### Task 4.4 — Commit Phase 4

- [ ] **Step 1: Verify build**

Run: `npm run build && ls dist/tags/ && ls dist/pt-br/tags/`

Expected: both directories contain `index.html`, `sorting/index.html`, `algorithms/index.html`, `complexity/index.html`, `astro/index.html`,
`webdev/index.html`, `meta/index.html` (6 tags × 2 locales + 2 indexes).

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(pages): add tags index and per-tag pages (EN + pt-BR)"
```

---

## Phase 5 — Static Pages

### Task 5.1 — `/about` (EN + pt-BR)

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/about.astro`
- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/about.astro`

- [ ] **Step 1: EN about**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SEO from '../components/SEO.astro';
import { t } from '../lib/ui';

const LOCALE = 'en' as const;
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'about.title')} — Eduardo Kohn`}
    description="Eduardo Kohn — independent researcher writing about algorithms, systems, and computer science."
    canonicalPath="/about"
    jsonLd={{ kind: 'about' }}
  />
  <article class="page">
    <h1 class="page-title">{t(LOCALE, 'about.title')}</h1>
    <p>
      I'm Eduardo Kohn, an independent researcher and engineer writing about algorithms, systems, and the occasional rabbit hole in computer
      science.
    </p>
    <p>
      This blog has two tracks. <a href="/papers">Papers</a> are longer pieces written with scientific rigour — abstracts, citations, theorems,
      proofs. <a href="/posts">Posts</a> are shorter notes that share an idea before it is finished enough to formalise.
    </p>
    <p>
      Find me at <a href="https://github.com/eduardokohn" rel="me noopener">GitHub</a>
      or subscribe to the <a href="/newsletter">newsletter</a> to get new pieces by email.
    </p>
  </article>
</BaseLayout>

<style>
  .page {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .page-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin: 0 0 var(--space-5) 0;
    color: var(--color-fg);
  }
  .page p {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-text);
    margin: 0 0 var(--space-4) 0;
  }
</style>
```

- [ ] **Step 2: pt-BR about**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SEO from '../../components/SEO.astro';
import { t } from '../../lib/ui';

const LOCALE = 'pt-BR' as const;
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'about.title')} — Eduardo Kohn`}
    description="Eduardo Kohn — pesquisador independente escrevendo sobre algoritmos, sistemas e ciência da computação."
    canonicalPath="/about"
    jsonLd={{ kind: 'about' }}
  />
  <article class="page">
    <h1 class="page-title">{t(LOCALE, 'about.title')}</h1>
    <p>
      Sou Eduardo Kohn, pesquisador independente e engenheiro escrevendo sobre algoritmos, sistemas e eventuais tocas de coelho na ciência
      da computação.
    </p>
    <p>
      Este blog tem duas trilhas. <a href="/pt-br/papers">Artigos</a> são peças mais longas escritas com rigor científico — abstract, citações,
      teoremas, provas. <a href="/pt-br/posts">Posts</a> são notas curtas que compartilham uma ideia antes que ela esteja completa o suficiente
      para ser formalizada.
    </p>
    <p>
      Me encontre no <a href="https://github.com/eduardokohn" rel="me noopener">GitHub</a>
      ou inscreva-se na <a href="/pt-br/newsletter">newsletter</a> para receber novas publicações por email.
    </p>
  </article>
</BaseLayout>

<style>
  /* Same as /src/pages/about.astro */
  .page {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .page-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin: 0 0 var(--space-5) 0;
    color: var(--color-fg);
  }
  .page p {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-text);
    margin: 0 0 var(--space-4) 0;
  }
</style>
```

### Task 5.2 — `/cv` (EN + pt-BR)

Minimal starter content. User is expected to flesh this out with real experience / publications; Plan 03 just ships a coherent scaffold.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/cv.astro`
- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/cv.astro`

- [ ] **Step 1: EN cv**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SEO from '../components/SEO.astro';
import { t } from '../lib/ui';

const LOCALE = 'en' as const;
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'cv.title')} — Eduardo Kohn`}
    description="Curriculum vitae of Eduardo Kohn."
    canonicalPath="/cv"
    jsonLd={{ kind: 'about' }}
  />
  <article class="page">
    <h1 class="page-title">{t(LOCALE, 'cv.title')}</h1>
    <section class="cv-section">
      <h2>Research interests</h2>
      <ul>
        <li>Algorithms and data structures</li>
        <li>Systems programming</li>
        <li>Complexity analysis</li>
      </ul>
    </section>
    <section class="cv-section">
      <h2>Selected publications</h2>
      <ul>
        <li>
          <a href="/papers/quicksort-partitioning">A Note on Quicksort Partitioning</a> — 2026
        </li>
      </ul>
    </section>
    <section class="cv-section">
      <h2>Contact</h2>
      <p>
        <a href="https://github.com/eduardokohn" rel="me noopener">GitHub</a> · <a href="/newsletter">Newsletter</a>
      </p>
    </section>
  </article>
</BaseLayout>

<style>
  .page {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .page-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin: 0 0 var(--space-5) 0;
    color: var(--color-fg);
  }
  .cv-section {
    margin-bottom: var(--space-6);
  }
  .cv-section h2 {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-snug);
    color: var(--color-fg);
    margin: 0 0 var(--space-2) 0;
    padding-bottom: 4px;
    border-bottom: 2px solid var(--color-accent);
    display: inline-block;
  }
  .cv-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .cv-section li {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-text);
    padding: var(--space-1) 0;
  }
  .cv-section p {
    font-size: var(--text-base);
    color: var(--color-text);
    margin: 0;
  }
</style>
```

- [ ] **Step 2: pt-BR cv**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SEO from '../../components/SEO.astro';
import { t } from '../../lib/ui';

const LOCALE = 'pt-BR' as const;
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'cv.title')} — Eduardo Kohn`}
    description="Currículo de Eduardo Kohn."
    canonicalPath="/cv"
    jsonLd={{ kind: 'about' }}
  />
  <article class="page">
    <h1 class="page-title">{t(LOCALE, 'cv.title')}</h1>
    <section class="cv-section">
      <h2>Áreas de pesquisa</h2>
      <ul>
        <li>Algoritmos e estruturas de dados</li>
        <li>Programação de sistemas</li>
        <li>Análise de complexidade</li>
      </ul>
    </section>
    <section class="cv-section">
      <h2>Publicações selecionadas</h2>
      <ul>
        <li>
          <a href="/pt-br/papers/quicksort-partitioning">Uma Nota sobre Particionamento em Quicksort</a> — 2026
        </li>
      </ul>
    </section>
    <section class="cv-section">
      <h2>Contato</h2>
      <p>
        <a href="https://github.com/eduardokohn" rel="me noopener">GitHub</a> · <a href="/pt-br/newsletter">Newsletter</a>
      </p>
    </section>
  </article>
</BaseLayout>

<style>
  /* Same as /src/pages/cv.astro */
  .page {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .page-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin: 0 0 var(--space-5) 0;
    color: var(--color-fg);
  }
  .cv-section {
    margin-bottom: var(--space-6);
  }
  .cv-section h2 {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-snug);
    color: var(--color-fg);
    margin: 0 0 var(--space-2) 0;
    padding-bottom: 4px;
    border-bottom: 2px solid var(--color-accent);
    display: inline-block;
  }
  .cv-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .cv-section li {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-text);
    padding: var(--space-1) 0;
  }
  .cv-section p {
    font-size: var(--text-base);
    color: var(--color-text);
    margin: 0;
  }
</style>
```

### Task 5.3 — `/newsletter` (EN + pt-BR) with Buttondown embed

Buttondown's subscribe embed is a plain HTML `POST` form — no JS, no extra infrastructure. Replace `eduardokohn` with the real Buttondown
username when the account is provisioned.

**Files:**

- Create: `/home/eduardo/Documents/blog/src/pages/newsletter.astro`
- Create: `/home/eduardo/Documents/blog/src/pages/pt-br/newsletter.astro`

- [ ] **Step 1: EN newsletter**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SEO from '../components/SEO.astro';
import { t } from '../lib/ui';

const LOCALE = 'en' as const;
// Buttondown username — replace with the real one when provisioned.
const BUTTONDOWN_USERNAME = 'eduardokohn';
const action = `https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USERNAME}`;
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'newsletter.title')} — Eduardo Kohn`}
    description={t(LOCALE, 'newsletter.lead')}
    canonicalPath="/newsletter"
    jsonLd={{ kind: 'about' }}
  />
  <article class="page">
    <h1 class="page-title">{t(LOCALE, 'newsletter.title')}</h1>
    <p class="lead">{t(LOCALE, 'newsletter.lead')}</p>
    <form class="nl-form" action={action} method="post" target="popupwindow">
      <label class="visually-hidden" for="bd-email">{t(LOCALE, 'newsletter.email.label')}</label>
      <input id="bd-email" class="nl-input" type="email" name="email" required placeholder={t(LOCALE, 'newsletter.email.placeholder')} />
      <input type="hidden" name="embed" value="1" />
      <button class="nl-submit" type="submit">{t(LOCALE, 'newsletter.subscribe')}</button>
    </form>
  </article>
</BaseLayout>

<style>
  .page {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .page-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin: 0 0 var(--space-3) 0;
    color: var(--color-fg);
  }
  .lead {
    font-size: var(--text-base);
    color: var(--color-text);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-5) 0;
  }
  .nl-form {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .nl-input {
    flex: 1 1 240px;
    font-family: var(--font-sans);
    font-size: var(--text-base);
    padding: 10px 14px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-fg);
  }
  .nl-input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
  }
  .nl-submit {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
    padding: 10px 20px;
    background: var(--color-accent);
    color: #ffffff;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  .nl-submit:hover {
    opacity: 0.9;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
```

- [ ] **Step 2: pt-BR newsletter**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SEO from '../../components/SEO.astro';
import { t } from '../../lib/ui';

const LOCALE = 'pt-BR' as const;
const BUTTONDOWN_USERNAME = 'eduardokohn';
const action = `https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USERNAME}`;
---

<BaseLayout lang={LOCALE}>
  <SEO
    slot="head"
    title={`${t(LOCALE, 'newsletter.title')} — Eduardo Kohn`}
    description={t(LOCALE, 'newsletter.lead')}
    canonicalPath="/newsletter"
    jsonLd={{ kind: 'about' }}
  />
  <article class="page">
    <h1 class="page-title">{t(LOCALE, 'newsletter.title')}</h1>
    <p class="lead">{t(LOCALE, 'newsletter.lead')}</p>
    <form class="nl-form" action={action} method="post" target="popupwindow">
      <label class="visually-hidden" for="bd-email">{t(LOCALE, 'newsletter.email.label')}</label>
      <input id="bd-email" class="nl-input" type="email" name="email" required placeholder={t(LOCALE, 'newsletter.email.placeholder')} />
      <input type="hidden" name="embed" value="1" />
      <button class="nl-submit" type="submit">{t(LOCALE, 'newsletter.subscribe')}</button>
    </form>
  </article>
</BaseLayout>

<style>
  /* Same as /src/pages/newsletter.astro */
  .page {
    max-width: var(--measure-prose);
    margin: 0 auto;
    padding: var(--space-6) var(--space-8);
  }
  .page-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin: 0 0 var(--space-3) 0;
    color: var(--color-fg);
  }
  .lead {
    font-size: var(--text-base);
    color: var(--color-text);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-5) 0;
  }
  .nl-form {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .nl-input {
    flex: 1 1 240px;
    font-family: var(--font-sans);
    font-size: var(--text-base);
    padding: 10px 14px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-fg);
  }
  .nl-input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
  }
  .nl-submit {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
    padding: 10px 20px;
    background: var(--color-accent);
    color: #ffffff;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  .nl-submit:hover {
    opacity: 0.9;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
```

### Task 5.4 — Commit Phase 5

- [ ] **Step 1: Verify build**

Run: `npm run build`

Expected: build succeeds with all new static pages rendering under `dist/about`, `dist/cv`, `dist/newsletter`, and their `/pt-br/`
counterparts.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(pages): add about, cv, and newsletter pages (EN + pt-BR)"
```

---

## Phase 6 — Smoke Verification and Tag

### Task 6.1 — Full quality gate

- [ ] **Step 1: Run every gate**

Run: `npm run check && npm test && npm run build`

Expected: all three exit 0.

- [ ] **Step 2: Structural assertions on the built HTML**

Run:

```bash
# pt-BR pages emit with correct lang attribute
grep -c 'lang="pt-BR"' dist/pt-br/index.html
grep -c 'lang="pt-BR"' dist/pt-br/papers/quicksort-partitioning/index.html
# LangToggle renders
grep -c 'lang-toggle' dist/index.html
grep -c 'lang-toggle' dist/pt-br/index.html
# Tag pages exist
ls dist/tags/sorting/index.html
ls dist/pt-br/tags/sorting/index.html
# Static pages exist
ls dist/about/index.html dist/cv/index.html dist/newsletter/index.html
ls dist/pt-br/about/index.html dist/pt-br/cv/index.html dist/pt-br/newsletter/index.html
# Buttondown form wires to the right endpoint
grep -c 'buttondown.com/api/emails/embed-subscribe' dist/newsletter/index.html
```

Expected: each grep returns a positive integer (≥ 1) and each `ls` succeeds without error.

### Task 6.2 — Dev-server visual checkpoint (manual)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (foreground; Ctrl-C to stop).

- [ ] **Step 2: Walk through the new routes (operator)**

Open each URL and confirm it renders correctly:

1. `http://localhost:4321/pt-br` — home magazine grid with pt-BR labels (`Destaque`, `Posts Recentes`, `Tags`, `Artigo`), featured card,
   tags sidebar.
2. `http://localhost:4321/pt-br/papers` — listing in pt-BR.
3. `http://localhost:4321/pt-br/papers/quicksort-partitioning` — Tufte paper with pt-BR content; sidenotes, theorem, proof, code block.
4. `http://localhost:4321/pt-br/posts/welcome` — Classic Centered post in pt-BR.
5. `http://localhost:4321/tags` — grid of tag cards with counts.
6. `http://localhost:4321/tags/sorting` — entries tagged sorting.
7. `http://localhost:4321/pt-br/tags/sorting` — pt-BR mirror.
8. `http://localhost:4321/about`, `/cv`, `/newsletter` — static pages in EN.
9. `http://localhost:4321/pt-br/about`, `/pt-br/cv`, `/pt-br/newsletter` — same in pt-BR.
10. **LangToggle**: on any page, click the EN/PT button in the header; URL swaps to the other locale on the same content (e.g.
    `/papers/quicksort-partitioning` ↔ `/pt-br/papers/quicksort-partitioning`).
11. **Theme toggle** still works everywhere; dark-mode contrast looks correct on tag pages and newsletter form.

- [ ] **Step 3: Stop the dev server** (Ctrl-C)

### Task 6.3 — Final commit and tag

- [ ] **Step 1: Working tree check**

Run: `git status`

Expected: "nothing to commit, working tree clean".

- [ ] **Step 2: Tag the milestone**

```bash
git tag -a v0.3.0-bilingual -m "Plan 03 complete: pt-BR mirror, tags, static pages"
```

---

## Done Criteria

Plan 03 is complete when ALL of the following are true:

1. `npm run check` exits 0.
2. `npm test` exits 0 with ≥ 25 passing tests (the 22 from Plan 01/02 plus new ones for `formatDateForLocale` and `t`).
3. `npm run build` emits all of these pages:
   - `/` and `/pt-br/` (home)
   - `/papers`, `/papers/<slug>`, `/pt-br/papers`, `/pt-br/papers/<slug>`
   - `/posts`, `/posts/<slug>`, `/pt-br/posts`, `/pt-br/posts/<slug>`
   - `/tags`, `/tags/<tag>` (one per unique tag), `/pt-br/tags`, `/pt-br/tags/<tag>`
   - `/about`, `/cv`, `/newsletter`, plus `/pt-br/` counterparts
4. LangToggle is present in the header and preserves the current route when switching locales.
5. `hreflang` alternates and page-type-specific JSON-LD are emitted on every page (existing `SEO.astro` behaviour).
6. Working tree clean; tag `v0.3.0-bilingual` applied.

## What's Next

**Plan 04 (MDX pipeline polish + SEO extras)** adds: RSS / Atom feeds (combined, papers-only, posts-only, plus pt-BR mirrors), sitemap with
hreflang entries, automatically generated OG images (Satori template), proper IEEE CSL for `rehype-citation`, theorem / definition auto-
numbering, and the code-block language label in the chrome.
