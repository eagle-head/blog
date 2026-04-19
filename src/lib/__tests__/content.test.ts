import { describe, expect, it } from 'vitest';
import { parseEntryId, groupBySlug, assertAllLocalesPresent, assertSharedFieldsMatch } from '../content';

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
      a: { en: { id: 'a/en', data: {} }, 'pt-BR': { id: 'a/pt-BR', data: {} } },
    };
    expect(() => assertAllLocalesPresent(groups, 'papers')).not.toThrow();
  });

  it('throws listing missing locales', () => {
    const groups = { a: { en: { id: 'a/en', data: {} } } };
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
