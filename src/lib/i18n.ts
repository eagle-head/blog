import type { Locale } from './content';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'pt-BR'];

/** Path prefix for a locale ("" for default, "/pt-br" for pt-BR). */
export function localePrefix(locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return '';
  return `/${locale.toLowerCase()}`;
}

/** Produce a full path for a given locale. `path` should be canonical (EN). */
export function localizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const prefix = localePrefix(locale);
  if (!prefix) return normalized;
  // Root of a non-default locale is just the prefix (e.g. '/pt-br') — matches
  // Astro's `trailingSlash: 'never'` config so the toggle lands on a canonical URL.
  if (normalized === '/') return prefix;
  return `${prefix}${normalized}`;
}

/** Remove a locale prefix from a path, returning the canonical (EN) form. */
export function stripLocalePrefix(path: string): string {
  for (const loc of LOCALES) {
    const prefix = localePrefix(loc);
    if (!prefix) continue;
    if (path === prefix) return '/';
    if (path === `${prefix}/`) return '/';
    if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length);
  }
  return path;
}

/** Detect which locale a path belongs to based on its prefix. */
export function detectLocaleFromPath(path: string): Locale {
  for (const loc of LOCALES) {
    const prefix = localePrefix(loc);
    if (!prefix) continue;
    if (path === prefix || path.startsWith(`${prefix}/`)) return loc;
  }
  return DEFAULT_LOCALE;
}

/** Map of locale → URL for every locale, given any path. */
export function alternateUrls(path: string): Record<Locale, string> {
  const canonical = stripLocalePrefix(path);
  return {
    en: localizedPath(canonical, 'en'),
    'pt-BR': localizedPath(canonical, 'pt-BR'),
  };
}

/** Format a Date as a long calendar date for the given locale in UTC. */
export function formatDateForLocale(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
