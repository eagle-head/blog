import { getCollection, type CollectionEntry } from 'astro:content';
import {
  assertAllLocalesPresent,
  assertSharedFieldsMatch,
  groupBySlug,
  SHARED_FIELDS,
  type AnyCollection,
  type GroupedEntries,
  type Locale,
} from './content';

export async function getValidatedCollection<C extends AnyCollection>(
  name: C,
  opts: { includeDrafts?: boolean } = {},
): Promise<GroupedEntries<CollectionEntry<C>>> {
  const all = (await getCollection(name, (entry) => {
    if (opts.includeDrafts) return true;
    return (entry.data as { status?: string }).status === 'published';
  })) as CollectionEntry<C>[];

  const groups = groupBySlug(all);
  assertAllLocalesPresent(groups, name);
  assertSharedFieldsMatch(
    groups as GroupedEntries<CollectionEntry<C> & { data: Record<string, unknown> }>,
    SHARED_FIELDS[name] as readonly (keyof CollectionEntry<C>['data'])[],
  );
  return groups;
}

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
 * Papers + posts that include `tag`, for `locale`. Returned with a
 * `kind` discriminator so the listing can label each entry.
 */
export type TaggedEntry =
  | { kind: 'paper'; slug: string; entry: CollectionEntry<'papers'> }
  | { kind: 'post'; slug: string; entry: CollectionEntry<'posts'> };

export async function getEntriesByTag(tag: string, locale: Locale): Promise<TaggedEntry[]> {
  const [papers, posts] = await Promise.all([
    getLocalizedEntries('papers', locale),
    getLocalizedEntries('posts', locale),
  ]);
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
