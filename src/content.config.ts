import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
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

export const collections = { papers, posts };
