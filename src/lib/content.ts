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

export function assertAllLocalesPresent<T>(
  groups: GroupedEntries<T>,
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
    throw new Error(
      `Missing translations in collection '${collection}':\n  - ${problems.join('\n  - ')}`,
    );
  }
}

export function assertSharedFieldsMatch<T extends Record<string, unknown>>(
  groups: GroupedEntries<T>,
  fields: readonly (keyof T)[],
): void {
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
  if (
    a &&
    b &&
    typeof a === 'object' &&
    typeof b === 'object' &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const ak = Object.keys(a as object).sort();
    const bk = Object.keys(b as object).sort();
    if (ak.length !== bk.length || ak.some((k, i) => k !== bk[i])) return false;
    return ak.every((k) =>
      fieldEquals((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    );
  }
  return a === b;
}
