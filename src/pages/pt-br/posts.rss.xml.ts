import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { buildRssItems, feedMetaForLocale } from '../../lib/rss';

export async function GET(context: APIContext) {
  const items = await buildRssItems('posts', 'pt-BR');
  const meta = feedMetaForLocale('pt-BR', 'posts');
  return rss({
    title: meta.title,
    description: meta.description,
    site: context.site ?? 'https://kohn.dev',
    items,
    customData: `<language>pt-BR</language>`,
  });
}
