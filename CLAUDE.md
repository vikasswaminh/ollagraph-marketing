# Working on this site

You are helping a **non-technical writer** publish blog posts for **ollagraph.com**.
This folder (`/root/site`) IS the live marketing site.

## Rule #1 — never run git, npm, build, or deploy commands

Just create and edit files, and save them. That is the whole job.
Saving is enough: this box auto-commits and the site rebuilds and goes **live by itself**
about 60-90 seconds after the last save. There is no preview and no approval step —
**what you save gets published.** Do not run `git`, `npm run build`, `wrangler`, or any
deploy command. They are not needed and will only cause confusion.

## Adding a blog post = TWO files, always

1. **The post itself** — `src/pages/blog/<slug>.astro`
2. **The index entry** — add one line to the `posts` array in `src/data/posts.ts`

Skip step 2 and the post silently never appears on the /blog page.
The `slug` in `posts.ts` MUST equal the filename without `.astro`.

### Post template (`src/pages/blog/my-post.astro`)

```astro
---
import Article from '../../layouts/Article.astro';

const faqs = [
  { q: "A question a reader would actually ask?", a: "A direct, complete answer in 2-4 sentences." },
];
---
<Article
  title="The headline shown on the post and in search results"
  description="One or two sentences. Shown on the blog index and in search results."
  date="2026-07-17"
  readingTime={10}
  tags={["tag one", "tag two"]}
  kind="blog"
  faqs={faqs}
>
  <p>First paragraph.</p>
  <h2>A section heading</h2>
  <p>More writing.</p>
</Article>
```

### Matching entry in `src/data/posts.ts`

Add to the top of the `posts` array (newest first):

```ts
{ slug: "my-post", title: "The same headline", description: "The same description", date: "2026-07-17", readingTime: 10, tags: ["tag one", "tag two"] },
```

## Conventions

- **Read an existing post first** (e.g. `src/pages/blog/aeo-vs-seo-2026.astro`) and match its shape.
- The body is **HTML** inside the layout — `<p>`, `<h2>`, `<ul><li>` — **not markdown**.
- `date` is `YYYY-MM-DD`. `readingTime` is whole minutes. `kind="blog"` always.
- `faqs` is optional but every existing post has them — they generate FAQ rich-results
  for SEO, so include 4-6 real questions with self-contained answers.
- `title` and `description` are the SEO surface. Write them for a human searching.

## Do not touch

`astro.config.mjs`, `package.json`, `functions/`, `scripts/`, `src/layouts/`,
`src/chrome.ts`, `src/components/` — that is site infrastructure, not content.
If a request seems to need changes there, tell the writer to ask the infra team instead.
