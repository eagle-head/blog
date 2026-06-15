// src/lib/open-source.ts
// Pure, dependency-free ordering for the Open Source page's two data
// collections (libraries + contributions). Kept free of `astro:content` so the
// comparators are unit-testable in isolation (mirrors lib/content.ts and
// lib/zoom.ts); the pages call getCollection() and sort with these. The orders
// are total and deterministic so the static build output never depends on the
// file() loader's on-disk read order.

/** Library fields the ordering depends on — a structural subset of the
 *  `libraries` collection's data. */
export interface LibrarySortFields {
  featured: boolean;
  order: number;
  stars: number;
  name: string;
}

/** Contribution fields the ordering depends on — a structural subset of the
 *  `contributions` collection's data. */
export interface ContributionSortFields {
  significance: 'flagship' | 'notable';
  order: number;
}

const SIGNIFICANCE_RANK: Record<ContributionSortFields['significance'], number> = {
  flagship: 0,
  notable: 1,
};

/**
 * Libraries: featured first, then ascending `order`, then descending star
 * count, finally alphabetical by name.
 */
export function sortLibraries(a: LibrarySortFields, b: LibrarySortFields): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.order !== b.order) return a.order - b.order;
  if (a.stars !== b.stars) return b.stars - a.stars;
  return a.name.localeCompare(b.name);
}

/**
 * Contributions: flagship projects first, then ascending `order`.
 */
export function sortContributions(a: ContributionSortFields, b: ContributionSortFields): number {
  const rank = SIGNIFICANCE_RANK[a.significance] - SIGNIFICANCE_RANK[b.significance];
  if (rank !== 0) return rank;
  return a.order - b.order;
}
