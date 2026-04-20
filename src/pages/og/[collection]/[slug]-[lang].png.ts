// src/pages/og/[collection]/[slug]-[lang].png.ts
import type { APIContext, APIRoute, GetStaticPaths } from 'astro';
import { getValidatedCollection } from '../../../lib/collections';
import { renderOgImage } from '../../../lib/og';

type Params = { collection: 'papers' | 'posts'; slug: string; lang: 'en' | 'pt-br' };

export const getStaticPaths: GetStaticPaths = async () => {
  const [papers, posts] = await Promise.all([getValidatedCollection('papers'), getValidatedCollection('posts')]);
  const out: { params: Params }[] = [];
  for (const [slug] of Object.entries(papers)) {
    out.push({ params: { collection: 'papers', slug, lang: 'en' } });
    out.push({ params: { collection: 'papers', slug, lang: 'pt-br' } });
  }
  for (const [slug] of Object.entries(posts)) {
    out.push({ params: { collection: 'posts', slug, lang: 'en' } });
    out.push({ params: { collection: 'posts', slug, lang: 'pt-br' } });
  }
  return out;
};

export const GET: APIRoute = async (context: APIContext) => {
  const { collection, slug, lang } = context.params as unknown as Params;
  const locale = lang === 'pt-br' ? ('pt-BR' as const) : ('en' as const);

  if (collection === 'papers') {
    const groups = await getValidatedCollection('papers');
    const entry = groups[slug!]?.[locale];
    if (!entry) return new Response('Not found', { status: 404 });
    const png = await renderOgImage({
      kind: 'paper',
      title: entry.data.title,
      description: entry.data.abstract,
      date: entry.data.publishedAt,
      locale,
    });
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  } else {
    const groups = await getValidatedCollection('posts');
    const entry = groups[slug!]?.[locale];
    if (!entry) return new Response('Not found', { status: 404 });
    const png = await renderOgImage({
      kind: 'post',
      title: entry.data.title,
      description: entry.data.lead,
      date: entry.data.publishedAt,
      locale,
    });
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  }
};
