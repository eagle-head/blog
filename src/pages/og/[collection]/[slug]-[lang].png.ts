// src/pages/og/[collection]/[slug]-[lang].png.ts
import type { APIContext, APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getValidatedCollection } from '../../../lib/collections';
import { renderOgImage } from '../../../lib/og';

type Params = { collection: 'papers' | 'posts'; slug: string; lang: 'en' | 'pt-br' };
type Props = { kind: 'paper'; entry: CollectionEntry<'papers'> } | { kind: 'post'; entry: CollectionEntry<'posts'> };

export const getStaticPaths: GetStaticPaths = async () => {
  const [papers, posts] = await Promise.all([getValidatedCollection('papers'), getValidatedCollection('posts')]);
  const out: { params: Params; props: Props }[] = [];
  for (const [slug, group] of Object.entries(papers)) {
    for (const [locale, lang] of [
      ['en', 'en'],
      ['pt-BR', 'pt-br'],
    ] as const) {
      const entry = group[locale];
      if (!entry) continue;
      out.push({
        params: { collection: 'papers', slug, lang },
        props: { kind: 'paper', entry },
      });
    }
  }
  for (const [slug, group] of Object.entries(posts)) {
    for (const [locale, lang] of [
      ['en', 'en'],
      ['pt-BR', 'pt-br'],
    ] as const) {
      const entry = group[locale];
      if (!entry) continue;
      out.push({
        params: { collection: 'posts', slug, lang },
        props: { kind: 'post', entry },
      });
    }
  }
  return out;
};

export const GET: APIRoute = async (context: APIContext) => {
  const { lang } = context.params as unknown as Params;
  const { kind, entry } = context.props as Props;
  const locale = lang === 'pt-br' ? ('pt-BR' as const) : ('en' as const);

  const png = await renderOgImage({
    kind,
    title: entry.data.title,
    description:
      kind === 'paper'
        ? (entry.data as CollectionEntry<'papers'>['data']).abstract
        : (entry.data as CollectionEntry<'posts'>['data']).lead,
    date: entry.data.publishedAt,
    locale,
  });
  // Convert Node Buffer to Uint8Array so it satisfies the fetch Response
  // BufferSource type in strict TypeScript builds.
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
