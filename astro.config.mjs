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
      // Dark Always — brief §5.6. Code blocks stay on GitHub Dark
      // regardless of the page light/dark mode.
      theme: 'github-dark',
      wrap: true,
      transformers: [
        {
          // Extract `title="filename.ext"` from the fence meta string and
          // expose it on the <pre> as data-filename so CSS can render
          // the macOS-style chrome (traffic lights + filename) via ::before.
          name: 'code-block-chrome',
          pre(node) {
            // Shiki stores the raw fence meta on `options.meta.__raw`.
            // Fall back to `options.meta` if it's a plain string
            // (Astro/MDX pipelines vary slightly).
            const metaObj = this.options?.meta;
            let raw = '';
            if (typeof metaObj === 'string') {
              raw = metaObj;
            } else if (metaObj && typeof metaObj === 'object') {
              const m = /** @type {{ __raw?: unknown }} */ (metaObj).__raw;
              raw = typeof m === 'string' ? m : '';
            }
            const match = raw.match(/title=["']([^"']+)["']/);
            if (match) {
              node.properties['data-filename'] = match[1];
            }
            const lang = this.options?.lang;
            if (typeof lang === 'string' && lang) {
              node.properties['data-lang'] = lang;
            }
          },
        },
      ],
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
