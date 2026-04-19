import { getCollection, type CollectionEntry } from 'astro:content';
import {
  assertAllLocalesPresent,
  assertSharedFieldsMatch,
  groupBySlug,
  SHARED_FIELDS,
  type AnyCollection,
  type EntryLike,
  type GroupedEntries,
} from './content';

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
  assertSharedFieldsMatch(
    groups,
    SHARED_FIELDS[name] as readonly (keyof CollectionEntry<C>['data'])[],
  );
  return groups;
}
