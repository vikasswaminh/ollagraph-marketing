import { defineConfig } from "astro/config";

// Static-site build that mirrors the original hand-written HTML.
// Sitemap is hand-curated at public/sitemap.xml so it stays under
// our control (the @astrojs/sitemap integration has a known
// incompatibility with our Astro 4.16 + asset-handling shape).
export default defineConfig({
  site: "https://ollagraph.com",
  output: "static",
  compressHTML: false,
});
