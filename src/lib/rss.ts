// src/lib/rss.ts
// Build per-locale RSS feeds for one collection or both merged. Returns the
// array of items ready for `@astrojs/rss` rss() — the caller is responsible
// for calling rss({ items: await buildRssItems(...), ... }) in a Response
// handler.
import type { RSSFeedItem } from '@astrojs/rss';
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
