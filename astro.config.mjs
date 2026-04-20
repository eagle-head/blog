// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';

import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';
import rehypeCitation from 'rehype-citation';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// https://astro.build/config
export default defineConfig({
  site: 'https://kohn.dev',
  output: 'static',
  trailingSlash: 'never',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-BR'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
    remarkPlugins: [remarkGfm, remarkMath, remarkDirective],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      rehypeKatex,
      [rehypeMermaid, { strategy: 'inline-svg' }],
      [
        rehypeCitation,
        {
          // 'vancouver' uses numbered citations ([1], [2]) — visually
          // closest to IEEE among the built-in presets. True IEEE
          // formatting requires a CSL XML file; deferred to Plan 04.
          csl: 'vancouver',
          linkCitations: true,
        },
      ],
    ],
  },

  integrations: [mdx(), preact(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
