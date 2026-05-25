import { defineConfig } from "astro/config";

// Static-site build that mirrors the original hand-written HTML.
// No integrations needed — everything we ship is plain HTML/CSS/JS.
export default defineConfig({
  output: "static",
  compressHTML: false,
});
