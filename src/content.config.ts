import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const LOCALES = ['en', 'pt-BR'] as const;
const localeSchema = z.enum(LOCALES);

const authorSchema = z.object({
  name: z.string().min(1),
  affiliation: z.string().optional(),
  orcid: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/)
    .optional(),
  email: z.email().optional(),
});

const statusSchema = z.enum(['draft', 'published']);

const papers = defineCollection({
  loader: glob({
    pattern: '**/{en,pt-BR}.mdx',
    base: './src/content/papers',
  }),
  schema: ({ image: _image }) =>
    z.object({
      title: z.string().min(1),
      abstract: z.string().min(150).max(300),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      authors: z.array(authorSchema).min(1),
      tags: z.array(z.string()).min(1),
      language: localeSchema,
      keywords: z.array(z.string()).optional(),
      doi: z.string().optional(),
      status: statusSchema,
      bibliography: z.string().default('./references.bib'),
      comments: z.boolean().default(true),
    }),
});

const posts = defineCollection({
  loader: glob({
    pattern: '**/{en,pt-BR}.mdx',
    base: './src/content/posts',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      lead: z.string().min(80).max(160),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      tags: z.array(z.string()).min(1),
      language: localeSchema,
      status: statusSchema,
      heroImage: image().optional(),
      series: z.object({ id: z.string(), order: z.number().int().nonnegative() }).optional(),
      comments: z.boolean().default(true),
    }),
});

// Localized prose carried inside a record, not as sibling locale files. The
// `file()` loader yields ONE flat record list shared by both locale pages, so
// it cannot use the glob dual-{en,pt-BR}.mdx pattern; per-record human text
// lives here instead. Both keys are required so a missing translation fails the
// build, reproducing the glob collections' assertAllLocalesPresent guarantee.
const i18nProse = z.object({
  en: z.string().min(1),
  'pt-BR': z.string().min(1),
});

// Open-source portfolio data — authored libraries. Hand-curated JSON read off
// disk (no build-time GitHub/npm calls), so the static build stays hermetic.
const libraries = defineCollection({
  loader: file('./src/content/open-source/libraries.json'),
  schema: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    repoUrl: z.url(),
    language: z.string().min(1),
    stars: z.number().int().nonnegative(),
    registry: z.string().optional(),
    packageUrl: z.url().optional(),
    tags: z.array(z.string()).min(1),
    summary: i18nProse,
    featured: z.boolean().default(false),
    order: z.number().int().default(0),
  }),
});

// Open-source portfolio data — upstream contributions, grouped by project.
const contributions = defineCollection({
  loader: file('./src/content/open-source/contributions.json'),
  schema: z.object({
    id: z.string().min(1),
    project: z.string().min(1),
    projectSlug: z.string().min(1),
    projectUrl: z.url(),
    blurb: i18nProse,
    significance: z.enum(['flagship', 'notable']),
    order: z.number().int().default(0),
    prs: z
      .array(
        z.object({
          number: z.number().int().positive(),
          title: z.string().min(1),
          url: z.url(),
          state: z.enum(['merged', 'open']),
        }),
      )
      .min(1),
  }),
});

export const collections = { papers, posts, libraries, contributions };
