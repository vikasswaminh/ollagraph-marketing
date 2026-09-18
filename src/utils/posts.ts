import { getCollection, type CollectionEntry } from 'astro:content';
import { LEGACY_BLOG_POSTS } from '../data/legacyPosts';

export interface UnifiedPost {
  slug: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    tags: string[];
    author?: string;
  };
  minutes: number;
}

/** All non-draft markdown posts (drafts hidden in production builds), newest first. */
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true,
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** All blog posts combined: 58 markdown posts + 45 unique legacy astro posts, sorted newest first. */
export async function getAllBlogPosts(): Promise<UnifiedPost[]> {
  const mdPosts = await getPublishedPosts();
  const mdItems: UnifiedPost[] = mdPosts.map((p) => ({
    slug: p.slug,
    data: {
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      tags: p.data.tags || [],
      author: p.data.author || 'Ollagraph Engineering',
    },
    minutes: readingTime(p.body),
  }));

  const legacyItems: UnifiedPost[] = LEGACY_BLOG_POSTS.map((p) => ({
    slug: p.slug,
    data: {
      title: p.title,
      description: p.description,
      pubDate: new Date(p.pubDate),
      tags: p.tags,
      author: 'Ollagraph Engineering',
    },
    minutes: p.readingTime,
  }));

  return [...mdItems, ...legacyItems].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

/** Rough reading time in minutes from raw markdown body. */
export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Related posts for a given post, ranked by shared tags then recency.
 * Excludes the post itself. Returns up to `limit` results.
 */
export function getRelatedPosts(
  post: CollectionEntry<'blog'>,
  all: CollectionEntry<'blog'>[],
  limit = 3,
): CollectionEntry<'blog'>[] {
  const tags = new Set(post.data.tags ?? []);
  const scored = all
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const shared = (p.data.tags ?? []).filter((t) => tags.has(t)).length;
      return { post: p, shared };
    })
    .sort((a, b) => b.shared - a.shared || b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf());

  return scored.slice(0, limit).map((s) => s.post);
}
