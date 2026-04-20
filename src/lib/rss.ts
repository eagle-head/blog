// src/lib/rss.ts
// Build per-locale RSS feeds and expose `createRssHandler(source, locale)` so
// each feed route (e.g. src/pages/rss.xml.ts) is a one-line GET export.
import rss from '@astrojs/rss';
import type { RSSFeedItem } from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getLocalizedEntries } from './collections';
import type { Locale } from './content';
import { localePrefix } from './i18n';

export type FeedSource = 'papers' | 'posts' | 'both';

export async function buildRssItems(source: FeedSource, locale: Locale): Promise<RSSFeedItem[]> {
  const prefix = localePrefix(locale);
  const items: RSSFeedItem[] = [];

  if (source === 'papers' || source === 'both') {
    const papers = await getLocalizedEntries('papers', locale);
    for (const { slug, entry } of papers) {
      items.push({
        title: entry.data.title,
        pubDate: entry.data.publishedAt,
        description: entry.data.abstract,
        link: `${prefix}/papers/${slug}`,
        categories: entry.data.tags,
      });
    }
  }
  if (source === 'posts' || source === 'both') {
    const posts = await getLocalizedEntries('posts', locale);
    for (const { slug, entry } of posts) {
      items.push({
        title: entry.data.title,
        pubDate: entry.data.publishedAt,
        description: entry.data.lead,
        link: `${prefix}/posts/${slug}`,
        categories: entry.data.tags,
      });
    }
  }

  items.sort((a, b) => {
    const aT = a.pubDate ? a.pubDate.getTime() : 0;
    const bT = b.pubDate ? b.pubDate.getTime() : 0;
    return bT - aT;
  });
  return items;
}

export function feedMetaForLocale(locale: Locale, source: FeedSource) {
  const titles: Record<Locale, Record<FeedSource, string>> = {
    en: {
      both: 'Eduardo Kohn — All',
      papers: 'Eduardo Kohn — Papers',
      posts: 'Eduardo Kohn — Posts',
    },
    'pt-BR': {
      both: 'Eduardo Kohn — Tudo',
      papers: 'Eduardo Kohn — Artigos',
      posts: 'Eduardo Kohn — Posts',
    },
  };
  const descriptions: Record<Locale, Record<FeedSource, string>> = {
    en: {
      both: 'Papers and posts on computer science.',
      papers: 'Computer-science papers by Eduardo Kohn.',
      posts: 'Short technical posts by Eduardo Kohn.',
    },
    'pt-BR': {
      both: 'Artigos e posts sobre ciência da computação.',
      papers: 'Artigos científicos por Eduardo Kohn.',
      posts: 'Posts técnicos curtos por Eduardo Kohn.',
    },
  };
  return {
    title: titles[locale][source],
    description: descriptions[locale][source],
  };
}

/**
 * Factory for an Astro route handler that emits a locale-specific RSS feed
 * for a given source. Each feed route file (e.g. src/pages/rss.xml.ts)
 * becomes a one-liner: `export const GET = createRssHandler('both', 'en');`.
 */
export function createRssHandler(source: FeedSource, locale: Locale) {
  return async function GET(context: APIContext) {
    const [items, meta] = await Promise.all([
      buildRssItems(source, locale),
      Promise.resolve(feedMetaForLocale(locale, source)),
    ]);
    return rss({
      title: meta.title,
      description: meta.description,
      site: context.site ?? 'https://kohn.dev',
      items,
      customData: `<language>${locale}</language>`,
    });
  };
}
