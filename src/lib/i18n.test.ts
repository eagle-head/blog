import { describe, expect, it } from 'vitest';
import {
  localePrefix,
  localizedPath,
  stripLocalePrefix,
  detectLocaleFromPath,
  alternateUrls,
} from './i18n';

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
