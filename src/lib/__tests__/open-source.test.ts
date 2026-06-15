import { describe, it, expect } from 'vitest';
import { sortLibraries, sortContributions, type LibrarySortFields, type ContributionSortFields } from '../open-source';

function lib(overrides: Partial<LibrarySortFields>): LibrarySortFields {
  return { featured: false, order: 0, stars: 0, name: '', ...overrides };
}

function contrib(overrides: Partial<ContributionSortFields>): ContributionSortFields {
  return { significance: 'notable', order: 0, ...overrides };
}

describe('sortLibraries', () => {
  it('orders featured before non-featured', () => {
    expect(sortLibraries(lib({ featured: true }), lib({ featured: false }))).toBeLessThan(0);
    expect(sortLibraries(lib({ featured: false }), lib({ featured: true }))).toBeGreaterThan(0);
  });

  it('orders by ascending order within the same featured flag', () => {
    expect(sortLibraries(lib({ order: 1 }), lib({ order: 2 }))).toBeLessThan(0);
    expect(sortLibraries(lib({ order: 3 }), lib({ order: 2 }))).toBeGreaterThan(0);
  });

  it('breaks an order tie by descending stars', () => {
    expect(sortLibraries(lib({ order: 0, stars: 18 }), lib({ order: 0, stars: 2 }))).toBeLessThan(0);
    expect(sortLibraries(lib({ order: 0, stars: 0 }), lib({ order: 0, stars: 5 }))).toBeGreaterThan(0);
  });

  it('breaks a stars tie alphabetically by name', () => {
    expect(sortLibraries(lib({ name: 'aaa' }), lib({ name: 'bbb' }))).toBeLessThan(0);
    expect(sortLibraries(lib({ name: 'zzz' }), lib({ name: 'aaa' }))).toBeGreaterThan(0);
    expect(sortLibraries(lib({ name: 'same' }), lib({ name: 'same' }))).toBe(0);
  });

  it('sorts a shuffled list into the expected total order', () => {
    const input = [
      lib({ name: 'erli18n', featured: false, order: 1, stars: 0 }),
      lib({ name: 'timekeeper', featured: false, order: 0, stars: 18 }),
      lib({ name: 'hero', featured: true, order: 5, stars: 1 }),
    ];
    expect([...input].sort(sortLibraries).map((l) => l.name)).toEqual(['hero', 'timekeeper', 'erli18n']);
  });
});

describe('sortContributions', () => {
  it('orders flagship before notable', () => {
    expect(sortContributions(contrib({ significance: 'flagship' }), contrib({ significance: 'notable' }))).toBeLessThan(
      0,
    );
    expect(
      sortContributions(contrib({ significance: 'notable' }), contrib({ significance: 'flagship' })),
    ).toBeGreaterThan(0);
  });

  it('orders by ascending order within the same significance', () => {
    expect(
      sortContributions(
        contrib({ significance: 'flagship', order: 0 }),
        contrib({ significance: 'flagship', order: 1 }),
      ),
    ).toBeLessThan(0);
    expect(
      sortContributions(contrib({ significance: 'notable', order: 2 }), contrib({ significance: 'notable', order: 1 })),
    ).toBeGreaterThan(0);
  });

  it('treats identical records as equal', () => {
    expect(
      sortContributions(
        contrib({ significance: 'flagship', order: 3 }),
        contrib({ significance: 'flagship', order: 3 }),
      ),
    ).toBe(0);
  });

  it('sorts a shuffled list flagship-first then by order', () => {
    const input = [
      contrib({ significance: 'notable', order: 4 }),
      contrib({ significance: 'flagship', order: 1 }),
      contrib({ significance: 'flagship', order: 0 }),
      contrib({ significance: 'notable', order: 3 }),
    ];
    expect([...input].sort(sortContributions).map((c) => `${c.significance}:${c.order}`)).toEqual([
      'flagship:0',
      'flagship:1',
      'notable:3',
      'notable:4',
    ]);
  });
});
