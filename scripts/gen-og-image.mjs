// Rasterize the hand-designed 1200x630 OG card (public/og-image.svg) to PNG.
// Social platforms (X, LinkedIn, Slack, iMessage) don't render SVG og:image,
// so we ship a PNG. Re-run after editing og-image.svg: node scripts/gen-og-image.mjs
import sharp from 'sharp';
await sharp('public/og-image.svg', { density: 144 })
  .resize(1200, 630, { fit: 'fill' })
  .png()
  .toFile('public/og-image.png');
console.log('wrote public/og-image.png');
