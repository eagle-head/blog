export type Locale = 'en' | 'pt-BR';
export const LOCALES: readonly Locale[] = ['en', 'pt-BR'] as const;

// Precomputed lowercase → canonical map so parseEntryId is O(1) per call.
// Astro's glob loader lowercases entry IDs ("pt-BR.mdx" → "pt-br"), so every
// parse needs this reverse lookup; doing it as a Map beats re-running
// LOCALES.find(...) on each entry.
const LOCALE_FROM_LOWER = new Map<string, Locale>(LOCALES.map((l) => [l.toLowerCase(), l]));

export type EntryLike<T = unknown> = {
  id: string;
  data: T;
};

// Groups are generic over the full entry type E, not just E['data'], so that
// callers passing richer entries (e.g. Astro's CollectionEntry with body,
// collection, rendered) keep those properties on the grouped output.
export type EntryGroup<E extends EntryLike = EntryLike> = Partial<Record<Locale, E>>;
export type GroupedEntries<E extends EntryLike = EntryLike> = Record<string, EntryGroup<E>>;

export function parseEntryId(id: string): { slug: string; locale: Locale } {
  const idx = id.lastIndexOf('/');
  if (idx < 0) throw new Error(`invalid entry id (no '/'): ${id}`);
  const slug = id.slice(0, idx);
  const rawLocale = id.slice(idx + 1);
  const canonical = LOCALE_FROM_LOWER.get(rawLocale.toLowerCase());
  if (!canonical) {
    throw new Error(`unknown locale in entry id '${id}': ${rawLocale}`);
  }
  return { slug, locale: canonical };
}

export function groupBySlug<E extends EntryLike>(entries: ReadonlyArray<E>): GroupedEntries<E> {
  const out: GroupedEntries<E> = {};
  for (const entry of entries) {
    const { slug, locale } = parseEntryId(entry.id);
    (out[slug] ??= {})[locale] = entry;
  }
  return out;
}

export function assertAllLocalesPresent<E extends EntryLike>(
  groups: GroupedEntries<E>,
  collection: string,
  required: readonly Locale[] = LOCALES,
): void {
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

export function assertSharedFieldsMatch<E extends EntryLike<Record<string, unknown>>>(
  groups: GroupedEntries<E>,
  fields: readonly (keyof E['data'])[],
): void {
  const problems: string[] = [];
  for (const [slug, group] of Object.entries(groups)) {
    collectSharedFieldMismatches(slug, group, fields, problems);
  }
  if (problems.length) {
    throw new Error(`Shared-field mismatch across locales:\n  - ${problems.join('\n  - ')}`);
  }
}

// Compare every non-base locale of a single group against the first locale,
// appending one problem message per differing field. Kept as a helper so the
// public `assertSharedFieldsMatch` reads as a flat loop over groups.
function collectSharedFieldMismatches<E extends EntryLike<Record<string, unknown>>>(
  slug: string,
  group: EntryGroup<E>,
  fields: readonly (keyof E['data'])[],
  problems: string[],
): void {
  const locales = Object.keys(group) as Locale[];
  if (locales.length < 2) return;
  const [baseLocale, ...otherLocales] = locales;
  const baseEntry = group[baseLocale]!;
  for (const otherLocale of otherLocales) {
    const otherEntry = group[otherLocale]!;
    for (const field of fields) {
      const key = field as string;
      if (!fieldEquals(baseEntry.data[key], otherEntry.data[key])) {
        problems.push(`${slug}: field '${key}' differs between ${baseLocale} and ${otherLocale}`);
      }
    }
  }
}

export type AnyCollection = 'papers' | 'posts';

export const SHARED_FIELDS: Record<AnyCollection, readonly string[]> = {
  papers: ['publishedAt', 'tags', 'status'],
  posts: ['publishedAt', 'tags', 'status'],
};

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
