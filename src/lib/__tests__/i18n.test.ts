import { describe, expect, it } from 'vitest';
import { localePrefix, localizedPath, stripLocalePrefix, detectLocaleFromPath, alternateUrls } from '../i18n';

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
  it('handles root (no trailing slash on non-default locale)', () => {
    // Astro's trailingSlash: 'never' — pt-BR root is '/pt-br', not '/pt-br/'.
    expect(localizedPath('/', 'pt-BR')).toBe('/pt-br');
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

  it('handles the root path without trailing slash on pt-BR', () => {
    expect(alternateUrls('/')).toEqual({
      en: '/',
      'pt-BR': '/pt-br',
    });
    expect(alternateUrls('/pt-br')).toEqual({
      en: '/',
      'pt-BR': '/pt-br',
    });
  });
});

import { formatDateForLocale } from '../i18n';

describe('formatDateForLocale', () => {
  const d = new Date('2026-03-14T00:00:00Z');

  it('formats an EN long date in UTC', () => {
    expect(formatDateForLocale(d, 'en')).toBe('March 14, 2026');
  });

  it('formats a pt-BR long date in UTC', () => {
    expect(formatDateForLocale(d, 'pt-BR')).toBe('14 de março de 2026');
  });

  it('is timezone-invariant (UTC boundary)', () => {
    const boundary = new Date('2026-01-01T00:00:00Z');
    expect(formatDateForLocale(boundary, 'en')).toMatch(/January 1, 2026/);
  });
});
