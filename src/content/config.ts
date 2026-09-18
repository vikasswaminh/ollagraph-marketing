import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    metaTitle: z.string().optional(),
    'meta-title': z.string().optional(),
    meta_title: z.string().optional(),
    metaDescription: z.string().optional(),
    'meta-description': z.string().optional(),
    meta_description: z.string().optional(),
    primaryKeyword: z.string().optional(),
    'primary-keyword': z.string().optional(),
    primary_keyword: z.string().optional(),
    'Primary SEO Keyword': z.string().optional(),
    'Primary SEO Keywords': z.string().optional(),
    secondaryKeywords: z.array(z.string()).or(z.string()).optional(),
    'secondary-keywords': z.array(z.string()).or(z.string()).optional(),
    secondary_keywords: z.array(z.string()).or(z.string()).optional(),
    'Secondary SEO Keyword': z.array(z.string()).or(z.string()).optional(),
    'Secondary SEO Keywords': z.array(z.string()).or(z.string()).optional(),
    'SEO Keywords': z.array(z.string()).or(z.string()).optional(),
    keywords: z.array(z.string()).or(z.string()).optional(),
  }),
});

export const collections = { blog };
